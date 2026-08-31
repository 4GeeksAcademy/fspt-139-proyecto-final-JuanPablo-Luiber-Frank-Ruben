export const STATUS_LABELS = ["Desconectado", "En línea", "Ocupado", "Ausente", "Durmiendo", "Buscando comerciar", "Buscando jugar"];

export function timeAgoYears(unixSeconds) {
  if (!unixSeconds) return "—";
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleDateString("es-ES", { year: "numeric", month: "long" });
}

export function timeAgoShort(unixSeconds) {
  if (!unixSeconds) return "";
  const diff = Date.now() / 1000 - unixSeconds;
  const days = Math.floor(diff / 86400);
  if (days < 1) return "hoy";
  if (days === 1) return "hace 1 día";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}
