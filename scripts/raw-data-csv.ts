import type { DataCenter } from "lm-dc-db-client";

import { toCsv, UTF8_BOM } from "./lib/csv.js";

const RAW_DATA_CSV_HEADERS = [
  "Name des RZ (Recherche)",
  "Betreiber (Recherche)",
  "Eigentümer (Recherche)",
  "Sitz des Eigentümers (Recherche)",
  "Art des Eigentümers (Recherche)",
  "Art des RZ (Expertenmeinung)",
  "Status (Recherche)",
  "Wahrscheinlichkeit (%) (Expertenmeinung)",
  "Baustatus (Recherche)",
  "Region (Recherche)",
  "Metro region (Recherche)",
  "Stadt (Recherche)",
  "Postleitzahl (Recherche)",
  "Latitude",
  "Longitude",
  "Gesamtfläche Gebäude (m²) (Recherche)",
  "Fläche für IT (m²) (Recherche)",
  "Netzanschluss (kW) (Recherche)",
  "Stromkapazität für IT (kW) (Recherche)",
  "Geplante Inbetriebnahme (Recherche)",
  "Verifizierte Quelle 1",
  "Verifizierte Quelle 2",
  "Verifizierte Quelle 3",
  "Verifizierte Quelle 4",
  "Verifizierte Quelle 5",
  "Verifizierte Quelle 6",
] as const;

function cell(v: string | number | null | undefined): string | number | null {
  if (v == null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  return v;
}

function sourceUrls(dc: DataCenter): Array<string | null> {
  const urls = (dc.sources ?? []).map((s) => s.url).filter(Boolean);
  return Array.from({ length: 6 }, (_, i) => urls[i] ?? null);
}

function dataCenterToCsvRow(
  dc: DataCenter,
): Array<string | number | null> {
  const sources = sourceUrls(dc);
  return [
    cell(dc.data_center_name),
    cell(dc.operator_name),
    cell(dc.owner_name),
    cell(dc.owner_country),
    cell(dc.owner_type),
    cell(dc.data_center_type),
    cell(dc.operational_status),
    cell(dc.operational_probability_percentage),
    cell(dc.construction_status),
    cell(dc.region),
    cell(dc.metro_region),
    cell(dc.city),
    cell(dc.postal_code),
    cell(dc.latitude),
    cell(dc.longitude),
    cell(dc.floor_space_sqm),
    cell(dc.it_floor_space_sqm),
    cell(dc.total_power_capacity_kw),
    cell(dc.it_power_capacity_kw),
    cell(dc.planned_commission_date),
    ...sources,
  ];
}

export function buildRawDataCsv(dcs: DataCenter[]): string {
  const sorted = [...dcs].sort((a, b) =>
    (a.data_center_name ?? "").localeCompare(b.data_center_name ?? "", "de"),
  );
  const rows = sorted.map(dataCenterToCsvRow);
  return UTF8_BOM + toCsv(RAW_DATA_CSV_HEADERS, rows);
}
