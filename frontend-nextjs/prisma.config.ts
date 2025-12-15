/**
 * Prisma Config for Dual Database Support
 * 
 * - Local Development: SQLite
 * - Vercel/Production: PostgreSQL (Supabase)
 * 
 * The configuration is determined by:
 * 1. VERCEL environment variable (auto-set by Vercel)
 * 2. DATABASE_PROVIDER environment variable
 * 3. Defaults to sqlite for local dev
 */
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Detect environment
const isVercel = process.env.VERCEL === '1';
const databaseProvider = process.env.DATABASE_PROVIDER || (isVercel ? 'postgresql' : 'sqlite');

// Choose schema and URL based on provider
const isPostgres = databaseProvider === 'postgresql';

export default defineConfig({
  // Use appropriate schema for the current environment
  schema: isPostgres
    ? "prisma/schema.postgres.prisma"
    : "prisma/schema.sqlite.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // For PostgreSQL (Supabase/Vercel), use DATABASE_URL from environment
    // For SQLite (local dev), use local file
    url: isPostgres
      ? process.env.DATABASE_URL || "postgresql://localhost:5432/postgres"
      : "file:./team-calls.db",
  },
});
