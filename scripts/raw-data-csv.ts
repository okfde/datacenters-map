import type { DataCenter } from "lm-dc-db-client";

import { formatCsvLicensePreamble, toCsv, UTF8_BOM } from "./lib/csv.js";
import { hectaresOrNull, sqmToHectares } from "./mapping.js";

const RAW_DATA_CSV_LICENSE_COMMENT = formatCsvLicensePreamble([
  "BY USING THIS DATA YOU AGREE TO OUR LICENSE TERMS.",
  "",
  "This data is licensed as 'CC BY-NC-SA 4.0' https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "",
  "You are free to:",
  "* Share — copy and redistribute the material in any medium or format",
  "* Adapt — remix, transform, and build upon the material",
  "* The licensor cannot revoke these freedoms as long as you follow the license terms.",
  "",
  "Under the following terms:",
  "",
  "* Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.",
  "* NonCommercial — You may not use the material for commercial purposes.",
  "* ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.",
  "* No additional restrictions — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.",
  "",
  "Attribution: Heisseluft.org - Tiziana von Witzleben (Heisse-Luft-Kollektiv), Joschi Wolf (Frag den Staat), Max Schulze (Leitmotiv)",
  "",
  "Include a link to the map: heisseluft.org",
  "",
  "",
  "If you would like to request the data set with estimations on electricity, emissions and other values that have not been published by the providers, you can do so through this form:",
  "https://dcdb.leitmotiv.digital/request-data",
]);

const RAW_DATA_CSV_HEADERS = [
  "Name des RZ (Recherche)",
  "Betreiber (Recherche)",
  "Eigentümer (Recherche)",
  "Sitz des Eigentümers (Recherche)",
  "Art des Eigentümers (Recherche)",
  "Art des RZ (Expertenmeinung)",
  "Status (Recherche)",
  "Baustatus (Recherche)",
  "Region (Recherche)",
  "Metro region (Recherche)",
  "Stadt (Recherche)",
  "Postleitzahl (Recherche)",
  "Latitude",
  "Longitude",
  "Gesamtfläche Gebäude (ha) (Recherche)",
  "Grundstücksfläche (ha) (Recherche)",
  "Fläche für IT (ha) (Recherche)",
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
    cell(dc.construction_status),
    cell(dc.region),
    cell(dc.metro_region),
    cell(dc.city),
    cell(dc.postal_code),
    cell(dc.latitude),
    cell(dc.longitude),
    cell(sqmToHectares(dc.floor_space_sqm)),
    cell(hectaresOrNull(dc.site_area_hectares)),
    cell(sqmToHectares(dc.it_floor_space_sqm)),
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
  return UTF8_BOM + RAW_DATA_CSV_LICENSE_COMMENT + toCsv(RAW_DATA_CSV_HEADERS, rows);
}
