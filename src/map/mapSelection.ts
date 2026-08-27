import type maplibregl from "maplibre-gl";

import {
  DC_CLUSTER_HALO_LAYER,
  DC_CLUSTERS_LAYER,
  DC_HIT_LAYER,
  DC_ICON_HIT_LAYER,
  GAS_PLANTS_HIT_LAYER,
  expandClusterAtPoint,
  hitLayersForMode,
} from "./layers";
import type {
  DataCenterCollection,
  GasPlantCollection,
  MapSelectableFeature,
} from "../types/data";
import {
  datacentersAtSameLocation,
  gasPlantsAtSameLocation,
} from "../types/data";
import type { SizeMetric } from "../url/params";

export type MapPickResult =
  | { kind: "cluster" }
  | { kind: "select"; feature: MapSelectableFeature | null; highlightIds: string[] };

export function pickFeatureAtPoint(opts: {
  map: maplibregl.Map;
  point: maplibregl.PointLike;
  interactive: boolean;
  sizeMetric: SizeMetric;
  data: DataCenterCollection;
  gasPlantsVisible: boolean;
  gasPlants: GasPlantCollection | null;
}): MapPickResult | null {
  if (!opts.interactive) return null;
  if (expandClusterAtPoint(opts.map, opts.point)) return { kind: "cluster" };

  const dcLayers = hitLayersForMode(opts.sizeMetric).filter((id) =>
    Boolean(opts.map.getLayer(id)),
  );
  const dcHits =
    dcLayers.length > 0
      ? opts.map.queryRenderedFeatures(opts.point, { layers: dcLayers })
      : [];
  const dcHit = dcHits[0];
  if (dcHit?.properties) {
    const id = String(dcHit.properties.id);
    const feature =
      opts.data.features.find((f) => f.properties.id === id) ?? null;
    const highlightIds = feature
      ? datacentersAtSameLocation(opts.data, feature).map((f) => f.properties.id)
      : [];
    return { kind: "select", feature, highlightIds };
  }

  if (
    opts.gasPlantsVisible &&
    opts.map.getLayer(GAS_PLANTS_HIT_LAYER) &&
    opts.map.getLayoutProperty(GAS_PLANTS_HIT_LAYER, "visibility") !== "none"
  ) {
    const gasHits = opts.map.queryRenderedFeatures(opts.point, {
      layers: [GAS_PLANTS_HIT_LAYER],
    });
    const gasHit = gasHits[0];
    if (gasHit?.properties) {
      const id = String(gasHit.properties.id);
      const feature =
        opts.gasPlants?.features.find((f) => f.properties.id === id) ?? null;
      const highlightIds = feature
        ? gasPlantsAtSameLocation(opts.gasPlants, feature).map(
            (f) => f.properties.id,
          )
        : [];
      return { kind: "select", feature, highlightIds };
    }
  }

  return { kind: "select", feature: null, highlightIds: [] };
}

export function cursorHitLayers(
  map: maplibregl.Map,
  sizeMetric: SizeMetric,
  gasPlantsVisible: boolean,
): string[] {
  const layers =
    sizeMetric === "icon"
      ? [DC_ICON_HIT_LAYER, DC_CLUSTERS_LAYER, DC_CLUSTER_HALO_LAYER]
      : [DC_HIT_LAYER];
  if (gasPlantsVisible && map.getLayer(GAS_PLANTS_HIT_LAYER)) {
    layers.push(GAS_PLANTS_HIT_LAYER);
  }
  return layers.filter((id) => map.getLayer(id));
}
