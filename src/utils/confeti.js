const COLORES = ["#C8102E", "#e8203e", "#D4A017", "#fde68a", "#ffffff"];

export function lanzarConfeti({ cantidad = 170, retrasoMaxS = 0.9, duracionMinS = 4.5, duracionMaxS = 7.5 } = {}) {
  const contenedor = document.createElement("div");
  contenedor.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999;";
  document.body.appendChild(contenedor);

  for (let i = 0; i < cantidad; i++) {
    const pieza = document.createElement("div");
    const esCirculo = Math.random() < 0.3;
    const ancho = 6 + Math.random() * 6;
    const alto = esCirculo ? ancho : ancho * (1.4 + Math.random() * 0.6);
    const izquierda = Math.random() * 100;
    const retraso = Math.random() * retrasoMaxS;
    const duracion = duracionMinS + Math.random() * (duracionMaxS - duracionMinS);
    const rotacionFinal = 360 * (2 + Math.random() * 3) * (Math.random() < 0.5 ? -1 : 1);
    const color = COLORES[Math.floor(Math.random() * COLORES.length)];

    pieza.style.cssText = `
      position:absolute; top:-24px; left:${izquierda}%;
      width:${ancho}px; height:${alto}px; background:${color};
      opacity:0.95; border-radius:${esCirculo ? "9999px" : "1px"};
      transform: rotate(${Math.random() * 360}deg);
      animation: sorteo-confeti-caida ${duracion}s cubic-bezier(0.45,0,0.55,1) ${retraso}s forwards;
      --rot-final: ${rotacionFinal}deg;
    `;
    contenedor.appendChild(pieza);
  }

  // Recién se limpia el contenedor cuando la pieza más lenta terminó de caer.
  const tiempoTotalMs = (retrasoMaxS + duracionMaxS) * 1000 + 300;
  setTimeout(() => contenedor.remove(), tiempoTotalMs);
}

export function lanzarChispas({
  cantidad = 30,
  duracionMs = 1500,
  centros = [
    { x: 25, y: 35 },
    { x: 75, y: 30 },
    { x: 50, y: 45 },
  ],
} = {}) {
  const contenedor = document.createElement("div");
  contenedor.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9998;";
  document.body.appendChild(contenedor);

  centros.forEach((centro) => {
    for (let i = 0; i < cantidad / centros.length; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const distancia = 90 + Math.random() * 150;
      const dx = Math.cos(angulo) * distancia;
      const dy = Math.sin(angulo) * distancia;
      const tam = 3 + Math.random() * 4;
      const color = COLORES[Math.floor(Math.random() * COLORES.length)];
      const retraso = Math.random() * 0.15;

      const chispa = document.createElement("div");
      chispa.style.cssText = `
        position:absolute; top:${centro.y}%; left:${centro.x}%;
        width:${tam}px; height:${tam}px; background:${color}; border-radius:9999px;
        box-shadow:0 0 8px 1px ${color}; opacity:1;
        transform: translate(-50%,-50%);
        animation: sorteo-chispa 950ms cubic-bezier(0.15,0.6,0.35,1) ${retraso}s forwards;
        --dx: ${dx}px; --dy: ${dy}px;
      `;
      contenedor.appendChild(chispa);
    }
  });

  setTimeout(() => contenedor.remove(), duracionMs);
}

/** Varias tandas de chispas en puntos y momentos distintos: efecto de fuegos artificiales. */
export function lanzarFuegosArtificiales({ tandas = 5 } = {}) {
  for (let t = 0; t < tandas; t++) {
    const retraso = t * 260 + Math.random() * 200;
    setTimeout(() => {
      const x = 12 + Math.random() * 76;
      const y = 15 + Math.random() * 45;
      lanzarChispas({ cantidad: 26, duracionMs: 1100, centros: [{ x, y }] });
    }, retraso);
  }
}
