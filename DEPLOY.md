# Desplegar la invitación Hesed en Firebase (hesed-1)

## 1. Firebase: Firestore y Authentication

En la [consola de Firebase](https://console.firebase.google.com):

1. Elige el proyecto donde está **hesed-1** (Hosting).
2. **Firestore Database** → "Crear base de datos" → modo producción o prueba (para desarrollo puedes usar prueba). Elige una región cercana (ej. `us-central1`).
3. **Authentication** → "Comenzar" → en "Sign-in method" activa si vas a usar algo (para admin opcional). Para solo invitados por número no es obligatorio.

## 2. Variables de entorno (local y al publicar)

### En tu PC (desarrollo)

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env.local
   ```
2. En Firebase: **Configuración del proyecto** (icono engranaje) → "Tus apps" → si no hay web, "Agregar app" → Web. Copia el objeto `firebaseConfig`.
3. En `.env.local` rellena (sin comillas):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```
4. Reinicia el servidor de desarrollo (`npm run dev`) después de crear o cambiar `.env.local`.

### Al publicar en Firebase Hosting

Las variables `NEXT_PUBLIC_*` se embeben en el build. Tienes dos opciones:

**Opción A – Build en tu PC y luego subir**

- Deja tu `.env.local` con los valores de producción (o usa `.env.production`).
- Ejecuta el build (cuando el proyecto esté listo para export estático):
  ```bash
  npm run build
  ```
- Luego despliegas la carpeta que te indique el proyecto (por ejemplo `out` si se usa export estático, o lo que configuremos con Firebase).

**Opción B – Firebase App Hosting (recomendado si usas Git)**

- Conectas el repositorio a Firebase; en la configuración del App Hosting puedes definir las variables de entorno.
- Ahí pones las mismas `NEXT_PUBLIC_FIREBASE_*` y el build se hace en la nube con esas variables.

En ambos casos, **sin esas variables en el momento del build, la app no podrá conectar con Firebase** en producción.

## 3. Cómo se publica Next.js en Firebase

Next.js puede desplegarse de dos maneras en tu caso:

### 3.1 Hosting clásico (export estático)

- El proyecto se configura para generar una carpeta estática (`out`).
- En Firebase Hosting se publica esa carpeta.
- **Ventaja:** funciona en **hesed-1** sin servidor; Firestore y Auth se usan desde el navegador.
- Cuando esté listo, se añadirá en el proyecto la config necesaria (`next.config` con `output: 'export'` y `firebase.json` apuntando a `out`).

### 3.2 App Hosting (Next.js en Firebase)

- En la consola: **Build** → **App Hosting**.
- Conectas el repo (GitHub, etc.) y eliges el sitio **hesed-1**.
- Firebase hace el build y el deploy; en la configuración del App Hosting añades las variables `NEXT_PUBLIC_FIREBASE_*`.
- No necesitas configurar `output: 'export'`; Firebase se encarga del build de Next.js.

Para que **todo funcione bien** (invitación + Firestore + confirmaciones):

1. Tener Firestore y, si aplica, Auth configurados en el proyecto.
2. Tener las variables de entorno con la config de Firebase en el entorno donde se hace el **build** (tu PC o App Hosting).
3. Desplegar en **hesed-1** (Hosting con carpeta estática o App Hosting).

Cuando implementemos la lógica de invitados y admin, usaremos estas mismas variables y te indico el comando exacto de build y deploy para **hesed-1**.
