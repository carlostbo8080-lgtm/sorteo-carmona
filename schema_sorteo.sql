-- ════════════════════════════════════════════════════════════
-- Módulo de Sorteo — Registro Darío Carmona
-- Esquema ADITIVO: no modifica la tabla `registros` ni sus
-- políticas. Corré este script una sola vez en el mismo
-- proyecto de Supabase (SQL Editor > New query), después de
-- haber corrido schema.sql.
-- ════════════════════════════════════════════════════════════

-- ─── TABLA: sorteo_config (fila única con el nombre del evento) ──
CREATE TABLE IF NOT EXISTS sorteo_config (
  id            SMALLINT     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre_evento TEXT         NOT NULL DEFAULT 'Gran Sorteo - Darío Carmona',
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO sorteo_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE sorteo_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sorteo_config_select_publico" ON sorteo_config;
CREATE POLICY "sorteo_config_select_publico" ON sorteo_config
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "sorteo_config_update_admin" ON sorteo_config;
CREATE POLICY "sorteo_config_update_admin" ON sorteo_config
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- ─── TABLA: sorteo_ganadores (historial de sorteos realizados) ──
-- Guarda una copia de nombre/barrio (no cédula ni teléfono) al
-- momento del sorteo, para poder mostrarla públicamente sin
-- exponer la tabla `registros` a usuarios anónimos.
CREATE TABLE IF NOT EXISTS sorteo_ganadores (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id         UUID        NOT NULL REFERENCES registros(id) ON DELETE CASCADE,
  nombre              TEXT        NOT NULL,
  barrio              TEXT        NOT NULL,
  numero_participante INT         NOT NULL,
  elegido_en          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sorteo_ganadores_elegido_en_idx
  ON sorteo_ganadores (elegido_en DESC);

ALTER TABLE sorteo_ganadores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sorteo_ganadores_select_publico" ON sorteo_ganadores;
CREATE POLICY "sorteo_ganadores_select_publico" ON sorteo_ganadores
  FOR SELECT TO anon, authenticated
  USING (true);

-- La ruleta es operable por cualquiera con el link de /sorteo (sin login),
-- como en Wheel of Names / Picker Wheel: quien tenga la página abierta la
-- controla. Por eso "anon" también puede insertar un ganador.
DROP POLICY IF EXISTS "sorteo_ganadores_insert_admin" ON sorteo_ganadores;
DROP POLICY IF EXISTS "sorteo_ganadores_insert_publico" ON sorteo_ganadores;
CREATE POLICY "sorteo_ganadores_insert_publico" ON sorteo_ganadores
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- También pública: el botón "Reiniciar sorteo con todos los participantes"
-- vive en /sorteo, sin login, igual que el resto de la operación.
DROP POLICY IF EXISTS "sorteo_ganadores_delete_admin" ON sorteo_ganadores;
DROP POLICY IF EXISTS "sorteo_ganadores_delete_publico" ON sorteo_ganadores;
CREATE POLICY "sorteo_ganadores_delete_publico" ON sorteo_ganadores
  FOR DELETE TO anon, authenticated
  USING (true);

-- ─── VISTA: conteo público de participantes ──────────────────────
-- Expone solo el número total de registros (sin filas individuales)
-- para que la página pública del sorteo pueda mostrarlo sin acceso
-- de lectura a `registros`.
--
-- ACTUALIZADO en schema_padron.sql: filtra por `apto_sorteo = true`
-- (solo cuenta a quienes están en el padrón electoral de Presidente Franco).
-- La definición de abajo queda como referencia histórica; la vista
-- real en la base ya tiene el filtro aplicado.
CREATE OR REPLACE VIEW sorteo_participantes_conteo AS
  SELECT count(*)::int AS total FROM registros;

GRANT SELECT ON sorteo_participantes_conteo TO anon, authenticated;

-- ─── VISTA: participantes públicos para la ruleta ─────────────────
-- Expone SOLO nombre y barrio (nunca cédula ni teléfono) para poder
-- dibujar los segmentos de la ruleta sin dar acceso a `registros`.
--
-- ACTUALIZADO en schema_padron.sql: mismo filtro `apto_sorteo = true`.
CREATE OR REPLACE VIEW sorteo_participantes_publico AS
  SELECT id, nombre, barrio, created_at FROM registros ORDER BY created_at ASC;

GRANT SELECT ON sorteo_participantes_publico TO anon, authenticated;

-- ─── REALTIME: transmitir en vivo cuando se elige un ganador ─────
-- Solo `sorteo_ganadores` (nunca `registros`, para no filtrar
-- cédula/teléfono a través del stream de tiempo real).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'sorteo_ganadores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sorteo_ganadores;
  END IF;
END $$;

-- ─── TABLA: sorteo_auditoria (registro interno, no público) ──────
-- Traza cada sorteo ejecutado: cuándo, cuántos participantes había,
-- quién ganó y qué método de selección se usó. Solo el admin puede
-- leerla (Authentication → cualquier usuario autenticado); cualquiera
-- puede insertar (porque cualquiera con el link puede ejecutar un
-- sorteo), pero nunca puede leerla de vuelta.
CREATE TABLE IF NOT EXISTS sorteo_auditoria (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_hora             TIMESTAMPTZ NOT NULL DEFAULT now(),
  cantidad_participantes INT         NOT NULL,
  ganador_registro_id    UUID        REFERENCES registros(id) ON DELETE SET NULL,
  metodo_seleccion       TEXT        NOT NULL
);

ALTER TABLE sorteo_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sorteo_auditoria_insert_publico" ON sorteo_auditoria;
CREATE POLICY "sorteo_auditoria_insert_publico" ON sorteo_auditoria
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "sorteo_auditoria_select_admin" ON sorteo_auditoria;
CREATE POLICY "sorteo_auditoria_select_admin" ON sorteo_auditoria
  FOR SELECT TO authenticated
  USING (true);

-- IMPORTANTE al insertar desde el frontend: nunca encadenar `.select()`
-- después de `.insert()` en esta tabla para el rol "anon" — Postgres
-- exige una política de SELECT para poder devolver la fila insertada
-- (RETURNING), y "anon" no tiene una a propósito.

-- ─── NOTA FINAL ─────────────────────────────────────────────────
-- Este script no toca la tabla `registros`, sus políticas RLS ni
-- los usuarios de Authentication ya configurados. El panel admin
-- del sorteo (/admin/sorteo) usa la misma sesión de login que
-- /admin.
