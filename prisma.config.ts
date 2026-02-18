import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Dummy URL solo para que "prisma generate" funcione sin DB; db push/migrate usan DATABASE_URL real
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://localhost:5432/dummy";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
