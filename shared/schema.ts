import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const samagams = pgTable("samagams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  timeFrom: text("time_from").notNull(),
  timeTo: text("time_to").notNull(),
  location: text("location").notNull(),
  organizer: text("organizer").notNull(),
  contactInfo: text("contact_info").notNull(),
  imageUrl: text("image_url"),
  color: text("color").notNull().default("#3B82F6"), // Default blue color
});

export const recordedSamagams = pgTable("recorded_samagams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  date: timestamp("date").notNull(),
  addedBy: integer("added_by").references(() => users.id),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  coordinates: json("coordinates").notNull(), // {lat: number, lng: number}
  description: text("description"),
  addedBy: integer("added_by").references(() => users.id),
});

export const fcmTokens = pgTable("fcm_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsed: timestamp("last_used").defaultNow().notNull(),
});

// Live Broadcast table
export const liveBroadcasts = pgTable("live_broadcasts", {
  id: serial("id").primaryKey(),
  socketId: text("socket_id").notNull(),
  roomName: text("room_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Gurmat Camp Registration Schema
export const gurmatCampRegistrations = pgTable("gurmat_camp_registrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: text("age").notNull(),
  gender: text("gender").notNull(),
  address: text("address").notNull(),
  fatherName: text("father_name").notNull(),
  motherName: text("mother_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Media table (clone of recorded samagams but for Google Drive links)
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  driveUrl: text("drive_url").notNull(), // Google Drive public link
  mediaType: text("media_type").notNull(), // 'image' or 'video'
  date: timestamp("date").notNull(),
  addedBy: integer("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertSamagamSchema = createInsertSchema(samagams)
  .pick({
    title: true,
    description: true,
    date: true,
    timeFrom: true,
    timeTo: true,
    location: true,
    organizer: true,
    contactInfo: true,
    imageUrl: true,
    color: true,
  })
  .extend({
    date: z.coerce.date(), // Coerce date to handle string inputs
  });

export const insertRecordedSamagamSchema = createInsertSchema(
  recordedSamagams,
  {
    title: (fieldSchema) =>
      fieldSchema.min(1, { message: "Title cannot be empty" }),
    description: (fieldSchema) =>
      fieldSchema.min(1, { message: "Description cannot be empty" }),
    youtubeUrl: (fieldSchema) =>
      fieldSchema.min(1, { message: "YouTube URL cannot be empty" }),
    // date is handled by extend below
  },
)
  .pick({
    title: true,
    description: true,
    youtubeUrl: true,
    date: true, // Ensure date is picked before extending
  })
  .extend({
    date: z.coerce.date(), // Coerce date after picking and potential customization
  });

export const insertLocationSchema = createInsertSchema(locations).pick({
  name: true,
  address: true,
  coordinates: true,
  description: true,
});

export const insertFcmTokenSchema = createInsertSchema(fcmTokens).pick({
  token: true,
});

export const insertMediaSchema = createInsertSchema(media, {
  title: (fieldSchema) =>
    fieldSchema.min(1, { message: "Title cannot be empty" }),
  description: (fieldSchema) =>
    fieldSchema.min(1, { message: "Description cannot be empty" }),
  driveUrl: (fieldSchema) =>
    fieldSchema.min(1, { message: "Google Drive URL cannot be empty" }),
  mediaType: (fieldSchema) =>
    fieldSchema.refine((val) => val === 'image' || val === 'video', {
      message: "Media type must be either 'image' or 'video'",
    }),
})
  .pick({
    title: true,
    description: true,
    driveUrl: true,
    mediaType: true,
    date: true,
  })
  .extend({
    date: z.coerce.date(),
  });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSamagam = z.infer<typeof insertSamagamSchema>;
export type Samagam = typeof samagams.$inferSelect;
export type InsertRecordedSamagam = z.infer<typeof insertRecordedSamagamSchema>;
export type RecordedSamagam = typeof recordedSamagams.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertFcmToken = z.infer<typeof insertFcmTokenSchema>;
export type FcmToken = typeof fcmTokens.$inferSelect;
export type LiveBroadcast = typeof liveBroadcasts.$inferSelect;
export type InsertLiveBroadcast = typeof liveBroadcasts.$inferInsert;

export type GurmatCampRegistration = typeof gurmatCampRegistrations.$inferSelect;
export type InsertGurmatCampRegistration = typeof gurmatCampRegistrations.$inferInsert;

export type Media = typeof media.$inferSelect;
export type InsertMedia = z.infer<typeof insertMediaSchema>;
