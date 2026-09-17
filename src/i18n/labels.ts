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
  floor_space_ha: "Gesamtfläche Gebäude (ha)",
  estimated_floor_space_ha: "Geschätzte Gesamtfläche Gebäude (ha)",
  site_area_ha: "Grundstücksfläche (ha)",
  total_power_capacity_kw: "Anschlussleistung (kW)",
  estimated_total_power_capacity_kw: "Geschätzte Anschlussleistung (kW)",
  intended_use: "Anwendung",
  estimated_total_energy_consumption_kwh: "Prognostizierter Stromverbrauch (kWh)",
  sources: "Quellen",
  protest_sources: "Protest-Quellen",
};

export const OPERATIONAL_STATUS_LABEL_DE: Record<string, string> = {
  operational: "in Betrieb",
  under_construction: "im Aufbau",
  planned: "geplant",
  paused: "pausiert",
  cancelled: "abgebrochen",
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
  "owner_type",
  "owner_country",
  "metro_region",
  "city",
  "postal_code",
  "address",
  "operational_status",
  "construction_status",
  "data_center_type",
  "commissioning_date",
  "planned_commission_date",
  "intended_use",
  "estimated_total_energy_consumption_kwh",
  "sources",
] as const;

export const ATTR_GROUP_ORDER = [
  "ownership",
  "location",
  "project",
  "technical",
  "other",
] as const;

export type AttrGroupId = (typeof ATTR_GROUP_ORDER)[number];

export const ATTR_GROUP_LABEL_DE: Record<AttrGroupId, string> = {
  ownership: "Eigentum & Betrieb",
  location: "Standort",
  project: "Projekt",
  technical: "Technische Daten",
  other: "Weitere Angaben",
};

const ATTR_KEY_TO_GROUP: Record<string, AttrGroupId> = {
  operator_name: "ownership",
  owner_name: "ownership",
  guessed_owner_or_investor: "ownership",
  owner_type: "ownership",
  owner_country: "ownership",
  metro_region: "location",
  city: "location",
  postal_code: "location",
  address: "location",
  operational_status: "project",
  construction_status: "project",
  data_center_type: "project",
  commissioning_date: "project",
  planned_commission_date: "project",
  floor_space_ha: "technical",
  estimated_floor_space_ha: "technical",
  site_area_ha: "technical",
  total_power_capacity_kw: "technical",
  estimated_total_power_capacity_kw: "technical",
  intended_use: "technical",
  estimated_total_energy_consumption_kwh: "technical",
};

const GROUP_KEY_ORDER: Record<AttrGroupId, readonly string[]> = {
  ownership: [
    "operator_name",
    "owner_name",
    "guessed_owner_or_investor",
    "owner_type",
    "owner_country",
  ],
  location: ["metro_region", "city", "postal_code", "address"],
  project: [
    "operational_status",
    "construction_status",
    "data_center_type",
    "commissioning_date",
    "planned_commission_date",
  ],
  technical: [
    "floor_space_ha",
    "estimated_floor_space_ha",
    "site_area_ha",
    "total_power_capacity_kw",
    "estimated_total_power_capacity_kw",
    "intended_use",
    "estimated_total_energy_consumption_kwh",
  ],
  other: [],
};

export type AttrEntry = [string, string];

export type AttrGroup = {
  id: AttrGroupId;
  label: string;
  entries: AttrEntry[];
};

function attrGroupForKey(key: string): AttrGroupId {
  return ATTR_KEY_TO_GROUP[key] ?? "other";
}

function sortEntriesForGroup(
  groupId: AttrGroupId,
  entries: AttrEntry[],
): AttrEntry[] {
  const order = GROUP_KEY_ORDER[groupId];
  if (order.length === 0) {
    return [...entries].sort(([a], [b]) => a.localeCompare(b, "de"));
  }
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...entries].sort(([a], [b]) => {
    const ra = rank.get(a) ?? order.length;
    const rb = rank.get(b) ?? order.length;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b, "de");
  });
}

function collectAttrEntries(
  attrs: Record<string, string>,
  sizeFloorHa: number | null | undefined,
  sizeSiteHa: number | null | undefined,
  sizePowerKw: number | null | undefined,
  operationalStatus: string | null | undefined,
): AttrEntry[] {
  const used = new Set<string>();
  const out: AttrEntry[] = [];
  const showConstructionPhase = operationalStatus === "under_construction";

  for (const key of PRIMARY_ATTR_KEYS) {
    if (key === "sources") continue;
    if (key === "construction_status" && !showConstructionPhase) continue;
    if (key === "intended_use") {
      for (const entry of resolveFloorPowerEntries(
        attrs,
        sizeFloorHa,
        sizeSiteHa,
        sizePowerKw,
      )) {
        out.push(entry);
        used.add(entry[0]);
      }
    }
    const v = attrs[key];
    if (isEmptyAttrDisplayValue(v)) continue;
    out.push([key, v]);
    used.add(key);
  }

  for (const [k, v] of Object.entries(attrs)) {
    if (
      used.has(k) ||
      k === "data_center_name" ||
      k === "sources" ||
      k === "protest_sources"
    )
      continue;
    if (FLOOR_POWER_ATTR_KEYS.has(k) || HIDDEN_ATTR_KEYS.has(k)) continue;
    if (k === "construction_status" && !showConstructionPhase) continue;
    if (isEmptyAttrDisplayValue(v)) continue;
    out.push([k, v]);
  }
  return out;
}

export function groupedAttrEntries(
  attrs: Record<string, string>,
  sizeFloorHa: number | null | undefined,
  sizeSiteHa: number | null | undefined,
  sizePowerKw: number | null | undefined,
  operationalStatus: string | null | undefined,
): AttrGroup[] {
  const flat = collectAttrEntries(
    attrs,
    sizeFloorHa,
    sizeSiteHa,
    sizePowerKw,
    operationalStatus,
  );
  const buckets = new Map<AttrGroupId, AttrEntry[]>(
    ATTR_GROUP_ORDER.map((id) => [id, []]),
  );

  for (const entry of flat) {
    buckets.get(attrGroupForKey(entry[0]))!.push(entry);
  }

  return ATTR_GROUP_ORDER.flatMap((id) => {
    const entries = sortEntriesForGroup(id, buckets.get(id)!);
    if (entries.length === 0) return [];
    return [{ id, label: ATTR_GROUP_LABEL_DE[id], entries }];
  });
}

export const FLOOR_POWER_ATTR_KEYS = new Set([
  "floor_space_ha",
  "estimated_floor_space_ha",
  "site_area_ha",
  "total_power_capacity_kw",
  "estimated_total_power_capacity_kw",
]);

/** Dropped from export/UI; ignore if still present in cached GeoJSON. */
export const HIDDEN_ATTR_KEYS = new Set([
  "operational_probability_percentage",
  "estimated_water_consumption_liters",
  "floor_space_sqm",
  "estimated_floor_space_sqm",
  "site_area_sqm",
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
  "floor_space_ha",
  "estimated_floor_space_ha",
  "site_area_ha",
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
  sizeFloorHa: number | null | undefined,
  sizeSiteHa: number | null | undefined,
  sizePowerKw: number | null | undefined,
): Array<[string, string]> {
  const floor: [string, string] = !isEmptyAttrDisplayValue(attrs.floor_space_ha)
    ? ["floor_space_ha", attrs.floor_space_ha]
    : !isEmptyAttrDisplayValue(attrs.estimated_floor_space_ha)
      ? ["estimated_floor_space_ha", attrs.estimated_floor_space_ha]
      : sizeFloorHa != null && Number.isFinite(sizeFloorHa)
        ? ["estimated_floor_space_ha", String(sizeFloorHa)]
        : ["floor_space_ha", UNKNOWN_ATTR_VALUE];

  const site: [string, string] = !isEmptyAttrDisplayValue(attrs.site_area_ha)
    ? ["site_area_ha", attrs.site_area_ha]
    : sizeSiteHa != null && Number.isFinite(sizeSiteHa)
      ? ["site_area_ha", String(sizeSiteHa)]
      : ["site_area_ha", UNKNOWN_ATTR_VALUE];

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

  return [floor, site, power];
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

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

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
    .filter((s) => isHttpUrl(s.url));
}
