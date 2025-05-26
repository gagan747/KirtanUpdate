import { db } from "./db";
import { samagams } from "@shared/schema";
import { lt } from "drizzle-orm";

let schedulerInterval: NodeJS.Timeout | null = null;

export function startSamagamScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Run cleanup every 10 minutes (600,000 ms)
  schedulerInterval = setInterval(async () => {
    try {
      console.log("Running samagam cleanup...");
      
      // Delete samagams that are older than current date
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day
      
      const deletedSamagams = await db
        .delete(samagams)
        .where(lt(samagams.date, now))
        .returning({ id: samagams.id, title: samagams.title });
      
      if (deletedSamagams.length > 0) {
        console.log(`Deleted ${deletedSamagams.length} expired samagams:`, 
          deletedSamagams.map(s => `${s.id}: ${s.title}`));
      } else {
        console.log("No expired samagams to delete");
      }
    } catch (error) {
      console.error("Error in samagam cleanup scheduler:", error);
    }
  }, 10 * 60 * 1000); // 10 minutes

  console.log("Samagam cleanup scheduler started (runs every 10 minutes)");
}

export function stopSamagamScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Samagam cleanup scheduler stopped");
  }
}

// Run cleanup once on startup
export async function runInitialCleanup() {
  try {
    console.log("Running initial samagam cleanup...");
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const deletedSamagams = await db
      .delete(samagams)
      .where(lt(samagams.date, now))
      .returning({ id: samagams.id, title: samagams.title });
    
    if (deletedSamagams.length > 0) {
      console.log(`Initial cleanup: Deleted ${deletedSamagams.length} expired samagams:`, 
        deletedSamagams.map(s => `${s.id}: ${s.title}`));
    } else {
      console.log("Initial cleanup: No expired samagams to delete");
    }
  } catch (error) {
    console.error("Error in initial samagam cleanup:", error);
  }
}
