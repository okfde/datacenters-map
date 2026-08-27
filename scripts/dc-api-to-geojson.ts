/**
 * Env: BASE_URL, API_KEY, optional COUNTRY (default Germany).
 * Usage: pnpm build:data
 *        pnpm build:data -- path/to/out.geojson
 */
import fs from "node:fs/promises";
import path from "node:path";
import type {
  DataCenter,
  DataCenterEstimation,
  DataCenterTag,
  Source,
} from "lm-dc-db-client";

import {
  countryFilter,
  createClient,
  hasCoords,
  loadDotEnvFiles,
  ROOT,
} from "./lib/env.js";
import {
  EXPORT_DATA_SOURCE,
  isProtestTag,
  matchesExportDataSource,
  MIN_OPERATIONAL_COMMISSIONING_YEAR,
  ownerCountryFlag,
  shouldIncludeByOperationalCommissioning,
} from "./mapping.js";
import { buildRawDataCsv } from "./raw-data-csv.js";

type GeoFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    id: string;
    name: string;
    operational_status: string | null;
    construction_status: string | null;
    data_center_type: string | null;
    has_protest: boolean;
    size_floor_sqm: number | null;
    size_power_kw: number | null;
    owner_type: string | null;
    owner_country: string | null;
    owner_country_flag: string | null;
    estimated_total_energy_consumption_kwh: number | null;
    source_attributes: Record<string, string>;
  };
};

async function listDataCentersByDismissed(
  dismissed: boolean,
): Promise<DataCenter[]> {
  const client = createClient();
  const country = countryFilter();
  const all: DataCenter[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await client.dataCenters.list({
      country,
      dismissed,
      include: ["tags", "sources"],
      page,
      per_page: 200,
    });
    all.push(...result.data);
    hasNext = result.hasNextPage;
    page += 1;
  }
  return all;
}

async function listAllDataCenters(): Promise<DataCenter[]> {
  const [active, dismissed] = await Promise.all([
    listDataCentersByDismissed(false),
    listDataCentersByDismissed(true),
  ]);
  console.log(
    `Fetched data centers: ${active.length} active, ${dismissed.length} dismissed`,
  );
  const byId = new Map<string, DataCenter>();
  for (const dc of [...active, ...dismissed]) {
    byId.set(dc.id, dc);
  }
  return [...byId.values()];
}

async function listLatestEstimations(): Promise<Map<string, DataCenterEstimation>> {
  const client = createClient();
  const byDc = new Map<string, DataCenterEstimation>();
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const result = await client.estimations.list({
      latest: true,
      page,
      per_page: 200,
    });
    for (const est of result.data) {
      byDc.set(est.data_center_id, est);
    }
    hasNext = result.hasNextPage;
    page += 1;
  }
  return byDc;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function isEmptyAttrValue(value: string | number | null | undefined): boolean {
  if (value == null) return true;
  const s = String(value).trim();
  if (s === "") return true;
  const lower = s.toLowerCase();
  return lower === "null" || lower === "nul";
}

function hasProtest(tags: DataCenterTag[] | undefined): boolean {
  return (tags ?? []).some((t) => isProtestTag(t.type));
}

function intendedUses(tags: DataCenterTag[] | undefined): string {
  return (tags ?? [])
    .filter((t) => t.type === "Intended Use")
    .map((t) => t.value)
    .join("; ");
}

function sourcesList(sources: Source[] | undefined): string {
  return (sources ?? [])
    .map((s) => {
      const label = s.publication_name?.trim() || s.url;
      return `${label}|${s.url}`;
    })
    .join(" || ");
}

function buildSourceAttributes(
  dc: DataCenter,
  est: DataCenterEstimation | undefined,
): Record<string, string> {
  const attrs: Record<string, string> = {};
  const put = (key: string, value: string | number | null | undefined) => {
    if (isEmptyAttrValue(value)) return;
    attrs[key] = String(value).trim();
  };

  put("data_center_name", dc.data_center_name);
  put("operator_name", dc.operator_name);
  put("owner_name", dc.owner_name);
  put("guessed_owner_or_investor", dc.guessed_owner_or_investor);
  put("metro_region", dc.metro_region);
  put("city", dc.city);
  put("postal_code", dc.postal_code);
  put("address", dc.address);
  put("operational_status", dc.operational_status);
  put("construction_status", dc.construction_status);
  put("data_center_type", dc.data_center_type);
  put("commissioning_date", dc.commissioning_date);
  put("planned_commission_date", dc.planned_commission_date);
  put("owner_type", dc.owner_type);
  put("owner_country", dc.owner_country);

  const floorMeasured = num(dc.floor_space_sqm);
  const floorEstimated = num(est?.estimated_floor_space_sqm);
  if (floorMeasured != null) {
    put("floor_space_sqm", floorMeasured);
  } else if (floorEstimated != null) {
    put("estimated_floor_space_sqm", floorEstimated);
  }

  const powerMeasured = num(dc.total_power_capacity_kw);
  const powerEstimated = num(est?.estimated_total_power_capacity_kw);
  if (powerMeasured != null) {
    put("total_power_capacity_kw", powerMeasured);
  } else if (powerEstimated != null) {
    put("estimated_total_power_capacity_kw", powerEstimated);
  }

  put("intended_use", intendedUses(dc.tags) || null);
  put(
    "estimated_total_energy_consumption_kwh",
    est?.estimated_total_energy_consumption_kwh ?? null,
  );
  put("sources", sourcesList(dc.sources) || null);

  return attrs;
}

function toFeature(
  dc: DataCenter,
  est: DataCenterEstimation | undefined,
): GeoFeature | null {
  if (!hasCoords(dc.latitude, dc.longitude)) return null;

  const size_floor_sqm =
    num(dc.floor_space_sqm) ?? num(est?.estimated_floor_space_sqm) ?? null;
  const size_power_kw =
    num(dc.total_power_capacity_kw) ??
    num(est?.estimated_total_power_capacity_kw) ??
    null;

  const owner_country = str(dc.owner_country);
  const owner_type = str(dc.owner_type);

  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [dc.longitude as number, dc.latitude as number],
    },
    properties: {
      id: dc.id,
      name: str(dc.data_center_name) ?? dc.id,
      operational_status: str(dc.operational_status),
      construction_status: str(dc.construction_status),
      data_center_type: str(dc.data_center_type),
      has_protest: hasProtest(dc.tags),
      size_floor_sqm,
      size_power_kw,
      owner_type,
      owner_country,
      owner_country_flag: ownerCountryFlag(owner_country),
      estimated_total_energy_consumption_kwh:
        num(est?.estimated_total_energy_consumption_kwh) ?? null,
      source_attributes: buildSourceAttributes(dc, est),
    },
  };
}

async function main(): Promise<void> {
  await loadDotEnvFiles();
  const outArg = process.argv[2];
  const outPath = path.resolve(
    outArg ?? path.join(ROOT, "public", "data", "datacenters.geojson"),
  );

  const country = countryFilter();
  console.log(
    `Exporting mappable data centers (country=${country}, dismissed=false+true, data_source=${EXPORT_DATA_SOURCE}, coords required, operational commissioning ≥ ${MIN_OPERATIONAL_COMMISSIONING_YEAR})…`,
  );

  const [dcs, estimations] = await Promise.all([
    listAllDataCenters(),
    listLatestEstimations(),
  ]);

  const features: GeoFeature[] = [];
  const includedDcs: DataCenter[] = [];
  let skippedOtherDataSource = 0;
  let matchedDataSource = 0;
  let skippedNoCoords = 0;
  let skippedOperationalBeforeMinYear = 0;
  let protestCount = 0;

  for (const dc of dcs) {
    if (!matchesExportDataSource(dc)) {
      skippedOtherDataSource += 1;
      continue;
    }
    matchedDataSource += 1;

    if (!hasCoords(dc.latitude, dc.longitude)) {
      skippedNoCoords += 1;
      continue;
    }
    if (!shouldIncludeByOperationalCommissioning(dc)) {
      skippedOperationalBeforeMinYear += 1;
      continue;
    }
    const feature = toFeature(dc, estimations.get(dc.id));
    if (!feature) continue;
    if (feature.properties.has_protest) protestCount += 1;
    features.push(feature);
    includedDcs.push(dc);
  }

  const fetchedAt = new Date().toISOString();
  const collection = {
    type: "FeatureCollection" as const,
    fetched_at: fetchedAt,
    features,
  };

  const csvPath = path.join(path.dirname(outPath), "datacenters.csv");

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(collection)}\n`, "utf8");
  await fs.writeFile(csvPath, buildRawDataCsv(includedDcs), "utf8");

  console.log(`Wrote ${features.length} features → ${outPath}`);
  console.log(`Wrote ${includedDcs.length} CSV rows → ${csvPath}`);
  console.log(
    `Matched data_source: ${matchedDataSource}; skipped other data_source: ${skippedOtherDataSource}`,
  );
  console.log(`Skipped (no coordinates): ${skippedNoCoords}`);
  console.log(
    `Skipped (operational before ${MIN_OPERATIONAL_COMMISSIONING_YEAR} / missing date): ${skippedOperationalBeforeMinYear}`,
  );
  console.log(`With protest marker: ${protestCount}`);
  console.log(`Source rows: ${dcs.length}; estimations loaded: ${estimations.size}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
