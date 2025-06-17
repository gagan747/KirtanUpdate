import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSamagamSchema,
  insertRecordedSamagamSchema,
  insertLocationSchema,
  users,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { db } from "./db";
import { setupAuthRoutes, authenticate, requireAdmin } from "./jwt-auth";
import { upload, handleMulterError } from "./middlewares/upload";
import { uploadImageBuffer } from "./cloudinary";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup JWT authentication routes
  setupAuthRoutes(app);

  // Test endpoint for CORS and DB connectivity
  app.get("/api/test", async (_req, res) => {
    try {
      // Check database connectivity
      const dbTest = await db.select().from(users).limit(1);
      res.json({
        message: "API working!",
        cors: "enabled",
        database: "connected",
        dbResult: dbTest,
      });
    } catch (error) {
      console.error("Database test error:", error);
      res.status(500).json({
        message: "API working, but database error!",
        cors: "enabled",
        database: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Samagam routes
  app.get("/api/samagams", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    try {
      const { samagams, total } = await storage.getPaginatedSamagams(
        limit,
        offset,
      );
      res.json({
        samagams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching samagams:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  // Calendar endpoint for upcoming samagams - must be before :id route
  app.get("/api/samagams/calendar", async (req, res) => {
    console.log("Calendar API endpoint called");
    try {
      const calendarSamagams = await storage.getCalendarSamagams();
      console.log("Calendar API response:", calendarSamagams);
      res.json(calendarSamagams);
    } catch (error) {
      console.error("Error fetching calendar samagams:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal Server Error",
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.get("/api/samagams/:id", async (req, res) => {
    const samagam = await storage.getSamagam(parseInt(req.params.id));
    if (!samagam) return res.status(404).json({ message: "Samagam not found" });
    res.json(samagam);
  });

  //use multer storage option if concurrent users upload image concurrently as when storage is selected ,the file streams from client write in to storage chunk by chunk and then we can use it furhter,here if we dont provide storage then defualt in memory storage is used all chunks are added to memory and memory become occupied, but according to current use case it is fine as admin only uploaad that
  app.post(
    "/api/samagams",
    authenticate,
    requireAdmin,
    upload.single("image"),
    handleMulterError,
    async (req: Request, res: Response) => {
      try {
        // The form data is in req.body as JSON string
        let formData;
        try {
          formData = req.body.data ? JSON.parse(req.body.data) : req.body;
        } catch (error) {
          formData = req.body; // If not JSON string, use as is
        }

        // Validate the form data
        const validatedData = insertSamagamSchema.parse(formData);

        // Handle image upload if present
        if (req.file) {
          try {
            // Upload image directly to Cloudinary
            const imageUrl = await uploadImageBuffer(req.file.buffer);
            validatedData.imageUrl = imageUrl;
          } catch (imageError) {
            console.error("Image upload error:", imageError);
            return res.status(500).json({
              message:
                imageError instanceof Error
                  ? imageError.message
                  : "Error uploading image",
            });
          }
        }

        // Create samagam with data (including image URL if uploaded)
        const samagam = await storage.createSamagam(validatedData);
        res.status(201).json(samagam);
      } catch (error) {
        console.error("Samagam creation error:", error);
        if (error instanceof ZodError) {
          res.status(400).json({ message: fromZodError(error).message });
        } else {
          res.status(500).json({
            message:
              error instanceof Error ? error.message : "Internal Server Error",
          });
        }
      }
    },
  );

  app.patch(
    "/api/samagams/:id",
    authenticate,
    requireAdmin,
    upload.single("image"),
    handleMulterError,
    async (req: Request, res: Response) => {
      try {
        // The form data is in req.body as JSON string
        let formData;
        try {
          formData = req.body.data ? JSON.parse(req.body.data) : req.body;
        } catch (error) {
          formData = req.body; // If not JSON string, use as is
        }

        // Validate the form data
        const validatedData = insertSamagamSchema.parse(formData);

        // Handle image upload if present
        if (req.file) {
          try {
            // Upload image directly to Cloudinary
            const imageUrl = await uploadImageBuffer(req.file.buffer);
            validatedData.imageUrl = imageUrl;
          } catch (imageError) {
            console.error("Image upload error:", imageError);
            return res.status(500).json({
              message:
                imageError instanceof Error
                  ? imageError.message
                  : "Error uploading image",
            });
          }
        }

        const samagam = await storage.updateSamagam(
          parseInt(req.params.id),
          validatedData,
        );

        if (!samagam)
          return res.status(404).json({ message: "Samagam not found" });
        res.json(samagam);
      } catch (error) {
        console.error("Samagam update error:", error);
        if (error instanceof ZodError) {
          res.status(400).json({ message: fromZodError(error).message });
        } else {
          res.status(500).json({
            message:
              error instanceof Error ? error.message : "Internal Server Error",
          });
        }
      }
    },
  );

  app.delete(
    "/api/samagams/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {
      const deleted = await storage.deleteSamagam(parseInt(req.params.id));
      if (!deleted)
        return res.status(404).json({ message: "Samagam not found" });
      res.status(204).send();
    },
  );

  // Recorded Samagam routes
  app.get("/api/recorded-samagams", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;

    try {
      const { recordedSamagams, total } =
        await storage.getPaginatedRecordedSamagams(limit, offset);
      res.json({
        recordedSamagams,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching recorded samagams:", error);
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  });

  app.post(
    "/api/recorded-samagams",
    authenticate,
    requireAdmin,
    async (req, res) => {
      try {
        const validatedData = insertRecordedSamagamSchema.parse({
          ...req.body,
          ...(req?.body?.date ? { date: new Date(req.body.date) } : {}),
        });
        const recordedSamagam = await storage.createRecordedSamagam(
          validatedData,
          req.user!.id,
        );
        res.status(201).json(recordedSamagam);
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ message: fromZodError(error).message });
        } else {
          console.error("Error creating recorded samagam:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      }
    },
  );

  app.patch(
    "/api/recorded-samagams/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {
      try {
        const validatedData = insertRecordedSamagamSchema.parse({
          ...req.body,
          ...(req?.body?.date ? { date: new Date(req.body.date) } : {}),
        });
        const recordedSamagam = await storage.updateRecordedSamagam(
          parseInt(req.params.id),
          validatedData,
        );
        if (!recordedSamagam)
          return res
            .status(404)
            .json({ message: "Recorded Samagam not found" });
        res.json(recordedSamagam);
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ message: fromZodError(error).message });
        } else {
          console.error("Error updating recorded samagam:", error);
          res.status(500).json({ message: "Internal Server Error" });
        }
      }
    },
  );

  app.delete(
    "/api/recorded-samagams/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {
      const deleted = await storage.deleteRecordedSamagam(
        parseInt(req.params.id),
      );
      if (!deleted)
        return res.status(404).json({ message: "Recorded Samagam not found" });
      res.status(204).send();
    },
  );

  // Location routes
  app.get("/api/locations", async (_req, res) => {
    const locations = await storage.getAllLocations();
    res.json(locations);
  });

  app.post("/api/locations", authenticate, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(
        validatedData,
        req.user!.id,
      );
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.patch(
    "/api/locations/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {
      try {
        const validatedData = insertLocationSchema.parse(req.body);
        const location = await storage.updateLocation(
          parseInt(req.params.id),
          validatedData,
        );
        if (!location)
          return res.status(404).json({ message: "Location not found" });
        res.json(location);
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({ message: fromZodError(error).message });
        } else {
          res.status(500).json({ message: "Internal Server Error" });
        }
      }
    },
  );

  app.delete(
    "/api/locations/:id",
    authenticate,
    requireAdmin,
    async (req, res) => {
      const deleted = await storage.deleteLocation(parseInt(req.params.id));
      if (!deleted)
        return res.status(404).json({ message: "Location not found" });
      res.status(204).send();
    },
  );

  // FCM Token routes
  app.post("/api/fcm-tokens", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "FCM token is required" });
      }
      // Assuming req.user is populated by the authenticate middleware and has an id property
      const fcmToken = await storage.saveFcmToken(token);
      res.status(201).json(fcmToken);
    } catch (error) {
      console.error("Error saving FCM token:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.delete("/api/fcm-tokens/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ message: "FCM token is required" });
      }
      const deleted = await storage.deleteFcmToken(token);
      if (!deleted) {
        return res.status(404).json({ message: "Token not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting FCM token:", error);
      res.status(500).json({ message: "Failed to delete FCM token" });
    }
  });

  app.get(
    "/api/fcm-tokens/check/:token",
    async (req: Request, res: Response) => {
      try {
        const { token } = req.params;
        if (!token) {
          return res.status(400).json({ message: "FCM token is required" });
        }
        const exists = await storage.checkFcmTokenExists(token);
        res.json({ exists });
      } catch (error) {
        console.error("Error checking FCM token:", error);
        res.status(500).json({ message: "Failed to check FCM token" });
      }
    },
  );

  // Gurmat Camp Registration routes
  const gurmatCampSchema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.string().min(1, "Age is required"),
    gender: z.string().min(1, "Gender is required"),
    address: z.string().min(1, "Address is required"),
    fatherName: z.string().min(1, "Father's name is required"),
    motherName: z.string().min(1, "Mother's name is required"),
    contactNumber: z.string().min(10, "Contact number must be at least 10 digits"),
    email: z.string().email("Invalid email address")
  });

  app.post("/api/gurmat-camp", async (req, res) => {
    try {
      const validatedData = gurmatCampSchema.parse(req.body);
      
      // Check if email already exists
      const existingRegistration = await storage.getGurmatCampRegistrationByEmail(validatedData.email);
      if (existingRegistration) {
        return res.status(400).json({ message: "Registration failed: email already exists" });
      }
      
      const registration = await storage.createGurmatCampRegistration(validatedData);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error("Error creating gurmat camp registration:", error);
        res.status(500).json({ 
          message: error instanceof Error ? error.message : "Internal Server Error" 
        });
      }
    }
  });

  app.get("/api/gurmat-camp", authenticate, requireAdmin, async (_req, res) => {
    try {
      const registrations = await storage.getAllGurmatCampRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching gurmat camp registrations:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
