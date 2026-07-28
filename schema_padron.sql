-- ════════════════════════════════════════════════════════════
-- Validación contra el Padrón Electoral de Presidente Franco
-- Esquema ADITIVO: no modifica el formulario ni bloquea el envío.
-- Corré este script una sola vez (SQL Editor > New query), después
-- de haber corrido schema.sql y schema_sorteo.sql.
-- ════════════════════════════════════════════════════════════

-- ─── TABLA: padron_presidente_franco (importada una sola vez desde CSV) ───
-- Completamente bloqueada por RLS: ni "anon" ni "authenticated"
-- pueden leerla directamente. Solo se usa desde el trigger de
-- abajo (SECURITY DEFINER) y desde la conexión directa que hace
-- la importación. Así nunca se expone el padrón completo.
CREATE TABLE IF NOT EXISTS padron_presidente_franco (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula     TEXT        NOT NULL,
  nombre     TEXT,
  apellido   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS padron_presidente_franco_cedula_key ON padron_presidente_franco (cedula);

ALTER TABLE padron_presidente_franco ENABLE ROW LEVEL SECURITY;
-- (sin políticas a propósito: nadie puede leerla vía API pública)

-- ─── COLUMNA: registros.apto_sorteo ────────────────────────────
-- Se calcula automáticamente, nunca la envía el formulario.
ALTER TABLE registros ADD COLUMN IF NOT EXISTS apto_sorteo BOOLEAN NOT NULL DEFAULT false;

-- ─── TRIGGER: validación automática contra el padrón ──────────
-- Corre en cada INSERT sobre `registros`. SECURITY DEFINER permite
-- que consulte `padron_presidente_franco` (bloqueada para anon) sin necesidad
-- de darle ningún permiso extra al formulario público. Nunca lanza
-- error ni bloquea el insert — solo escribe true/false.
CREATE OR REPLACE FUNCTION calcular_apto_sorteo()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.apto_sorteo := EXISTS (
    SELECT 1 FROM padron_presidente_franco WHERE cedula = NEW.cedula_limpia
  );
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_calcular_apto_sorteo ON registros;
CREATE TRIGGER trg_calcular_apto_sorteo
BEFORE INSERT ON registros
FOR EACH ROW EXECUTE FUNCTION calcular_apto_sorteo();

-- ─── VISTAS DEL SORTEO: ahora solo ven a los "aptos" ──────────
-- Mismas vistas creadas en schema_sorteo.sql, redefinidas acá para
-- agregar el filtro. La página /sorteo no necesitó ningún cambio de
-- código: sigue consultando las mismas vistas de siempre.
CREATE OR REPLACE VIEW sorteo_participantes_conteo AS
  SELECT count(*)::int AS total FROM registros WHERE apto_sorteo = true;

CREATE OR REPLACE VIEW sorteo_participantes_publico AS
  SELECT id, nombre, barrio, created_at FROM registros WHERE apto_sorteo = true ORDER BY created_at ASC;

-- ─── BACKFILL: recalcular registros que ya existían ───────────
-- El trigger solo corre para inserts nuevos. Después de importar el
-- padrón, corré esto una vez para poner al día los registros viejos:
--
-- UPDATE registros SET apto_sorteo = EXISTS (
--   SELECT 1 FROM padron_presidente_franco WHERE cedula = registros.cedula_limpia
-- );

-- ─── NOTA FINAL ─────────────────────────────────────────────────
-- El formulario público (`registros_insert_publico`) no cambia en
-- absoluto: sigue sin poder leer nada, y ahora tampoco necesita
-- saber nada sobre el padrón — todo pasa del lado del servidor.
