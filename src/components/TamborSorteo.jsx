import { useEffect, useRef, useState } from "react";

const SEGMENTOS_RUEDA = 24;
const COLOR_A = "#d4a017";
const COLOR_B = "#171614";

/**
 * Rueda circular tipo bingo. Recibe el índice ganador ya decidido por el
 * algoritmo de selección — esta animación únicamente lo representa
 * visualmente, nunca decide nada. El nombre del ganador se revela en la
 * pantalla completa de resultado (no en la rueda), porque con miles de
 * participantes no entrarían como texto legible en los gajos.
 */
export function TamborSorteo({ segmentos, indiceGanador, girando, duracionMs, onFinish }) {
  const [rotacion, setRotacion] = useState(0);
  const finTimeoutRef = useRef(null);
  const vueltaRef = useRef(0);

  useEffect(() => {
    clearTimeout(finTimeoutRef.current);
    if (!girando) return undefined;

    const anguloSegmento = 360 / SEGMENTOS_RUEDA;
    const posicionGanadora = indiceGanador % SEGMENTOS_RUEDA;
    vueltaRef.current += 1;
    const vueltasCompletas = 7 + (vueltaRef.current % 3);
    const anguloFinal = vueltasCompletas * 360 + (360 - posicionGanadora * anguloSegmento);
    setRotacion(anguloFinal);

    finTimeoutRef.current = setTimeout(() => {
      onFinish?.();
    }, duracionMs);
    return () => clearTimeout(finTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girando, indiceGanador]);

  const n = segmentos.length;
  const anguloSegmento = 360 / SEGMENTOS_RUEDA;
  const conic = Array.from({ length: SEGMENTOS_RUEDA }, (_, i) => {
    const color = i % 2 === 0 ? COLOR_A : COLOR_B;
    return `${color} ${i * anguloSegmento}deg ${(i + 1) * anguloSegmento}deg`;
  }).join(", ");

  return (
    <div className="relative mx-auto flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
      {/* puntero fijo */}
      <div className="pointer-events-none absolute -top-1 left-1/2 z-20 h-0 w-0 -translate-x-1/2">
        <div className="h-0 w-0 border-x-[13px] border-t-[22px] border-x-transparent border-t-[#f0c352] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
      </div>

      {/* aro exterior */}
      <div className="absolute inset-0 rounded-full border-4 border-[#D4A017]/50 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7),0_0_0_8px_rgba(23,22,20,0.9)]" />

      <div
        className="absolute inset-[6px] rounded-full"
        style={{
          background: n > 0 ? `conic-gradient(${conic})` : "#26241f",
          transform: `rotate(${rotacion}deg)`,
          transition: girando ? `transform ${duracionMs}ms cubic-bezier(0.14, 0.72, 0.12, 1)` : "none",
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.45)",
        }}
      />

      {/* hub central */}
      <div className="absolute flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4A017] bg-[#171614] shadow-[0_0_24px_rgba(212,160,23,0.45)] sm:h-20 sm:w-20">
        {n === 0 ? (
          <span className="px-2 text-center font-condensed text-[9.5px] font-bold uppercase leading-tight text-white/40">
            Sin participantes
          </span>
        ) : (
          <span className="font-display text-[15px] uppercase tracking-wide text-[#f0c352] sm:text-[17px]">
            {n.toLocaleString("es-PY")}
          </span>
        )}
      </div>
    </div>
  );
}
