# Pasos: sistema completo en Railway (invitación + panel admin)

## Resumen del sistema

| Parte | URL | Descripción |
|-------|-----|-------------|
| **Invitación pública** | `/` (raíz) | Lo que ya tienes: diseño Hesed, modal de número, confirmar asistencia. |
| **Panel administrador** | `/admin` | Solo con usuario y contraseña: lista de invitados, ver quién confirmó, agregar/editar, exportar CSV. |
| **Base de datos** | MongoDB en Railway | Guarda invitados (nombre, pases, número, confirmado, pasesConfirmados, fecha, etc.). |

---

## Paso 1: Crear el proyecto y la base de datos en Railway (tú lo haces)

1. Entra a [Railway](https://railway.app) y abre tu cuenta (plan Hobby).
2. **Nuevo proyecto** para Hesed (por ejemplo: "hesed" o "invitacion-hesed").
3. Dentro del proyecto:
   - **+ New** → **Database** → elige **MongoDB**.
   - Railway crea el servicio MongoDB y te asigna una **connection string** (URI).
4. En el servicio **MongoDB**:
   - Pestaña **Variables** (o **Connect**): copia la variable que se llama algo como `MONGO_URL` o `DATABASE_URL` o `MONGODB_URI`. Es la que usaremos en la app.
5. (Opcional) Si quieres separar bien los entornos, anota también el **nombre del proyecto** para cuando conectes el repo.

**Importante:** Esa URI de MongoDB es secreta. La usarás solo en el servidor (variables de entorno en Railway), nunca en el navegador.

---

## Paso 2: Variables de entorno que necesitará la app (en Railway)

Cuando conectes el **repositorio** de la invitación como servicio en el mismo proyecto:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MONGODB_URI` | URI de conexión a MongoDB (la que te dio Railway al crear la DB). | `mongodb+srv://...` o `mongodb://...` |
| `ADMIN_USER` | Usuario para entrar al panel `/admin`. | `admin` (o el que elijas) |
| `ADMIN_PASSWORD` | Contraseña del panel admin. | Una contraseña segura |

Railway suele ofrecer **referenciar** la variable del MongoDB desde el servicio de base de datos, así no copias la URI a mano.

---

## Paso 3: Estructura de la base de datos (MongoDB)

Una sola base de datos. Una colección, por ejemplo: **`invitados`**.

Cada documento = un invitado (el **número de teléfono** es el identificador único; se puede usar como `_id` o tener un campo `numero` único).

Ejemplo de documento:

```json
{
  "_id": "9612702139",
  "nombre": "Hilda y Gabriel",
  "numero": "9612702139",
  "pases": 2,
  "mesa": null,
  "confirmado": false,
  "pasesConfirmados": 0,
  "fechaConfirmacion": null
}
```

- **`numero`**: sin espacios, identificador único (ej. 9612702139).
- **`confirmado`**: `true` si ya pulsó Asistiré/No asistiré.
- **`pasesConfirmados`**: cuántos pases confirmó (0 si no asiste).
- **`fechaConfirmacion`**: fecha/hora cuando confirmó (null si no ha confirmado).
- **`mesa`**: opcional; en el panel admin puedes añadirlo si lo usas.

No hace falta que crees colecciones a mano; la app las creará al insertar el primer invitado (o podemos añadir un script de “seed” con la lista que ya tienes).

---

## Paso 4: Qué se implementará en código (después de que tengas la DB)

1. **Conexión a MongoDB** desde Next.js (API Routes o Server Actions), usando `MONGODB_URI`.
2. **API (o Server Actions)** para:
   - Buscar invitado por número (para el modal de la invitación pública).
   - Actualizar `confirmado`, `pasesConfirmados`, `fechaConfirmacion` cuando confirme.
   - (Admin) Listar todos, filtrar, buscar, crear, editar, borrar invitados.
3. **Invitación pública (`/`)**  
   - Sin tocar el diseño.  
   - Modal: ingresar número → buscar en DB → si existe, mostrar nombre y botones Asistiré / No asistiré; si ya confirmó, solo nombre y pases confirmados.
4. **Panel admin (`/admin`)**  
   - Ruta protegida con **usuario y contraseña** (`ADMIN_USER` / `ADMIN_PASSWORD`): login sencillo (formulario que compara con env).  
   - Vista similar a tus imágenes:
     - Tarjetas de resumen: Total invitados, Confirmados, Pendientes, Total personas (suma de pases).
     - Tabla: Estado, Familia (nombre), Teléfono, Mesa, Pases, Confirmadas, Fecha, Acciones (editar, eliminar, etc.).
     - Buscar por nombre o teléfono.
     - Filtro por estado (Todos / Confirmados / Pendientes).
     - Botones: Actualizar, Agregar invitado, Exportar CSV.
     - Paginación (Mostrando X–Y de Z invitados).
5. **Carga inicial de invitados**  
   - Script o ruta protegida para insertar en MongoDB la lista que ya tienes (Hilda y Gabriel, Irving 2 niños, etc.) con `numero` como id o campo único.

---

## Paso 5: Orden recomendado

1. **Tú:** Crear proyecto en Railway y agregar **MongoDB** (Paso 1).  
2. **Tú:** Anotar la variable de conexión (ej. `MONGODB_URI`) y, cuando conectes el repo, definir **ADMIN_USER** y **ADMIN_PASSWORD** (Paso 2).  
3. **Código:** Añadir conexión a MongoDB, modelo/schema de `invitados` y variables en `.env.example` (y doc en DEPLOY si hace falta).  
4. **Código:** Lógica de la invitación pública (modal, buscar por número, confirmar, no tocar diseño).  
5. **Código:** Panel `/admin` (login con usuario/contraseña, tabla, filtros, botones, export CSV, paginación).  
6. **Código:** Carga inicial (seed) con tu lista de invitados.  
7. **Tú:** Conectar el repo en Railway, configurar variables, desplegar.

Cuando tengas creada la base MongoDB en Railway y la variable `MONGODB_URI` (y opcionalmente `ADMIN_USER` y `ADMIN_PASSWORD`), seguimos con la implementación paso a paso sin tocar el diseño de la invitación.
