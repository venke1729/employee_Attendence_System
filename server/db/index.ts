import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/attendance";

// Initialize Neon client
const sql = neon(databaseUrl);

// Initialize Drizzle ORM
export const db = drizzle(sql, { schema });

export type Database = typeof db;

// Export schema for migrations
export { schema };
