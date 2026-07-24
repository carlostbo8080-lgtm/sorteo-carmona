# Registro David Dvdburg

Formulario público de captación de datos + panel administrador. Proyecto **totalmente independiente** del sistema de gestión electoral — no comparte base de datos, código en producción ni despliegue con él.

## Puesta en marcha (una sola vez)

### 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo.
2. Abrí **SQL Editor** → **New query**, pegá todo el contenido de [`schema.sql`](./schema.sql) y ejecutalo.
3. Andá a **Authentication → Providers → Email** y desactivá **"Allow new users to sign up"** (para que nadie pueda crearse una cuenta por su cuenta).
4. Andá a **Authentication → Users → Add user** y creá el usuario administrador (email + contraseña) que va a usar el candidato para entrar a `/admin`.
5. Andá a **Settings → API** y copiá el **Project URL** y la **anon public key**.

### 2. Configurar las variables de entorno

Copiá `.env.example` a `.env` y completá con los datos del paso anterior:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Instalar y correr en local

```bash
npm install
npm run dev
```

- Formulario público: `http://localhost:5173/`
- Panel administrador: `http://localhost:5173/admin`

### 4. Deploy

```bash
npm run build
```

Subí la carpeta con Vercel (u otro hosting de sitios estáticos). Si usás Vercel, configurá las mismas variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) en el proyecto. El archivo `vercel.json` ya incluye la regla necesaria para que `/admin` funcione al recargar la página.

Una vez desplegado, el **link público a compartir con la gente** es la URL raíz (ej. `https://registro-david-dvdburg.vercel.app/`). El link `/admin` es privado y no se comparte.

## Cómo funciona

- **Formulario público** (`/`): cualquiera puede completarlo y enviarlo. No requiere login. La base de datos rechaza automáticamente cédulas duplicadas.
- **Panel admin** (`/admin`): pide email + contraseña (el usuario creado en el paso 1.4). Ahí se pueden ver, buscar, filtrar y exportar todos los registros a Excel (`Registro_David_Dvdburg.xlsx`).
- La seguridad está garantizada por Row Level Security de Supabase: el rol público (`anon`) solo puede **insertar**, nunca leer; solo un usuario autenticado puede leer los datos.
