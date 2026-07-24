export const normalizarCedula = (v) => String(v || "").replace(/\D/g, "").trim();

export const normalizarTelefono = (v) => String(v || "").replace(/[^\d+]/g, "").trim();

export const telefonoValido = (v) => {
  const soloDigitos = String(v || "").replace(/\D/g, "");
  return soloDigitos.length >= 8 && soloDigitos.length <= 15;
};

export const LISTA_BARRIOS = [
  "San Miguel", "San Antonio", "San Francisco", "San José", "Virgen de Fátima",
  "San Roque González de Santa Cruz", "Santa Teresita", "Virgen del Rosario",
  "San Pedro", "Santa Lucía", "San Blas", "Villa Artesanal", "Villa Jazmín",
  "María Auxiliadora", "Santo Tomás", "21 de Julio", "Aparypy", "Rosado",
  "Mompox", "Ensenada", "Santa Rosa", "Costa Alegre", "Loma Verde",
  "Potrero \"Zona A\"", "Potrero \"Zona B\"", "Potrero \"Zona C\"",
  "Núcleo Rural 6 de Enero", "Jhuyvaty", "Isla Florida", "Karanda'yty",
  "Santa Cruz", "Serranía", "Loma Clavel", "Colonia Independencia",
  "Tacuaralito", "Caacupemí", "Itá Guazú", "Vallepé", "Zanja Jhú",
  "Yhovy", "Mbocayaty", "Santa Librada", "Costa Pucú", "Hugua Pytã",
];

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
