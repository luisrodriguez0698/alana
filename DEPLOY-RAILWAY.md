# Despliegue en Railway

## Requisitos

- Repo en GitHub (u otro) conectado a Railway.
- Base de datos PostgreSQL en Railway (o externa).

## Pasos

### 1. Crear proyecto en Railway

- Crea un proyecto y añade un servicio **PostgreSQL**.
- En el panel de PostgreSQL, copia **DATABASE_URL** (o **POSTGRES_URL**).

### 2. Crear servicio de la app (Next.js)

- Añade un nuevo servicio y conéctalo a tu repo.
- Railway detectará Next.js y usará:
  - **Build:** `npm install` (incluye `postinstall` → `prisma generate`) y `npm run build`
  - **Start:** `npm start` (`next start`)

### 3. Variables de entorno (obligatorias)

En el servicio de la **app** (no en PostgreSQL), en **Variables**:

| Variable         | Descripción |
|------------------|-------------|
| `DATABASE_URL`   | URL de conexión de PostgreSQL (la que te da Railway al crear la DB). |
| `SESSION_SECRET` | Cadena aleatoria segura para las sesiones del admin (ej. genera una con `openssl rand -base64 32`). |

### 4. Esquema de la base de datos

En local ya usas `npm run db:sync` (Prisma generate + db push). En Railway:

- **Opción A:** Ejecutar una sola vez desde tu máquina (con la misma `DATABASE_URL` de Railway en `.env`):
  ```bash
  npm run db:sync
  ```
- **Opción B:** Añadir en Railway un **release command** (si tu plan lo permite):  
  `npx prisma db push`  
  Así se aplica el esquema en cada deploy.

### 5. Comprobar build

- El `postinstall` en `package.json` ejecuta `prisma generate`, así que el cliente de Prisma se genera en cada `npm install` durante el build.
- Si el build falla, revisa los logs; suele ser por falta de `DATABASE_URL` (debe estar definida en el servicio de la app antes del primer deploy).

### 6. Dominio y HTTPS

Railway asigna un dominio `.railway.app`. Puedes añadir un dominio propio en la configuración del servicio.

---

**Resumen:** Conecta el repo, define `DATABASE_URL` y `SESSION_SECRET` en el servicio de la app, y ejecuta el esquema (db push) una vez con la URL de Railway o con un release command.
