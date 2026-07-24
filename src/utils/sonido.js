let contexto;

function obtenerContexto() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!contexto) contexto = new (window.AudioContext || window.webkitAudioContext)();
  if (contexto.state === "suspended") contexto.resume();
  return contexto;
}

export function tocarTick() {
  try {
    const c = obtenerContexto();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "square";
    osc.frequency.value = 680 + Math.random() * 120;
    gain.gain.setValueAtTime(0.045, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.06);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + 0.07);
  } catch {
    // Audio es un extra: si falla (navegador sin soporte, contexto bloqueado), se ignora.
  }
}

/** Agenda tics decrecientes (como el clic de una rueda real) a lo largo del giro. */
export function programarTicks(duracionMs) {
  let cancelado = false;
  const inicio = Date.now();

  function paso() {
    if (cancelado) return;
    const transcurrido = Date.now() - inicio;
    if (transcurrido >= duracionMs - 200) return;
    tocarTick();
    const progreso = transcurrido / duracionMs;
    const delay = 55 + progreso * progreso * 300;
    setTimeout(paso, delay);
  }
  paso();

  return () => {
    cancelado = true;
  };
}

export function tocarCelebracion() {
  try {
    const c = obtenerContexto();
    if (!c) return;
    const notas = [523.25, 659.25, 783.99, 1046.5];
    notas.forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const inicio = c.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.0001, inicio);
      gain.gain.exponentialRampToValueAtTime(0.1, inicio + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.55);
      osc.connect(gain).connect(c.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.6);
    });
  } catch {
    // Audio es un extra: si falla, se ignora.
  }
}
