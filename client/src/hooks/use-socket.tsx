import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./use-auth";
import { SERVER_URL } from "@/utils/constants";

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  isBroadcasting: boolean;
  connectedUsers: {
    id: string;
    role: "ANONYMOUS" | "USER" | "ADMIN";
  }[];
  startBroadcast: () => void;
  stopBroadcast: () => void;
  joinBroadcast: () => void;
  broadcastError: string | null;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<
    { id: string; role: "ANONYMOUS" | "USER" | "ADMIN" }[]
  >([]);
  const { user } = useAuth();

  useEffect(() => {
    // Disconnect existing socket if any
    if (socketRef.current) {
      console.log("Disconnecting existing socket due to user change");
      socketRef.current.disconnect();
    }

    try {
      // Initialize Socket.io connection
      const socketInstance = io(SERVER_URL || window.location.origin, {
        withCredentials: true,
        auth: {
          user: user ? JSON.stringify(user) : null,
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // Set socketRef as soon as we create the instance
      socketRef.current = socketInstance;

      // Set up event listeners
      socketInstance.on("connect", () => {
        setIsConnected(true);
        setBroadcastError(null);
        console.log("Connected to socket server with ID:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        console.log("Disconnected from socket server");
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socketInstance.on("users_update", (users) => {
        setConnectedUsers(users);
      });

      socketInstance.on("broadcast_started", () => {
        setIsBroadcasting(true);
        setBroadcastError(null);
        console.log("Broadcast started event received");
      });

      socketInstance.on("broadcast_stopped", (room) => {
        setIsBroadcasting(false);
        console.log("Broadcast stopped event received");
        // socketRef?.current?.leave(room);
      });

      socketInstance.on("broadcast_error", (errorMessage) => {
        setBroadcastError(errorMessage);
        console.error("Broadcast error:", errorMessage);
      });

      socketInstance.on("joined_broadcast_success", () => {
        setBroadcastError(null);
        console.log("Successfully joined broadcast");
      });

      // Clean up on unmount or when user changes
      return () => {
        console.log("Cleaning up socket connection");
        socketInstance.disconnect();
        socketRef.current = null;
      };
    } catch (error) {
      console.error("Error setting up socket:", error);
      return () => {}; // Empty cleanup if setup failed
    }
  }, [user]); // Re-create socket when user changes

  const startBroadcast = () => {
    if (socketRef.current && user?.isAdmin) {
      socketRef.current.emit("start_broadcast");
    }
  };

  const stopBroadcast = () => {
    if (socketRef.current && user?.isAdmin) {
      socketRef.current.emit("stop_broadcast");
    }
  };

  const joinBroadcast = () => {
    if (socketRef.current) {
      socketRef.current.emit("join_broadcast");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        isBroadcasting,
        connectedUsers,
        startBroadcast,
        stopBroadcast,
        joinBroadcast,
        broadcastError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
}
