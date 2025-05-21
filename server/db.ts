import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Set NODE_TLS_REJECT_UNAUTHORIZED environment variable at the beginning of the file
// This will disable certificate validation for all TLS connections in the Node.js process
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
let isConnected = false;

// Add event listeners on pool (singleton-style)
pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
  process.exit(1);
});

// Test connection only once and log result
pool
  .connect()
  .then((client) => {
    if (!isConnected) {
      console.log("Database connection established");
      isConnected = true;
    }
    client.release();
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });

export const db = drizzle(pool, { schema });
