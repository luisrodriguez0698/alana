import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está definida. Configura tu .env antes de ejecutar el seed.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const INVITADOS = [
  { nombre: "Hilda y Gabriel", numero: "9612702139", pases: 2 },
  { nombre: "Irving (2 niños)", numero: "9612345671", pases: 3 },
  { nombre: "Fam. Madrid López", numero: "9612345672", pases: 4 },
  { nombre: "Fam. García Ruiz", numero: "9612345673", pases: 3 },
  { nombre: "Tía María", numero: "9612345674", pases: 1 },
  { nombre: "Fam. Hernández", numero: "9612345675", pases: 5 },
  { nombre: "Abuelos Martínez", numero: "9612345676", pases: 2 },
  { nombre: "Primos Sánchez", numero: "9612345677", pases: 4 },
  { nombre: "Fam. López Torres", numero: "9612345678", pases: 3 },
  { nombre: "Amiga Cinthya", numero: "9612345679", pases: 2 },
  { nombre: "Fam. Ramírez", numero: "9612345680", pases: 4 },
  { nombre: "Tío Pedro y familia", numero: "9612345681", pases: 5 },
  { nombre: "Vecinos Flores", numero: "9612345682", pases: 2 },
  { nombre: "Fam. Díaz", numero: "9612345683", pases: 3 },
  { nombre: "Comadre Laura", numero: "9612345684", pases: 2 },
  { nombre: "Fam. Morales", numero: "9612345685", pases: 4 },
  { nombre: "Padrinos", numero: "9612345686", pases: 2 },
  { nombre: "Fam. Ortiz", numero: "9612345687", pases: 3 },
  { nombre: "Amigos del trabajo", numero: "9612345688", pases: 2 },
  { nombre: "Fam. Cruz", numero: "9612345689", pases: 4 },
  { nombre: "Tía Rosa", numero: "9612345690", pases: 1 },
  { nombre: "Fam. Reyes", numero: "9612345691", pases: 3 },
  { nombre: "Vecinos Castillo", numero: "9612345692", pases: 2 },
];

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@hesed.local").trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash },
    });
    console.log(`✔ Usuario admin creado: ${adminEmail} (cambia la contraseña en producción).`);
  } else {
    console.log(`✔ Usuario admin ya existe: ${adminEmail}.`);
  }

  console.log("🌱 Insertando invitados...");
  const result = await prisma.invitado.createMany({
    data: INVITADOS.map((inv) => ({
      nombre: inv.nombre,
      numero: inv.numero,
      pases: inv.pases,
      mesa: null,
      confirmado: false,
      pasesConfirmados: 0,
      fechaConfirmacion: null,
    })),
    skipDuplicates: true,
  });
  console.log(`✔ ${result.count} invitados insertados (omitidos duplicados por número).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
