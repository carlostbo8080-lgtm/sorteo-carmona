import { useEffect, useRef, useState } from "react";

const FILAS_VISIBLES = 7;
const CENTRO = Math.floor(FILAS_VISIBLES / 2); // fila 3 (0-indexada) = el centro
const LONGITUD_TIRA = 270; // pasadas fijas, sin importar cuántos participantes haya
const EXTRA_TRAS = CENTRO; // relleno visual después del ganador

/**
 * Tambor de nombres vertical (tómbola electrónica). Recibe el índice
 * ganador ya decidido por el algoritmo de selección — esta animación
 * únicamente lo representa visualmente, nunca decide nada.
 */
export function TamborSorteo({ segmentos, indiceGanador, girando, duracionMs, onFinish }) {
  const [rebote, setRebote] = useState(false);
  const [asentado, setAsentado] = useState(false);
  const [alturaFila, setAlturaFila] = useState(66);
  const finTimeoutRef = useRef(null);

  useEffect(() => {
    setAlturaFila(window.innerWidth < 480 ? 52 : 66);
  }, []);

  useEffect(() => {
    clearTimeout(finTimeoutRef.current);
    if (!girando) return undefined;

    // Recién empieza a girar: el nombre ganador todavía no se distingue
    // visualmente de los demás — eso solo pasa cuando se frena de verdad.
    setAsentado(false);

    finTimeoutRef.current = setTimeout(() => {
      setAsentado(true);
      setRebote(true);
      onFinish?.();
      setTimeout(() => setRebote(false), 700);
    }, duracionMs);
    return () => clearTimeout(finTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girando, indiceGanador]);

  const n = segmentos.length;

  let filas = [];
  if (n > 0 && girando) {
    for (let i = 0; i < LONGITUD_TIRA; i++) {
      const idx = (((indiceGanador - (LONGITUD_TIRA - 1 - i)) % n) + n) % n;
      filas.push(segmentos[idx]);
    }
    for (let i = 0; i < EXTRA_TRAS; i++) {
      const idx = (indiceGanador + 1 + i) % n;
      filas.push(segmentos[idx]);
    }
  } else {
    filas = segmentos.slice(0, FILAS_VISIBLES);
  }

  const translateYFinal = girando ? (CENTRO - (LONGITUD_TIRA - 1)) * alturaFila : 0;

  return (
    <div
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[26px] border border-[#D4A017]/30 bg-black/55 shadow-[0_30px_70px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.06)]"
      style={{ height: FILAS_VISIBLES * alturaFila }}
    >
      {n === 0 && (
        <div className="flex h-full items-center justify-center px-6 text-center text-[14px] text-white/35">
          Todavía no hay participantes registrados.
        </div>
      )}

      {/* indicador central fijo */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10 border-y border-[#D4A017]/70 bg-[#D4A017]/10"
        style={{ top: CENTRO * alturaFila, height: alturaFila, boxShadow: "0 0 24px 0 rgba(212,160,23,0.25)" }}
      >
        <div className="absolute left-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[9px] border-l-[12px] border-y-transparent border-l-[#D4A017]" />
        <div className="absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[9px] border-r-[12px] border-y-transparent border-r-[#D4A017]" />
      </div>

      {/* difuminados arriba/abajo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-[#0d0509] to-transparent"
        style={{ height: alturaFila * 1.5 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#0d0509] to-transparent"
        style={{ height: alturaFila * 1.5 }}
      />

      <div className={rebote ? "animate-sorteo-rebote" : ""}>
        <div
          style={{
            transform: `translateY(${translateYFinal}px)`,
            transition: girando ? `transform ${duracionMs}ms cubic-bezier(0.14, 0.72, 0.12, 1)` : "none",
          }}
        >
          {filas.map((p, i) => {
            const esGanadorFinal = asentado && i === LONGITUD_TIRA - 1;
            return (
              <div key={i} className="flex items-center justify-center px-8 text-center" style={{ height: alturaFila }}>
                <span
                  className={
                    esGanadorFinal
                      ? "font-display uppercase leading-tight tracking-wide text-[#f5d375]"
                      : "font-condensed font-semibold leading-tight text-white/45"
                  }
                  style={{
                    fontSize: esGanadorFinal ? "clamp(20px, 4.2vw, 30px)" : "clamp(14px, 2.6vw, 18px)",
                    textShadow: esGanadorFinal ? "0 0 22px rgba(245,211,117,0.55)" : "none",
                  }}
                >
                  {p?.nombre}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
