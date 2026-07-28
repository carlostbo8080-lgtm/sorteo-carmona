export const normalizarCedula = (v) => String(v || "").replace(/\D/g, "").trim();

export const normalizarTelefono = (v) => String(v || "").replace(/[^\d+]/g, "").trim();

export const telefonoValido = (v) => {
  const soloDigitos = String(v || "").replace(/\D/g, "");
  return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

export const BARRIOS_POR_CATEGORIA = {
  "Barrios y Compañías": [
    "Santa Clara", "San José Obrero", "San Juan", "San Antonio", "San Rafael",
    "Las Mercedes", "San Roque", "San Damián", "Santa Rosa", "San Sebastián",
    "San Francisco", "San Isidro", "Sagrado Corazón de Jesús", "San Miguel",
    "San Lorenzo", "San Jorge", "Santo Domingo", "San Pablo",
    "Fray Luis de Bolaños", "Fátima 1", "Santo Tomás", "Area 5", "CONAVI",
    "Centro", "María Auxiliadora", "Caacupe-mí", "Kilómetro 7 Monday", "Tres Fronteras", "San Miguel vila baja",
    "Kilómetro 8 Monday", "Kilómetro 9 Monday", "Kilómetro 10 Monday",
    "Colonia Alfredo Pla", "Península", "Puerto Bertoni", "Saltos del Monday",
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
