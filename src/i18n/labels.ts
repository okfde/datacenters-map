export const FIELD_LABEL_DE: Record<string, string> = {
  data_center_name: "Name",
  operator_name: "Betreiber",
  owner_name: "Eigentümer",
  guessed_owner_or_investor: "Investor",
  metro_region: "Metro-Region",
  city: "Stadt",
  postal_code: "Postleitzahl",
  address: "Adresse",
  operational_status: "Status",
  construction_status: "Bauphase",
  data_center_type: "Art des RZ",
  commissioning_date: "Inbetriebnahme",
  planned_commission_date: "Geplante Inbetriebnahme",
  owner_type: "Art des Eigentümers (UBO)",
  owner_country: "Sitz des Eigentümers (UBO)",
  floor_space_sqm: "Gesamtfläche Gebäude (m²)",
  estimated_floor_space_sqm: "Geschätzte Gesamtfläche Gebäude (m²)",
  total_power_capacity_kw: "Anschlussleistung (kW)",
  estimated_total_power_capacity_kw: "Geschätzte Anschlussleistung (kW)",
  intended_use: "Anwendung",
  estimated_total_energy_consumption_kwh: "Prognostizierter Stromverbrauch (kWh)",
  sources: "Quellen",
};

export const OPERATIONAL_STATUS_LABEL_DE: Record<string, string> = {
  operational: "in Betrieb",
  under_construction: "im Aufbau",
  planned: "geplant",
  paused: "pausiert",
  unknown: "unbekannt",
  Unknown: "unbekannt",
};

export const CONSTRUCTION_STATUS_LABEL_DE: Record<string, string> = {
  planning: "Planung",
  groundbreaking: "Spatenstich",
  foundation_laid: "Grundsteinlegung",
  topping_out: "Richtfest",
  under_construction: "im Bau",
  completed: "fertiggestellt",
  unknown: "unbekannt",
  Unknown: "unbekannt",
};

export const DATA_CENTER_TYPE_LABEL_DE: Record<string, string> = {
  Hyperscale: "Hyperscale",
  "Co-Location": "Colocation",
  Enterprise: "Unternehmen",
  Government: "Behörden",
  University: "Hochschule",
  Regional: "Regional",
  unknown: "unbekannt",
  Unknown: "unbekannt",
};

export const OWNER_TYPE_LABEL_DE: Record<string, string> = {
  Investor: "Investor (PE, Infra Fonds)",
  Developer: "Immobilien-Entwickler",
  Operator: "Betreiber ist Eigentümer",
  Utility: "Betreiber ist Nutzer (Versorgungsunternehmen)",
  Enterprise: "Betreiber ist Nutzer (Unternehmen)",
  Government: "Betreiber ist Nutzer (Behörde)",
  University: "Betreiber ist Nutzer (Universität)",
  unknown: "unbekannt",
  Unknown: "unbekannt",
};

export const OWNER_COUNTRY_LABEL_DE: Record<string, string> = {
  Germany: "Deutschland",
  "United States": "Vereinigte Staaten",
  "United Kingdom": "Großbritannien",
  France: "Frankreich",
  Japan: "Japan",
  Sweden: "Schweden",
  Norway: "Norwegen",
  Australia: "Australien",
  EU: "EU",
  Unknown: "unbekannt",
  unknown: "unbekannt",
};

export const PRIMARY_ATTR_KEYS = [
  "operator_name",
  "owner_name",
  "guessed_owner_or_investor",
  "metro_region",
  "city",
  "postal_code",
  "address",
  "operational_status",
  "construction_status",
  "data_center_type",
  "commissioning_date",
  "planned_commission_date",
  "owner_type",
  "owner_country",
  "intended_use",
  "estimated_total_energy_consumption_kwh",
  "sources",
] as const;

export const FLOOR_POWER_ATTR_KEYS = new Set([
  "floor_space_sqm",
  "estimated_floor_space_sqm",
  "total_power_capacity_kw",
  "estimated_total_power_capacity_kw",
]);

/** Dropped from export/UI; ignore if still present in cached GeoJSON. */
export const HIDDEN_ATTR_KEYS = new Set([
  "operational_probability_percentage",
  "estimated_water_consumption_liters",
]);

const UNKNOWN_ATTR_VALUE = "unbekannt";

function isUnknownToken(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "unknown" || v === "unbekannt";
}

export function normalizeUnknownDisplay(value: string): string {
  return isUnknownToken(value) ? UNKNOWN_ATTR_VALUE : value;
}

const NUMERIC_ATTR_KEYS = new Set([
  "floor_space_sqm",
  "estimated_floor_space_sqm",
  "total_power_capacity_kw",
  "estimated_total_power_capacity_kw",
  "estimated_total_energy_consumption_kwh",
]);

const numberDe = new Intl.NumberFormat("de-DE");

export function formatNumberDe(n: number): string {
  return numberDe.format(n);
}

export function isEmptyAttrDisplayValue(
  value: string | null | undefined,
): boolean {
  if (value == null) return true;
  const s = value.trim();
  if (s === "") return true;
  const lower = s.toLowerCase();
  return lower === "null" || lower === "nul";
}

export function resolveFloorPowerEntries(
  attrs: Record<string, string>,
  sizeFloorSqm: number | null | undefined,
  sizePowerKw: number | null | undefined,
): Array<[string, string]> {
  const floor: [string, string] = !isEmptyAttrDisplayValue(attrs.floor_space_sqm)
    ? ["floor_space_sqm", attrs.floor_space_sqm]
    : !isEmptyAttrDisplayValue(attrs.estimated_floor_space_sqm)
      ? ["estimated_floor_space_sqm", attrs.estimated_floor_space_sqm]
      : sizeFloorSqm != null && Number.isFinite(sizeFloorSqm)
        ? ["estimated_floor_space_sqm", String(sizeFloorSqm)]
        : ["floor_space_sqm", UNKNOWN_ATTR_VALUE];

  const power: [string, string] = !isEmptyAttrDisplayValue(
    attrs.total_power_capacity_kw,
  )
    ? ["total_power_capacity_kw", attrs.total_power_capacity_kw]
    : !isEmptyAttrDisplayValue(attrs.estimated_total_power_capacity_kw)
      ? [
          "estimated_total_power_capacity_kw",
          attrs.estimated_total_power_capacity_kw,
        ]
      : sizePowerKw != null && Number.isFinite(sizePowerKw)
        ? ["estimated_total_power_capacity_kw", String(sizePowerKw)]
        : ["total_power_capacity_kw", UNKNOWN_ATTR_VALUE];

  return [floor, power];
}

export function fieldLabelDe(key: string): string {
  return FIELD_LABEL_DE[key] ?? key;
}

const DATE_ATTR_KEYS = new Set([
  "commissioning_date",
  "planned_commission_date",
]);

export function formatDateDe(raw: string): string {
  const s = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d}.${m}.${y}`;
  }
  const ymd = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${d}.${m}.${y}`;
  }
  return s;
}

export function formatAttrValue(key: string, value: string): string {
  if (isUnknownToken(value)) return UNKNOWN_ATTR_VALUE;
  if (DATE_ATTR_KEYS.has(key)) {
    return formatDateDe(value);
  }
  if (key === "operational_status") {
    return normalizeUnknownDisplay(
      OPERATIONAL_STATUS_LABEL_DE[value] ?? value,
    );
  }
  if (key === "construction_status") {
    return normalizeUnknownDisplay(
      CONSTRUCTION_STATUS_LABEL_DE[value] ?? value,
    );
  }
  if (key === "data_center_type") {
    return normalizeUnknownDisplay(DATA_CENTER_TYPE_LABEL_DE[value] ?? value);
  }
  if (key === "owner_type") {
    return normalizeUnknownDisplay(OWNER_TYPE_LABEL_DE[value] ?? value);
  }
  if (key === "owner_country") {
    return normalizeUnknownDisplay(OWNER_COUNTRY_LABEL_DE[value] ?? value);
  }
  if (NUMERIC_ATTR_KEYS.has(key)) {
    const n = Number(value);
    if (Number.isFinite(n)) return formatNumberDe(n);
  }
  return normalizeUnknownDisplay(value);
}

export function formatDbValueDe(
  kind: "status" | "type" | "owner_type" | "owner_country",
  value: string | null | undefined,
): string {
  if (value != null && isUnknownToken(value)) return UNKNOWN_ATTR_VALUE;
  const v = value ?? "unknown";
  if (kind === "status") {
    return normalizeUnknownDisplay(OPERATIONAL_STATUS_LABEL_DE[v] ?? v);
  }
  if (kind === "type") {
    return normalizeUnknownDisplay(DATA_CENTER_TYPE_LABEL_DE[v] ?? v);
  }
  if (kind === "owner_type") {
    return normalizeUnknownDisplay(OWNER_TYPE_LABEL_DE[v] ?? v);
  }
  return normalizeUnknownDisplay(OWNER_COUNTRY_LABEL_DE[v] ?? v);
}

export type ParsedSource = { label: string; url: string };

export function parseSources(raw: string | undefined): ParsedSource[] {
  if (!raw?.trim()) return [];
  return raw
    .split(" || ")
    .map((part) => {
      const pipe = part.indexOf("|");
      if (pipe === -1) return { label: part.trim(), url: part.trim() };
      return {
        label: part.slice(0, pipe).trim() || part.slice(pipe + 1).trim(),
        url: part.slice(pipe + 1).trim(),
      };
    })
    .filter((s) => s.url);
}
