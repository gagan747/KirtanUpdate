import {
  users,
  type User,
  type InsertUser,
  type Samagam,
  type InsertSamagam,
  samagams,
  type RecordedSamagam,
  type InsertRecordedSamagam,
  recordedSamagams,
  type Location,
  type InsertLocation,
  locations,
  type FcmToken,
  type InsertFcmToken,
  fcmTokens,
  type LiveBroadcast,
  type InsertLiveBroadcast,
  liveBroadcasts,
  type GurmatCampRegistration,
  type InsertGurmatCampRegistration,
  gurmatCampRegistrations,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc } from "drizzle-orm";
import { count, asc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // FCM Token operations
  saveFcmToken(token: string): Promise<FcmToken>;
  getFcmTokens(): Promise<FcmToken[]>;
  deleteFcmToken(token: string): Promise<boolean>;
  checkFcmTokenExists(token: string): Promise<boolean>;

  // Live Broadcast operations
  createLiveBroadcast(
    socketId: string,
    roomName: string,
  ): Promise<LiveBroadcast>;
  getLiveBroadcasts(): Promise<LiveBroadcast[]>;
  deleteLiveBroadcastBySocketId(socketId: string): Promise<boolean>;
  hasActiveBroadcast(): Promise<boolean>;

  // Gurmat Camp Registration operations
  createGurmatCampRegistration(data: InsertGurmatCampRegistration): Promise<GurmatCampRegistration>;
  getGurmatCampRegistrationByEmail(email: string): Promise<GurmatCampRegistration | undefined>;
  getAllGurmatCampRegistrations(): Promise<GurmatCampRegistration[]>;

  // Other methods...
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Constructor without session store
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Samagam operations
  async getSamagam(id: number): Promise<Samagam | undefined> {
    const [samagam] = await db
      .select()
      .from(samagams)
      .where(eq(samagams.id, id));
    return samagam;
  }

  async getAllSamagams(): Promise<Samagam[]> {
    return await db.select().from(samagams).orderBy(asc(samagams.date));
  }

  async getPaginatedSamagams(
    limit: number,
    offset: number,
  ): Promise<{ samagams: Samagam[]; total: number }> {
    const results = await db
      .select()
      .from(samagams)
      .orderBy(asc(samagams.date))
      .limit(limit)
      .offset(offset);
    const [countResult] = await db.select({ count: count() }).from(samagams);
    return {
      samagams: results,
      total: Number(countResult.count),
    };
  }

  async createSamagam(insertSamagam: InsertSamagam): Promise<Samagam> {
    const [samagam] = await db
      .insert(samagams)
      .values(insertSamagam)
      .returning();
    return samagam;
  }

  async updateSamagam(
    id: number,
    updateSamagam: InsertSamagam,
  ): Promise<Samagam | undefined> {
    const [samagam] = await db
      .update(samagams)
      .set(updateSamagam)
      .where(eq(samagams.id, id))
      .returning();
    return samagam;
  }

  async deleteSamagam(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(samagams)
      .where(eq(samagams.id, id))
      .returning();
    return !!deleted;
  }

  async getCalendarSamagams(): Promise<Array<{id: number, title: string, date: string, color: string}>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    console.log("Fetching calendar samagams, today is:", today.toISOString());
    
    const results = await db
      .select({
        id: samagams.id,
        title: samagams.title,
        date: samagams.date,
        color: samagams.color,
      })
      .from(samagams)
      .where(gte(samagams.date, today))
      .orderBy(asc(samagams.date));
    
    console.log("Found calendar samagams:", results);
    
    const mappedResults = results.map(result => ({
      ...result,
      date: result.date.toISOString(),
    }));
    
    console.log("Mapped calendar samagams:", mappedResults);
    
    return mappedResults;
  }

  // Recorded Samagam operations
  async getAllRecordedSamagams(): Promise<RecordedSamagam[]> {
    return await db.select().from(recordedSamagams);
  }

  async getPaginatedRecordedSamagams(
    limit: number,
    offset: number,
  ): Promise<{ recordedSamagams: RecordedSamagam[]; total: number }> {
    const results = await db
      .select()
      .from(recordedSamagams)
      .limit(limit)
      .offset(offset);
    const [countResult] = await db
      .select({ count: count() })
      .from(recordedSamagams);
    return {
      recordedSamagams: results,
      total: Number(countResult.count),
    };
  }

  async getRecordedSamagam(id: number): Promise<RecordedSamagam | undefined> {
    const [recordedSamagam] = await db
      .select()
      .from(recordedSamagams)
      .where(eq(recordedSamagams.id, id));
    return recordedSamagam;
  }

  async createRecordedSamagam(
    insertRecordedSamagam: InsertRecordedSamagam,
    userId: number,
  ): Promise<RecordedSamagam> {
    const [recordedSamagam] = await db
      .insert(recordedSamagams)
      .values({
        title: insertRecordedSamagam.title,
        description: insertRecordedSamagam.description,
        youtubeUrl: insertRecordedSamagam.youtubeUrl,
        date: insertRecordedSamagam.date, // This is already a Date object due to z.coerce.date()
        addedBy: userId,
      })
      .returning();
    return recordedSamagam;
  }

  async updateRecordedSamagam(
    id: number,
    updateRecordedSamagam: InsertRecordedSamagam,
  ): Promise<RecordedSamagam | undefined> {
    const [recordedSamagam] = await db
      .update(recordedSamagams)
      .set({
        title: updateRecordedSamagam.title,
        description: updateRecordedSamagam.description,
        youtubeUrl: updateRecordedSamagam.youtubeUrl,
        date: updateRecordedSamagam.date, // This is already a Date object
      })
      .where(eq(recordedSamagams.id, id))
      .returning();
    return recordedSamagam;
  }

  async deleteRecordedSamagam(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(recordedSamagams)
      .where(eq(recordedSamagams.id, id))
      .returning();
    return !!deleted;
  }

  // Location operations
  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations);
  }

  async createLocation(
    insertLocation: InsertLocation,
    userId: number,
  ): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values({ ...insertLocation, addedBy: userId })
      .returning();
    return location;
  }

  async updateLocation(
    id: number,
    updateLocation: InsertLocation,
  ): Promise<Location | undefined> {
    const [location] = await db
      .update(locations)
      .set(updateLocation)
      .where(eq(locations.id, id))
      .returning();
    return location;
  }

  async deleteLocation(id: number): Promise<boolean> {
    const [deleted] = await db
      .delete(locations)
      .where(eq(locations.id, id))
      .returning();
    return !!deleted;
  }

  // FCM Token operations
  async saveFcmToken(token: string): Promise<FcmToken> {
    // Check if token already exists
    const existingTokens = await db
      .select()
      .from(fcmTokens)
      .where(eq(fcmTokens.token, token));

    if (existingTokens.length) {
      return existingTokens[0];
    } else {
      // Insert new token
      const [newToken] = await db
        .insert(fcmTokens)
        .values({
          token,
          createdAt: new Date(),
          lastUsed: new Date(),
        })
        .returning();
      return newToken;
    }
  }

  async getFcmTokens(): Promise<FcmToken[]> {
    return await db.select().from(fcmTokens);
  }

  async deleteFcmToken(token: string): Promise<boolean> {
    const [deleted] = await db
      .delete(fcmTokens)
      .where(eq(fcmTokens.token, token))
      .returning();
    return !!deleted;
  }

  async checkFcmTokenExists(token: string): Promise<boolean> {
    const tokens = await db
      .select()
      .from(fcmTokens)
      .where(eq(fcmTokens.token, token));
    return tokens.length > 0;
  }

  // Live Broadcast operations
  async createLiveBroadcast(
    socketId: string,
    roomName: string,
  ): Promise<LiveBroadcast> {
    // First delete any existing broadcasts to ensure only one active broadcast
    await db.delete(liveBroadcasts);

    // Create new broadcast entry - let the database assign the id
    const [liveBroadcast] = await db
      .insert(liveBroadcasts)
      .values({
        socketId,
        roomName,
      })
      .returning();

    return liveBroadcast;
  }

  async getLiveBroadcasts(): Promise<LiveBroadcast[]> {
    return await db.select().from(liveBroadcasts);
  }

  async deleteLiveBroadcastBySocketId(socketId: string): Promise<boolean> {
    const [deleted] = await db
      .delete(liveBroadcasts)
      .where(eq(liveBroadcasts.socketId, socketId))
      .returning();

    return !!deleted;
  }

  async hasActiveBroadcast(): Promise<boolean> {
    const broadcasts = await this.getLiveBroadcasts();
    return broadcasts.length > 0;
  }

  // Gurmat Camp Registration operations
  async createGurmatCampRegistration(data: InsertGurmatCampRegistration): Promise<GurmatCampRegistration> {
    try {
      const [registration] = await db
        .insert(gurmatCampRegistrations)
        .values(data)
        .returning();
      return registration;
    } catch (error: any) {
      // Handle unique constraint violation for email
      if (error.message.includes('unique constraint') && error.message.includes('email')) {
        throw new Error('Registration failed: email already exists');
      }
      throw error;
    }
  }

  async getGurmatCampRegistrationByEmail(email: string): Promise<GurmatCampRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(gurmatCampRegistrations)
      .where(eq(gurmatCampRegistrations.email, email));
    return registration;
  }

  async getAllGurmatCampRegistrations(): Promise<GurmatCampRegistration[]> {
    return await db
      .select()
      .from(gurmatCampRegistrations)
      .orderBy(desc(gurmatCampRegistrations.createdAt));
  }
}

export const storage = new DatabaseStorage();
