import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Durante "next build" puede no existir DATABASE_URL; usamos dummy para que el build termine.
// En runtime (producción) Railway inyecta DATABASE_URL; si no está, la primera petición fallará al conectar.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/dummy";

const adapter = new PrismaPg({
  connectionString,
  // Railway/cloud suelen usar SSL; si falla la conexión, prueba: ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient({ adapter });

// En desarrollo Next.js evita múltiples instancias del cliente
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma ?? prisma;
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
