import { useMemo } from "react";

const CANTIDAD_FLOTANTES = 22;
const CANTIDAD_DESTELLOS = 9;

function generarFlotantes() {
  return Array.from({ length: CANTIDAD_FLOTANTES }, () => ({
    izquierda: Math.random() * 100,
    tamano: 2 + Math.random() * 3.5,
    duracion: 13 + Math.random() * 11,
    retraso: -Math.random() * 22,
    opacidad: 0.18 + Math.random() * 0.42,
    dorado: Math.random() < 0.55,
  }));
}

function generarDestellos() {
  return Array.from({ length: CANTIDAD_DESTELLOS }, () => ({
    izquierda: Math.random() * 100,
    arriba: Math.random() * 100,
    tamano: 2.5 + Math.random() * 2.5,
    retraso: Math.random() * -3.2,
  }));
}

/** Decoración puramente visual: no toca estado ni lógica del sorteo. */
export function ParticulasFlotantes() {
  const flotantes = useMemo(generarFlotantes, []);
  const destellos = useMemo(generarDestellos, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {flotantes.map((p, i) => (
        <span
          key={`f-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${p.izquierda}%`,
            bottom: -20,
            width: p.tamano,
            height: p.tamano,
            background: p.dorado ? "#f5d375" : "#ffffff",
            opacity: p.opacidad,
            boxShadow: p.dorado ? "0 0 6px 1px rgba(245,211,117,0.55)" : "0 0 4px 1px rgba(255,255,255,0.35)",
            animation: `sorteo-flotar ${p.duracion}s linear infinite`,
            animationDelay: `${p.retraso}s`,
          }}
        />
      ))}
      {destellos.map((d, i) => (
        <span
          key={`d-${i}`}
          className="absolute rounded-full bg-[#f5d375] animate-sorteo-titilar"
          style={{
            left: `${d.izquierda}%`,
            top: `${d.arriba}%`,
            width: d.tamano,
            height: d.tamano,
            boxShadow: "0 0 8px 2px rgba(245,211,117,0.5)",
            animationDelay: `${d.retraso}s`,
          }}
        />
      ))}
    </div>
  );
}
