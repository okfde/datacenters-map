export type DcOperationalStatus =
  | "operational"
  | "under_construction"
  | "planned"
  | "paused"
  | "unknown";

export const ALL_STATUS: DcOperationalStatus[] = [
  "planned",
  "under_construction",
  "operational",
  "paused",
  "unknown",
];

export type DataCenterProperties = {
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
  owner_country_flag?: string | null;
  estimated_total_energy_consumption_kwh?: number | null;
  source_attributes?: Record<string, string>;
};

export type DataCenterFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: DataCenterProperties;
};

export type DataCenterCollection = {
  type: "FeatureCollection";
  fetched_at?: string;
  features: DataCenterFeature[];
};

/** Statuses that appear in the collection */
export function collectPresentStatuses(
  data: DataCenterCollection,
): DcOperationalStatus[] {
  const present = new Set<DcOperationalStatus>();
  for (const f of data.features) {
    const raw = f.properties.operational_status?.trim();
    const status = (raw || "unknown") as DcOperationalStatus;
    if ((ALL_STATUS as string[]).includes(status)) present.add(status);
    else present.add("unknown");
  }
  return ALL_STATUS.filter((s) => present.has(s));
}

export type GasPlantStatus =
  | "exploration"
  | "preparation"
  | "operational";

export type GasPlantProperties = {
  id: string;
  name: string;
  infra_type: "gas_plant";
  status: GasPlantStatus;
  capacity_mw: number | null;
  source_url: string | null;
  description?: string | null;
  source_attributes?: Record<string, string>;
};

export type GasPlantFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: GasPlantProperties;
};

export type GasPlantCollection = {
  type: "FeatureCollection";
  features: GasPlantFeature[];
};

export type MapSelectableFeature = DataCenterFeature | GasPlantFeature;

export function isGasPlantFeature(
  f: MapSelectableFeature,
): f is GasPlantFeature {
  return "infra_type" in f.properties && f.properties.infra_type === "gas_plant";
}

type PointFeature = {
  geometry: { type: "Point"; coordinates: [number, number] };
};

export function featuresAtSameLocation<T extends PointFeature>(
  collection: { features: T[] } | null | undefined,
  feature: T,
): T[] {
  if (!collection) return [feature];
  const [lon, lat] = feature.geometry.coordinates;
  return collection.features.filter(
    (f) =>
      f.geometry.coordinates[0] === lon &&
      f.geometry.coordinates[1] === lat,
  );
}

export function datacentersAtSameLocation(
  collection: DataCenterCollection | null | undefined,
  feature: DataCenterFeature,
): DataCenterFeature[] {
  return featuresAtSameLocation(collection, feature);
}

export function gasPlantsAtSameLocation(
  collection: GasPlantCollection | null | undefined,
  feature: GasPlantFeature,
): GasPlantFeature[] {
  return featuresAtSameLocation(collection, feature);
}
