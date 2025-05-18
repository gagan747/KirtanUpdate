import { pgTable, text, serial, integer, boolean, timestamp, json, unique } from "drizzle-orm/pg-core";
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
  time: text("time").notNull(),
  location: text("location").notNull(),
  organizer: text("organizer").notNull(),
  contactInfo: text("contact_info").notNull(),
  imageUrl: text("image_url"),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export const insertSamagamSchema = createInsertSchema(samagams).pick({
  title: true,
  description: true,
  date: true,
  time: true,
  location: true,
  organizer: true,
  contactInfo: true,
  imageUrl: true,
}).extend({
  date: z.coerce.date(), // Coerce date to handle string inputs
});

export const insertRecordedSamagamSchema = createInsertSchema(recordedSamagams, {
  title: (fieldSchema) => fieldSchema.min(1, { message: "Title cannot be empty" }),
  description: (fieldSchema) => fieldSchema.min(1, { message: "Description cannot be empty" }),
  youtubeUrl: (fieldSchema) => fieldSchema.min(1, { message: "YouTube URL cannot be empty" }),
  // date is handled by extend below
}).pick({
  title: true,
  description: true,
  youtubeUrl: true,
  date: true, // Ensure date is picked before extending
}).extend({
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
