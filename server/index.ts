import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cookieParser from 'cookie-parser';
import admin from 'firebase-admin';
import { registerRoutes } from "./routes";
import { storage } from "./storage"; // Import storage
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configure CORS - more permissive for development
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 
                  'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'Referer', 'Referrer-Policy']
};

app.use(cors(corsOptions));
 
// Add preflight OPTIONS handler
app.options('*', cors(corsOptions));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Firebase Admin SDK
  // try {
  //   const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');
  //   if (fs.existsSync(serviceAccountPath)) {
  //     const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  //     admin.initializeApp({
  //       credential: admin.credential.cert(serviceAccount),
  //     });
  //     log('Firebase Admin SDK initialized successfully.');

  //     // Function to send periodic notifications
  //     const sendPeriodicNotifications = async () => {
  //       try {
  //         const tokens = await storage.getFcmTokens();
  //         if (tokens.length === 0) {
  //           log('No FCM tokens found. Skipping notification send.');
  //           return;
  //         }

  //         const deviceTokens = tokens.map(t => t.token).filter(t => t); // Ensure tokens are not null or empty

  //         if (deviceTokens.length === 0) {
  //           log('No valid FCM device tokens found. Skipping notification send.');
  //           return;
  //         }

  //         const message = {
  //           notification: {
  //             title: 'Kirtan Connect Update',
  //             body: 'Check out the latest Kirtan updates and schedules!',
  //           },
  //           // data: { // Optional: any custom data to send with the notification
  //           //   screen: 'home',
  //           // },
  //         };

  //         log(`Attempting to send notification to ${deviceTokens.length} tokens.`);
          
  //         // Create a list of messages to send
  //         const messages: admin.messaging.Message[] = deviceTokens.map(token => ({
  //           notification: message.notification,
  //           token: token,
  //           // data: message.data, // If you have data
  //         }));

  //         if (messages.length === 0) {
  //           log('No messages to send after mapping tokens. Skipping.');
  //           return;
  //         }

  //         const response = await admin.messaging().sendEach(messages); // sendEach is an alias for sendEachForMulticast
          
  //         log(`Notifications sent: ${response.successCount} successful, ${response.failureCount} failed.`);

  //         if (response.failureCount > 0) {
  //           response.responses.forEach((resp, idx) => {
  //             if (!resp.success) {
  //               const failedToken = deviceTokens[idx]; // Get the token from the original deviceTokens array
  //               log(`Failed to send notification to token ${failedToken}: ${resp.error?.message} (Code: ${resp.error?.code})`);
  //               if (resp.error?.code === 'messaging/registration-token-not-registered' ||
  //                   resp.error?.code === 'messaging/invalid-registration-token') {
  //                 log(`Token ${failedToken} is invalid. Consider removing it.`);
  //                 // if (failedToken) await storage.deleteFcmToken(failedToken); // Uncomment to auto-delete invalid tokens
  //               }
  //             }
  //           });
  //         }
  //       } catch (error) {
  //         console.error('Error sending periodic notifications:', error);
  //         log(`Error sending periodic notifications: ${error instanceof Error ? error.message : String(error)}`);
  //       }
  //     };

  //     // Send notifications every 10 minutes (600000 ms)
  //     const NOTIFICATION_INTERVAL = 10 * 60 * 1000;
  //     setInterval(sendPeriodicNotifications, NOTIFICATION_INTERVAL);
  //     log(`Periodic notifications scheduled every ${NOTIFICATION_INTERVAL / 60000} minutes.`);
  //     // Optionally, send one immediately on startup for testing
  //     // sendPeriodicNotifications();

  //   } else {
  //     log('Firebase service account key (firebase-service-account.json) not found. Push notifications will not work.');
  //     console.warn('Firebase service account key (firebase-service-account.json) not found. Push notifications will not work.');
  //   }
  // } catch (error) {
  //   console.error('Failed to initialize Firebase Admin SDK:', error);
  //   log(`Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : String(error)}`);
  // }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
