import { sql } from "drizzle-orm";

export async function up(db: any): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS live_broadcasts (
      id SERIAL PRIMARY KEY,
      socket_id TEXT NOT NULL,
      room_name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
}

export async function down(db: any): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS live_broadcasts;`);
}
