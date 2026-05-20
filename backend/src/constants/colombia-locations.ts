export const COLOMBIA_CITIES = [
  "Bogotá, Colombia",
  "Medellín, Colombia",
  "Cali, Colombia",
  "Barranquilla, Colombia",
  "Cartagena, Colombia",
  "Bucaramanga, Colombia",
  "Pereira, Colombia",
  "Manizales, Colombia",
  "Santa Marta, Colombia",
  "Cúcuta, Colombia",
  "Ibagué, Colombia",
  "Villavicencio, Colombia",
  "Pasto, Colombia",
  "Montería, Colombia",
  "Armenia, Colombia",
] as const;

export const SPECIAL_LOCATIONS = ["Remote / Remoto", "Otra"] as const;

const ALLOWED_INITIAL_LOCATIONS_SET = new Set(
  [...COLOMBIA_CITIES, ...SPECIAL_LOCATIONS].map((item) => item.toLowerCase())
);

export const normalizeLocation = (value: string) => value.trim().replace(/\s+/g, " ");

export const isAllowedInitialLocation = (value: string) =>
  ALLOWED_INITIAL_LOCATIONS_SET.has(normalizeLocation(value).toLowerCase());

export const isSameLocation = (a?: string | null, b?: string | null) => {
  if (!a || !b) return false;
  return normalizeLocation(a).toLowerCase() === normalizeLocation(b).toLowerCase();
};
