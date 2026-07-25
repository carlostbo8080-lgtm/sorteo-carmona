export const normalizarCedula = (v) => String(v || "").replace(/\D/g, "").trim();

export const normalizarTelefono = (v) => String(v || "").replace(/[^\d+]/g, "").trim();

export const telefonoValido = (v) => {
  const soloDigitos = String(v || "").replace(/\D/g, "");
  return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

export const BARRIOS_POR_CATEGORIA = {
  "Barrios Urbanos": [
    "San Miguel", "San Antonio", "San Francisco", "San José", "Virgen de Fátima",
    "San Roque", "Santa Teresita", "Virgen del Rosario", "San Pedro", "Santa Lucía",
    "San Blas", "Villa Artesanal", "Villa Jazmín", "María Auxiliadora", "Juan Pablo II",
  ],
  "Compañías": [
    "21 de Julio", "Ensenada", "Santa Rosa", "Aparypy", "Villa de Mercedes",
    "Costa Alegre", "Loma Verde", "Mompox", "Rosado", "Potrero (Zona A)",
    "Potrero (Zona B)", "Jhuybaty", "Isla Florida", "Isla Guazú", "Asentamiento Kuña Aty",
  ],
};

export const LISTA_BARRIOS = Object.values(BARRIOS_POR_CATEGORIA).flat();

export function traducirErrorSupabase(mensaje) {
  const m = String(mensaje || "").toLowerCase();
  if (m.includes("duplicate key") || m.includes("registros_cedula_limpia_key")) {
    return "Esa cédula ya está registrada.";
  }
  if (m.includes("invalid login credentials")) {
    return "Usuario o contraseña incorrectos.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Sin conexión. Verificá tu internet e intentá de nuevo.";
  }
  return mensaje || "Ocurrió un error inesperado.";
}
