export const MIN_OPERATIONAL_COMMISSIONING_YEAR = 2026;

export const EXPORT_DATA_SOURCE = "Data Center Rebellion (Germany dataset)";

export function matchesExportDataSource(dc: {
  data_source: string | null | undefined;
}): boolean {
  return (dc.data_source ?? "").trim() === EXPORT_DATA_SOURCE;
}

export function isProtestTag(type: string): boolean {
  return type === "Civil Action";
}

export function yearFromDate(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "") return null;
  const match = /^(\d{4})/.exec(s);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

export function shouldIncludeByOperationalCommissioning(dc: {
  operational_status: string | null | undefined;
  commissioning_date: string | null | undefined;
}): boolean {
  if (dc.operational_status !== "operational") return true;
  const year = yearFromDate(dc.commissioning_date);
  return year != null && year >= MIN_OPERATIONAL_COMMISSIONING_YEAR;
}

const OWNER_COUNTRY_FLAGS: Record<string, string> = {
  Germany: "🇩🇪",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  France: "🇫🇷",
  Japan: "🇯🇵",
  Sweden: "🇸🇪",
  Norway: "🇳🇴",
  Australia: "🇦🇺",
  EU: "🇪🇺",
  Unknown: "🏳️",
};

export function ownerCountryFlag(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const key = String(raw).trim();
  return OWNER_COUNTRY_FLAGS[key] ?? "🏳️";
}
