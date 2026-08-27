import type { LegendFilter, OverlayVisibility } from "../map/layers";
import { GERMANY_CAMERA, type CameraSpec } from "../map/mapActions";
import { NULL_FILTER_VALUE } from "../map/constants";
import type { DataCenterCollection, DcOperationalStatus } from "../types/data";
import type { SizeMetric } from "../url/params";
import type { SceneId } from "./ids";

export type { SceneId } from "./ids";

export type SceneDefinition = {
  camera?: CameraSpec;
  layerOpacity?: number;
  legendOverride?: Partial<LegendFilter>;
  overlays?: Partial<OverlayVisibility>;
  selectFeatureId?: string;
  selectFeatureIds?: string[];
  sizeMetric?: SizeMetric;
  searchQ?: string;
  highlightSearch?: boolean;
  showLegend?: boolean;
  statusCycle?: boolean;
};

export const STORY_ORDER: SceneId[] = [
  "intro",
  "status",
  "energy",
  "energyGas",
  "water",
  "waterStress",
  "waterBaruth",
  "bigtech",
  "bigtechSearch",
  "protests",
  "protestsLayer",
  "outro",
  "outroFaq",
];

const ALL_STATUS_ON: Record<DcOperationalStatus, boolean> = {
  planned: true,
  under_construction: true,
  operational: true,
  paused: true,
  unknown: true,
};

export const FEATURE_NONNENDAMALLEE =
  "db0792d2-cad8-4064-a0dc-0e43d043e7e7";

export const FEATURE_BARUTH = "67199486-2986-4a6c-addd-176e5210b998";

export const FEATURE_MASSEN = "dcc31a87-0459-4b96-9b67-682a5b139267";

const BERLIN_BB_CAMERA: CameraSpec = {
  mode: "fitBounds",
  bounds: [12.89, 52.22, 13.74, 52.72],
  padding: 64,
};

const FRANKFURT_CAMERA: CameraSpec = {
  mode: "flyTo",
  center: [8.68, 50.11],
  zoom: 9.2,
};

const BARUTH_CAMERA: CameraSpec = {
  mode: "flyTo",
  center: [13.50660787, 52.07740662],
  zoom: 11,
};

const MASSEN_CAMERA: CameraSpec = {
  mode: "flyTo",
  center: [13.73914809, 51.63572311],
  zoom: 11,
};

const WESTDEUTSCHLAND_CAMERA: CameraSpec = {
  mode: "flyTo",
  center: [7.4, 50.4],
  zoom: 7.0,
};

function allKeysOn(values: string[]): Record<string, boolean> {
  return Object.fromEntries(values.map((v) => [v, true]));
}

function collectKeys(
  data: DataCenterCollection,
  getter: (f: (typeof data.features)[0]) => string | null | undefined,
): string[] {
  const set = new Set<string>();
  let hasNull = false;
  for (const f of data.features) {
    const v = getter(f);
    if (v) set.add(v);
    else hasNull = true;
  }
  const keys = [...set].sort();
  if (hasNull) keys.push(NULL_FILTER_VALUE);
  return keys;
}

export function buildDefaultLegendFilter(data: DataCenterCollection): LegendFilter {
  const types = collectKeys(data, (f) => f.properties.data_center_type);
  const ownerTypes = collectKeys(data, (f) => f.properties.owner_type);
  const ownerCountries = collectKeys(data, (f) => f.properties.owner_country);
  return {
    enabledStatus: { ...ALL_STATUS_ON },
    enabledTypes: allKeysOn(types),
    enabledOwnerTypes: allKeysOn(ownerTypes),
    enabledOwnerCountries: allKeysOn(ownerCountries),
    protestOnly: false,
    minPowerKw: null,
    hasWaterEstimate: false,
  };
}

function openFilters(
  allTypes: Record<string, boolean>,
  allOwnerTypes: Record<string, boolean>,
  allOwnerCountries: Record<string, boolean>,
  extras?: Partial<LegendFilter>,
): Partial<LegendFilter> {
  return {
    enabledStatus: { ...ALL_STATUS_ON },
    enabledTypes: allTypes,
    enabledOwnerTypes: allOwnerTypes,
    enabledOwnerCountries: allOwnerCountries,
    protestOnly: false,
    minPowerKw: null,
    hasWaterEstimate: false,
    ...extras,
  };
}

export function buildSceneRegistry(
  data: DataCenterCollection,
): Record<SceneId, SceneDefinition> {
  const types = collectKeys(data, (f) => f.properties.data_center_type);
  const ownerTypes = collectKeys(data, (f) => f.properties.owner_type);
  const ownerCountries = collectKeys(data, (f) => f.properties.owner_country);
  const allTypes = allKeysOn(types);
  const allOwnerTypes = allKeysOn(ownerTypes);
  const allOwnerCountries = allKeysOn(ownerCountries);

  const baseOpen = openFilters(allTypes, allOwnerTypes, allOwnerCountries);

  return {
    intro: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.85,
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "icon",
    },
    status: {
      camera: BERLIN_BB_CAMERA,
      layerOpacity: 0.9,
      overlays: { gasPlants: false, groundwater: false },
      selectFeatureId: FEATURE_NONNENDAMALLEE,
      sizeMetric: "icon",
    },
    energy: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "power",
    },
    energyGas: {
      camera: FRANKFURT_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: true, groundwater: false },
      sizeMetric: "power",
    },
    water: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: true },
      sizeMetric: "icon",
    },
    waterStress: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: true },
      sizeMetric: "icon",
    },
    waterBaruth: {
      camera: BARUTH_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: true },
      selectFeatureId: FEATURE_BARUTH,
      sizeMetric: "icon",
    },
    bigtech: {
      camera: MASSEN_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: false },
      selectFeatureId: FEATURE_MASSEN,
      sizeMetric: "icon",
    },
    bigtechSearch: {
      camera: MASSEN_CAMERA,
      layerOpacity: 0.9,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: false },
      selectFeatureId: FEATURE_MASSEN,
      searchQ: "Amazon",
      highlightSearch: true,
      showLegend: true,
      sizeMetric: "icon",
    },
    protests: {
      camera: MASSEN_CAMERA,
      layerOpacity: 0.95,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "icon",
    },
    protestsLayer: {
      camera: WESTDEUTSCHLAND_CAMERA,
      layerOpacity: 0.95,
      legendOverride: {
        ...baseOpen,
        protestOnly: true,
      },
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "icon",
    },
    outro: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.85,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "icon",
      statusCycle: true,
      showLegend: true,
    },
    outroFaq: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.85,
      legendOverride: baseOpen,
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "icon",
      statusCycle: true,
      showLegend: true,
    },
    explore: {
      camera: GERMANY_CAMERA,
      layerOpacity: 0.85,
      overlays: { gasPlants: false, groundwater: false },
      sizeMetric: "icon",
    },
  };
}
