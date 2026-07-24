// Algoritmo de selección del sorteo. La animación (tambor de nombres) solo
// representa visualmente el resultado que ya decidió este módulo.

export function primerNombre(nombreCompleto) {
  return String(nombreCompleto || "").trim().split(/\s+/)[0] || "";
}

// ── Generador aleatorio criptográficamente seguro (CSPRNG) ─────────
// Usado para decidir quién gana: nunca Math.random() para esto.

/** Flotante uniforme en [0, 1) usando Web Crypto. */
export function flotanteSeguro() {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0x100000000;
}

/** Entero uniforme en [0, maxExclusivo) sin sesgo de módulo (rejection sampling). */
export function enteroSeguro(maxExclusivo) {
  if (maxExclusivo <= 1) return 0;
  const limite = Math.floor(0x100000000 / maxExclusivo) * maxExclusivo;
  const buffer = new Uint32Array(1);
  let valor;
  do {
    crypto.getRandomValues(buffer);
    valor = buffer[0];
  } while (valor >= limite);
  return valor % maxExclusivo;
}

/** Fisher-Yates con el CSPRNG de arriba — nunca favorece la posición original. */
export function barajarSeguro(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = enteroSeguro(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function duracionGiroMs() {
  return 14600 + Math.random() * 800; // ~15 segundos
}
