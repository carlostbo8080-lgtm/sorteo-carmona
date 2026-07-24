-- ════════════════════════════════════════════════════════════
-- Registro de Contactos — David Dvdburg
-- Proyecto de Supabase INDEPENDIENTE. Correr este script completo
-- en el SQL Editor de un proyecto de Supabase nuevo (Project > SQL
-- Editor > New query), una sola vez.
-- ════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── TABLA: registros ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  nombre        TEXT        NOT NULL,
  cedula        TEXT        NOT NULL,
  cedula_limpia TEXT        NOT NULL,
  telefono      TEXT        NOT NULL,
  barrio        TEXT        NOT NULL
);

-- Evita duplicados por cédula a nivel de base de datos (no solo en
-- el frontend, que puede saltearse). cedula_limpia = solo dígitos.
CREATE UNIQUE INDEX IF NOT EXISTS registros_cedula_limpia_key
  ON registros (cedula_limpia);

CREATE INDEX IF NOT EXISTS registros_created_at_idx
  ON registros (created_at DESC);

ALTER TABLE registros ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante (rol "anon") puede ENVIAR el formulario, pero
-- nunca leer, modificar ni borrar registros. También se permite a
-- "authenticated" para que un admin logueado (p. ej. probando el
-- formulario desde el mismo navegador que /admin) también pueda enviarlo.
DROP POLICY IF EXISTS "registros_insert_publico" ON registros;
CREATE POLICY "registros_insert_publico" ON registros
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Solo un usuario autenticado (el administrador) puede leer y borrar.
DROP POLICY IF EXISTS "registros_select_admin" ON registros;
CREATE POLICY "registros_select_admin" ON registros
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "registros_delete_admin" ON registros;
CREATE POLICY "registros_delete_admin" ON registros
  FOR DELETE TO authenticated
  USING (true);

-- ─── NOTA FINAL ─────────────────────────────────────────────────
-- Después de correr este script:
-- 1. Crear el usuario administrador desde Authentication > Users >
--    Add user (en el dashboard de Supabase), con el email y la
--    contraseña que va a usar el candidato/administrador para
--    entrar a /admin. No hace falta que se registre nadie más.
-- 2. En Authentication > Settings, desactivar "Allow new users to
--    sign up" para que nadie pueda crearse una cuenta por su cuenta
--    y ver los registros.
-- 3. Copiar Project URL y anon public key (Settings > API) a un
--    archivo .env en la raíz del proyecto (ver .env.example).
