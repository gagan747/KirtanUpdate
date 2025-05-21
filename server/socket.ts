import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import { verifyToken } from "./jwt-auth";
import { storage } from "./storage";
import { log } from "./vite";
import { randomUUID } from "crypto";

interface ConnectedUser {
  id: string;
  role: "ANONYMOUS" | "USER" | "ADMIN";
}

interface UserData {
  id: number;
  username: string;
  name: string;
  isAdmin: boolean;
}

export function setupSocketServer(httpServer: HttpServer) {
  // Initialize socket.io with CORS settings
  const io = new Server(httpServer, {
    cors: {
      origin: ["https://admin.socket.io", true], // Allow admin UI and other origins
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Setup Socket.IO Admin UI
  instrument(io, {
    auth: false,
    mode: process.env.NODE_ENV === "production" ? "production" : "development",
    readonly: false, // Allow full control in admin UI
  });

  // Store connected users
  const connectedUsers = new Map<string, ConnectedUser>();

  // Track the broadcast interval to avoid multiple intervals
  let broadcastInterval: NodeJS.Timeout | null = null;

  // Helper function to broadcast online users to all clients
  const broadcastOnlineUsers = () => {
    // Clean up disconnected sockets
    for (const socketId of connectedUsers.keys() as any) {
      if (!io.sockets.sockets.has(socketId)) {
        log(`Socket ${socketId} not found, removing from connected users`);
        connectedUsers.delete(socketId);
      }
    }

    // Broadcast current users list to all clients
    io.emit("users_update", Array.from(connectedUsers.values()));
    log("Online users broadcast sent to all clients");
  };

  // Setup the broadcast interval only once
  const setupBroadcastInterval = () => {
    if (!broadcastInterval) {
      log("Setting up broadcast interval for online users");
      broadcastInterval = setInterval(broadcastOnlineUsers, 10000); // Every 10 seconds
    }
  };

  const handleStartBroadcast = async (socket) => {
    if (socket.data.role === "ADMIN") {
      // Generate a unique room name
      const roomName = `broadcast-${randomUUID()}`;

      try {
        // Create broadcast entry in database
        await storage.createLiveBroadcast(socket.id, roomName);

        // Join the admin to the room
        socket.join(roomName);

        // Notify all clients that broadcast has started
        io.emit("broadcast_started");

        log(`Broadcast started by admin: ${socket.id} in room: ${roomName}`);
      } catch (error) {
        log(`Error starting broadcast: ${error}`);
        socket.emit("broadcast_error", "Failed to start broadcast");
      }
    }
  };

  const handleStopBroadcast = async (socket) => {
    if (socket.data.role === "ADMIN") {
      try {
        // Get current broadcast
        const broadcasts = await storage.getLiveBroadcasts();

        if (broadcasts.length > 0) {
          const broadcast = broadcasts[0];

          // Leave the room
          socket.leave(broadcast.roomName);

          // Remove broadcast from database
          await storage.deleteLiveBroadcastBySocketId(socket.id);

          // Notify all clients that broadcast has stopped
          io.emit("broadcast_stopped");
          io.in(broadcast?.roomName).socketsLeave(broadcast?.roomName);

          log(`Broadcast stopped by admin: ${socket.id}`);
        }
      } catch (error) {
        log(`Error stopping broadcast: ${error}`);
      }
    }
  };

  const handleJoinBroadcast = async (socket) => {
    try {
      // Get current broadcast
      const broadcasts = await storage.getLiveBroadcasts();

      if (broadcasts.length > 0) {
        const broadcast = broadcasts[0];

        // Join the room
        socket.join(broadcast.roomName);
        log(`User ${socket.id} joined broadcast room: ${broadcast.roomName}`);
        socket.emit("joined_broadcast_success");
      } else {
        socket.emit("broadcast_error", "No active broadcast found");
      }
    } catch (error) {
      log(`Error joining broadcast: ${error}`);
      socket.emit("broadcast_error", "Failed to join broadcast");
    }
  };

  // Middleware to authenticate users
  io.use(async (socket, next) => {
    const userJson = socket.handshake.auth.user;

    // Try to parse user data if present
    if (userJson) {
      try {
        const parsedData = JSON.parse(userJson) as Partial<UserData>;

        if (
          parsedData &&
          parsedData.id !== undefined &&
          typeof parsedData.isAdmin === "boolean"
        ) {
          log(
            `User data received for socket ${socket.id}: ${parsedData.username}`,
          );

          // Set socket role based on admin status
          socket.data.role = parsedData.isAdmin ? "ADMIN" : "USER";
          socket.data.userId = parsedData.id;
          socket.data.username = parsedData.username || "unknown";
        }
      } catch (e) {
        log(`Error parsing user data: ${e}`);
      }
    } else {
      socket.data.role = "ANONYMOUS";
    }
    next();
  });

  // Helper function to check broadcast status
  const getBroadcastStatus = async () => {
    try {
      const broadcasts = await storage.getLiveBroadcasts();
      return broadcasts.length > 0;
    } catch (error) {
      log(`Error checking broadcast status: ${error}`);
      return false;
    }
  };

  // Helper function to broadcast current status to all clients
  const broadcastCurrentStatus = async () => {
    const isActive = await getBroadcastStatus();
    io.emit(isActive ? "broadcast_started" : "broadcast_stopped");
    return isActive;
  };

  // Setup the broadcast interval when server starts
  setupBroadcastInterval();

  // Handle new connections
  io.on("connection", async (socket: Socket) => {
    log(`Socket connected: ${socket.id} - Role: ${socket.data.role}`);

    // Add user to connected users map
    connectedUsers.set(socket.id, {
      id: socket.id,
      role: socket.data.role || "ANONYMOUS",
    });

    // Send initial broadcast status to the new user
    try {
      const isActive = await getBroadcastStatus();
      socket.emit(isActive ? "broadcast_started" : "broadcast_stopped");
    } catch (error) {
      log(`Error sending initial broadcast status: ${error}`);
    }

    // Immediately broadcast online users to all clients
    broadcastOnlineUsers();

    // Handler functions - defined separately to make removal easier

    // Handle broadcast start (admin only)
    socket.on("start_broadcast", () => handleStartBroadcast(socket));

    // Handle broadcast stop (admin only)
    socket.on("stop_broadcast", () => handleStopBroadcast(socket));

    // Handle user joining a broadcast
    socket.on("join_broadcast", () => handleJoinBroadcast(socket));

    // Handle disconnection and cleanup
    socket.on("disconnect", async () => {
      log(`Socket disconnected: ${socket.id}`);

      // Remove all listeners specific to this socket to prevent memory leaks
      socket.removeAllListeners("start_broadcast");
      socket.removeAllListeners("stop_broadcast");
      socket.removeAllListeners("join_broadcast");

      // If the disconnected user was broadcasting, remove the broadcast
      if (socket.data.role === "ADMIN") {
        try {
          const broadcasts = await storage.getLiveBroadcasts();
          let broadcast;

          if (broadcasts.length) broadcast = broadcasts[0];

          const deleted = await storage.deleteLiveBroadcastBySocketId(
            socket.id,
          );

          if (deleted) {
            // Notify all clients that broadcast has stopped
            io.emit("broadcast_stopped");
            broadcast?.roomName &&
              io.in(broadcast?.roomName).socketsLeave(broadcast?.roomName);
            log(`Broadcast stopped due to admin disconnect: ${socket.id}`);
          }
        } catch (error) {
          log(`Error handling admin disconnect: ${error}`);
        }
      }

      // Remove user from connected users map
      connectedUsers.delete(socket.id);

      // Update connected users list for all clients
      broadcastOnlineUsers();
      log(`User ${socket.id} removed from connected users`);
    });
  });

  // Handle server shutdown - cleanup the interval
  // const cleanup = () => {
  //   if (broadcastInterval) {
  //     clearInterval(broadcastInterval);
  //     broadcastInterval = null;
  //     log('Socket server shutdown, cleared broadcast interval');
  //   }
  // };

  // // Attach cleanup to process events
  // process.on('SIGINT', cleanup);
  // process.on('SIGTERM', cleanup);

  log("Socket.io server initialized");
  return io;
}
