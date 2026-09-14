import type maplibregl from "maplibre-gl";

import {
  featureMatchesSearchQuery,
  type DataCenterCollection,
  type DataCenterFeature,
  type DcOperationalStatus,
} from "../types/data";
import type { SizeMetric } from "../url/params";
import {
  BRAND_CREAM,
  BRAND_INK,
  BRAND_PINK,
  BRAND_YELLOW,
  NULL_FILTER_VALUE,
  STATUS_COLORS,
} from "./constants";
import {
  DC_CLUSTER_COUNT_LAYER,
  DC_CLUSTER_HALO_LAYER,
  DC_CLUSTERS_LAYER,
  DC_CIRCLES_LAYER,
  DC_HIT_LAYER,
  DC_ICON_HIT_LAYER,
  DC_ICON_PROTEST_LAYER,
  DC_ICON_SOURCE_ID,
  DC_ICONS_LAYER,
  DC_PROTEST_LAYER,
  DC_SOURCE_ID,
  DC_UNKNOWN_SIZE_LAYER,
} from "./layerIds";
import {
  ICON_SIZE_DEFAULT,
  ICON_SIZE_SELECTED,
  MEGAPHONE_OFFSET_ICONS,
  MEGAPHONE_SIZE_CIRCLES,
  MEGAPHONE_SIZE_ICONS,
  MEGAPHONE_SIZE_ICONS_SELECTED,
  RACK_ICON_OUTLINE_SUFFIX,
  ensureMegaphoneIcon,
  ensureRackIcons,
  iconSizeForSelection,
  megaphoneOffsetForSelection,
} from "./loadIcons";

const CLUSTER_MAX_ZOOM = 10;
const CLUSTER_RADIUS = 28;
const CLUSTER_MIN_POINTS = 3;
const UNKNOWN_SIZE_RADIUS = 8;
const DC_OPACITY_WHEN_GAS_OVERLAY = 0.6;

const CLUSTER_DISC_RADIUS: maplibregl.ExpressionSpecification = [
  "step",
  ["get", "point_count"],
  17,
  6,
  21,
  15,
  26,
  40,
  32,
];

const CLUSTER_HALO_RADIUS: maplibregl.ExpressionSpecification = [
  "step",
  ["get", "point_count"],
  24,
  6,
  29,
  15,
  35,
  40,
  42,
];

const UNCLUSTERED: maplibregl.FilterSpecification = [
  "!",
  ["has", "point_count"],
] as maplibregl.FilterSpecification;

let highlightedFeatureIds: string[] = [];
let rackIconsOutlined = false;
let fullCollection: DataCenterCollection | null = null;
let currentMetric: SizeMetric = "icon";
let dcStoryLayerOpacity = 1;
let gasOverlayDimActive = false;

function selectedCircleStrokeColor(): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    BRAND_PINK,
    "#1a1a1a",
  ];
}

function selectedCircleStrokeWidth(): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    2,
    1,
  ];
}

function applyCircleHighlightState(
  map: maplibregl.Map,
  id: string,
  selected: boolean,
): void {
  if (!map.getSource(DC_SOURCE_ID)) return;
  map.setFeatureState({ source: DC_SOURCE_ID, id }, { selected });
}

function applyIconSizeHighlight(map: maplibregl.Map, ids: string[]): void {
  if (map.getLayer(DC_ICONS_LAYER)) {
    map.setLayoutProperty(
      DC_ICONS_LAYER,
      "icon-size",
      iconSizeForSelection(ids, ICON_SIZE_DEFAULT, ICON_SIZE_SELECTED),
    );
  }
  if (map.getLayer(DC_ICON_PROTEST_LAYER)) {
    map.setLayoutProperty(
      DC_ICON_PROTEST_LAYER,
      "icon-size",
      iconSizeForSelection(
        ids,
        MEGAPHONE_SIZE_ICONS,
        MEGAPHONE_SIZE_ICONS_SELECTED,
      ),
    );
    map.setLayoutProperty(
      DC_ICON_PROTEST_LAYER,
      "icon-offset",
      megaphoneOffsetForSelection(ids),
    );
  }
}

function reapplySelectedHighlight(map: maplibregl.Map): void {
  if (highlightedFeatureIds.length === 0) return;
  // setData clears feature-state; icon-size layout expressions keep the ids.
  for (const id of highlightedFeatureIds) {
    applyCircleHighlightState(map, id, true);
  }
  applyIconSizeHighlight(map, highlightedFeatureIds);
}

export function setSelectedDataCenterHighlight(
  map: maplibregl.Map,
  id: string | string[] | null,
): void {
  for (const prev of highlightedFeatureIds) {
    applyCircleHighlightState(map, prev, false);
  }
  highlightedFeatureIds =
    id == null ? [] : Array.isArray(id) ? [...id] : [id];
  for (const next of highlightedFeatureIds) {
    applyCircleHighlightState(map, next, true);
  }
  applyIconSizeHighlight(map, highlightedFeatureIds);
}

function sizeProperty(metric: "floor" | "power"): "size_floor_sqm" | "size_power_kw" {
  return metric === "power" ? "size_power_kw" : "size_floor_sqm";
}

function unknownSizeFilter(
  metric: "floor" | "power",
): maplibregl.FilterSpecification {
  return [
    "==",
    ["typeof", ["get", sizeProperty(metric)]],
    "null",
  ] as maplibregl.FilterSpecification;
}

function sizeExpression(metric: "floor" | "power"): maplibregl.ExpressionSpecification {
  const prop = sizeProperty(metric);
  const knownRamp: maplibregl.ExpressionSpecification =
    metric === "power"
      ? [
          "interpolate",
          ["linear"],
          ["sqrt", ["get", prop]],
          0,
          5,
          45,
          10,
          100,
          18,
          200,
          32,
          424,
          56,
        ]
      : [
          "interpolate",
          ["linear"],
          ["sqrt", ["get", prop]],
          0,
          5,
          50,
          10,
          158,
          20,
          316,
          36,
          707,
          58,
        ];

  return [
    "case",
    ["==", ["typeof", ["get", prop]], "number"],
    knownRamp,
    UNKNOWN_SIZE_RADIUS,
  ];
}

function operationalStatusExpression(): maplibregl.ExpressionSpecification {
  return ["coalesce", ["get", "operational_status"], NULL_FILTER_VALUE];
}

function colorExpression(): maplibregl.ExpressionSpecification {
  return [
    "match",
    operationalStatusExpression(),
    "planned",
    STATUS_COLORS.planned,
    "under_construction",
    STATUS_COLORS.under_construction,
    "operational",
    STATUS_COLORS.operational,
    "paused",
    STATUS_COLORS.paused,
    "cancelled",
    STATUS_COLORS.cancelled,
    STATUS_COLORS.unknown,
  ];
}

function rackIconExpression(
  outlined = false,
): maplibregl.ExpressionSpecification {
  const icon = (name: string): string =>
    outlined ? `${name}${RACK_ICON_OUTLINE_SUFFIX}` : name;
  return [
    "match",
    ["coalesce", ["get", "operational_status"], "unknown"],
    "operational",
    icon("rack"),
    "paused",
    icon("rack-paused"),
    "cancelled",
    icon("rack-cancelled"),
    "planned",
    icon("rack-planned"),
    "under_construction",
    [
      "match",
      ["coalesce", ["get", "construction_status"], ""],
      "planning",
      icon("rack-build-1"),
      "groundbreaking",
      icon("rack-build-2"),
      "foundation_laid",
      icon("rack-build-3"),
      "under_construction",
      icon("rack-build-4"),
      "topping_out",
      icon("rack-build-5"),
      "completed",
      icon("rack-build-6"),
      icon("rack-planned"),
    ],
    icon("rack-unknown"),
  ] as maplibregl.ExpressionSpecification;
}

function setLayerVisible(map: maplibregl.Map, id: string, visible: boolean): void {
  if (!map.getLayer(id)) return;
  map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
}

function applyDisplayMode(map: maplibregl.Map, metric: SizeMetric): void {
  const iconMode = metric === "icon";

  setLayerVisible(map, DC_CIRCLES_LAYER, !iconMode);
  setLayerVisible(map, DC_HIT_LAYER, !iconMode);
  setLayerVisible(map, DC_UNKNOWN_SIZE_LAYER, !iconMode);
  setLayerVisible(map, DC_PROTEST_LAYER, !iconMode);

  setLayerVisible(map, DC_CLUSTER_HALO_LAYER, iconMode);
  setLayerVisible(map, DC_CLUSTERS_LAYER, iconMode);
  setLayerVisible(map, DC_CLUSTER_COUNT_LAYER, iconMode);
  setLayerVisible(map, DC_ICONS_LAYER, iconMode);
  setLayerVisible(map, DC_ICON_HIT_LAYER, iconMode);
  setLayerVisible(map, DC_ICON_PROTEST_LAYER, iconMode);

  if (!iconMode && map.getLayer(DC_CIRCLES_LAYER)) {
    const expr = sizeExpression(metric);
    map.setPaintProperty(DC_CIRCLES_LAYER, "circle-radius", expr);
    map.setPaintProperty(DC_HIT_LAYER, "circle-radius", ["max", 14, expr]);
  }
  if (!iconMode && map.getLayer(DC_UNKNOWN_SIZE_LAYER)) {
    map.setFilter(DC_UNKNOWN_SIZE_LAYER, unknownSizeFilter(metric));
  }
}

export async function addDataCentersToMap(
  map: maplibregl.Map,
  data: DataCenterCollection,
  metric: SizeMetric = "icon",
): Promise<void> {
  fullCollection = data;
  currentMetric = metric;
  const collection = data;

  if (!map.getSource(DC_SOURCE_ID)) {
    map.addSource(DC_SOURCE_ID, {
      type: "geojson",
      data: collection,
      promoteId: "id",
    });

    const initialRadius: maplibregl.ExpressionSpecification | number =
      metric === "icon"
        ? 8
        : sizeExpression(metric === "power" ? "power" : "floor");

    map.addLayer({
      id: DC_CIRCLES_LAYER,
      type: "circle",
      source: DC_SOURCE_ID,
      paint: {
        "circle-radius": initialRadius,
        "circle-color": colorExpression(),
        "circle-opacity": 0.48,
        "circle-stroke-width": selectedCircleStrokeWidth(),
        "circle-stroke-color": selectedCircleStrokeColor(),
        "circle-stroke-opacity": 0.65,
      },
    });

    map.addLayer({
      id: DC_HIT_LAYER,
      type: "circle",
      source: DC_SOURCE_ID,
      paint: {
        "circle-radius": [
          "max",
          14,
          metric === "icon"
            ? 14
            : sizeExpression(metric === "power" ? "power" : "floor"),
        ],
        "circle-opacity": 0,
      },
    });

    map.addLayer({
      id: DC_UNKNOWN_SIZE_LAYER,
      type: "symbol",
      source: DC_SOURCE_ID,
      filter:
        metric === "icon"
          ? ["==", ["get", "id"], ""]
          : unknownSizeFilter(metric === "power" ? "power" : "floor"),
      layout: {
        "text-field": "?",
        "text-size": 11,
        "text-font": ["Noto Sans Regular"],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": BRAND_INK,
        "text-halo-color": BRAND_CREAM,
        "text-halo-width": 1,
      },
    });

    map.addLayer({
      id: DC_PROTEST_LAYER,
      type: "symbol",
      source: DC_SOURCE_ID,
      filter: ["==", ["get", "has_protest"], true],
      layout: {
        "icon-image": "megaphone",
        "icon-size": MEGAPHONE_SIZE_CIRCLES,
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-offset": [0, 0],
      },
    });
  } else {
    (map.getSource(DC_SOURCE_ID) as maplibregl.GeoJSONSource).setData(collection);
    reapplySelectedHighlight(map);
  }

  if (!map.getSource(DC_ICON_SOURCE_ID)) {
    map.addSource(DC_ICON_SOURCE_ID, {
      type: "geojson",
      data: collection,
      promoteId: "id",
      cluster: true,
      clusterMaxZoom: CLUSTER_MAX_ZOOM,
      clusterRadius: CLUSTER_RADIUS,
      clusterMinPoints: CLUSTER_MIN_POINTS,
    });

    map.addLayer({
      id: DC_CLUSTER_HALO_LAYER,
      type: "circle",
      source: DC_ICON_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": BRAND_YELLOW,
        "circle-opacity": 0.28,
        "circle-blur": 0.55,
        "circle-radius": CLUSTER_HALO_RADIUS,
      },
    });

    map.addLayer({
      id: DC_CLUSTERS_LAYER,
      type: "circle",
      source: DC_ICON_SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": BRAND_YELLOW,
        "circle-opacity": 0.96,
        "circle-stroke-width": 2,
        "circle-stroke-color": BRAND_INK,
        "circle-stroke-opacity": 0.92,
        "circle-radius": CLUSTER_DISC_RADIUS,
      },
    });

    map.addLayer({
      id: DC_CLUSTER_COUNT_LAYER,
      type: "symbol",
      source: DC_ICON_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": [
          "step",
          ["get", "point_count"],
          12,
          15,
          13,
          40,
          14,
        ],
        "text-font": ["Noto Sans Bold", "Noto Sans Regular"],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": BRAND_INK,
        "text-halo-color": BRAND_CREAM,
        "text-halo-width": 0.6,
      },
    });

    map.addLayer({
      id: DC_ICONS_LAYER,
      type: "symbol",
      source: DC_ICON_SOURCE_ID,
      filter: UNCLUSTERED,
      layout: {
        "icon-image": rackIconExpression(rackIconsOutlined),
        "icon-size": ICON_SIZE_DEFAULT,
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    });

    map.addLayer({
      id: DC_ICON_HIT_LAYER,
      type: "circle",
      source: DC_ICON_SOURCE_ID,
      filter: UNCLUSTERED,
      paint: {
        "circle-radius": 18,
        "circle-opacity": 0,
      },
    });

    map.addLayer({
      id: DC_ICON_PROTEST_LAYER,
      type: "symbol",
      source: DC_ICON_SOURCE_ID,
      filter: [
        "all",
        UNCLUSTERED,
        ["==", ["get", "has_protest"], true],
      ] as maplibregl.FilterSpecification,
      layout: {
        "icon-image": "megaphone",
        "icon-size": MEGAPHONE_SIZE_ICONS,
        "icon-anchor": "bottom-left",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-offset": MEGAPHONE_OFFSET_ICONS,
      },
    });
  } else {
    (map.getSource(DC_ICON_SOURCE_ID) as maplibregl.GeoJSONSource).setData(
      collection,
    );
    reapplySelectedHighlight(map);
  }

  await Promise.all([ensureMegaphoneIcon(map), ensureRackIcons(map)]);
  applyDisplayMode(map, metric);
  applyIconSizeHighlight(map, highlightedFeatureIds);
  for (const id of highlightedFeatureIds) {
    applyCircleHighlightState(map, id, true);
  }
}

export function setSizeMetric(map: maplibregl.Map, metric: SizeMetric): void {
  currentMetric = metric;
  applyDisplayMode(map, metric);
}

export type LegendFilter = {
  enabledStatus: Record<DcOperationalStatus, boolean>;
  enabledTypes?: Record<string, boolean>;
  enabledOwnerTypes?: Record<string, boolean>;
  enabledOwnerCountries?: Record<string, boolean>;
  protestOnly?: boolean;
  minPowerKw?: number | null;
  /** When set, only features matching this search query are shown. */
  searchQuery?: string | null;
};

function coalesceKey(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : NULL_FILTER_VALUE;
}

export function featureMatchesFilter(
  f: DataCenterFeature,
  filter: LegendFilter,
): boolean {
  const p = f.properties;
  const status = coalesceKey(p.operational_status) as DcOperationalStatus;
  if (!filter.enabledStatus[status]) return false;

  if (filter.enabledTypes) {
    const t = coalesceKey(p.data_center_type);
    if (filter.enabledTypes[t] === false) return false;
  }
  if (filter.enabledOwnerTypes) {
    const t = coalesceKey(p.owner_type);
    if (filter.enabledOwnerTypes[t] === false) return false;
  }
  if (filter.enabledOwnerCountries) {
    const c = coalesceKey(p.owner_country);
    if (filter.enabledOwnerCountries[c] === false) return false;
  }
  if (filter.protestOnly && !p.has_protest) return false;
  if (filter.minPowerKw != null && filter.minPowerKw > 0) {
    if ((p.size_power_kw ?? 0) < filter.minPowerKw) return false;
  }
  if (filter.searchQuery?.trim()) {
    if (!featureMatchesSearchQuery(f, filter.searchQuery)) return false;
  }
  return true;
}

export function setDataCentersFilter(
  map: maplibregl.Map,
  filter: LegendFilter,
): void {
  if (!fullCollection) return;
  const features = fullCollection.features.filter((f) =>
    featureMatchesFilter(f, filter),
  );
  const data: DataCenterCollection = { type: "FeatureCollection", features };

  const circles = map.getSource(DC_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  const icons = map.getSource(DC_ICON_SOURCE_ID) as
    | maplibregl.GeoJSONSource
    | undefined;
  circles?.setData(data);
  icons?.setData(data);
  reapplySelectedHighlight(map);
}

export function setLayerOpacity(map: maplibregl.Map, opacity: number): void {
  dcStoryLayerOpacity = opacity;
  const circleOpacity = Math.min(0.48, opacity * 0.55);
  if (map.getLayer(DC_CIRCLES_LAYER)) {
    map.setPaintProperty(DC_CIRCLES_LAYER, "circle-opacity", circleOpacity);
  }
  if (!gasOverlayDimActive) {
    applyClusterOpacity(map, opacity);
  }
  if (map.getLayer(DC_UNKNOWN_SIZE_LAYER)) {
    map.setPaintProperty(DC_UNKNOWN_SIZE_LAYER, "text-opacity", opacity);
  }
}

function applyClusterOpacity(map: maplibregl.Map, opacity: number): void {
  if (map.getLayer(DC_CLUSTER_HALO_LAYER)) {
    map.setPaintProperty(
      DC_CLUSTER_HALO_LAYER,
      "circle-opacity",
      opacity * 0.28,
    );
  }
  if (map.getLayer(DC_CLUSTERS_LAYER)) {
    map.setPaintProperty(DC_CLUSTERS_LAYER, "circle-opacity", opacity * 0.96);
    map.setPaintProperty(
      DC_CLUSTERS_LAYER,
      "circle-stroke-opacity",
      opacity * 0.92,
    );
  }
  if (map.getLayer(DC_CLUSTER_COUNT_LAYER)) {
    map.setPaintProperty(DC_CLUSTER_COUNT_LAYER, "text-opacity", opacity);
  }
}

export function applyRackIconOutline(map: maplibregl.Map, outlined: boolean): void {
  rackIconsOutlined = outlined;
  if (!map.getLayer(DC_ICONS_LAYER)) return;
  map.setLayoutProperty(
    DC_ICONS_LAYER,
    "icon-image",
    rackIconExpression(outlined),
  );
}

export function applyDatacenterDimForGasOverlay(
  map: maplibregl.Map,
  gasPlantsVisible: boolean,
): void {
  gasOverlayDimActive = gasPlantsVisible;
  const dim = gasPlantsVisible ? DC_OPACITY_WHEN_GAS_OVERLAY : 1;
  if (map.getLayer(DC_ICONS_LAYER)) {
    map.setPaintProperty(DC_ICONS_LAYER, "icon-opacity", dim);
  }
  if (map.getLayer(DC_ICON_PROTEST_LAYER)) {
    map.setPaintProperty(DC_ICON_PROTEST_LAYER, "icon-opacity", dim);
  }
  applyClusterOpacity(
    map,
    gasPlantsVisible ? DC_OPACITY_WHEN_GAS_OVERLAY : dcStoryLayerOpacity,
  );
}

export function expandClusterAtPoint(
  map: maplibregl.Map,
  point: maplibregl.PointLike,
): boolean {
  if (currentMetric !== "icon") return false;
  if (!map.getLayer(DC_CLUSTERS_LAYER)) return false;
  if (map.getLayoutProperty(DC_CLUSTERS_LAYER, "visibility") === "none") {
    return false;
  }

  const hits = map.queryRenderedFeatures(point, {
    layers: [DC_CLUSTERS_LAYER, DC_CLUSTER_HALO_LAYER].filter((id) =>
      Boolean(map.getLayer(id)),
    ),
  });
  const cluster = hits[0];
  if (!cluster?.properties || cluster.properties.cluster_id == null) return false;

  const source = map.getSource(DC_ICON_SOURCE_ID) as maplibregl.GeoJSONSource;
  const clusterId = cluster.properties.cluster_id as number;
  const coords = clusterCoordinates(
    cluster.geometry as { type?: string; coordinates?: unknown },
  );
  if (!coords) return false;

  void source
    .getClusterExpansionZoom(clusterId)
    .then((zoom) => {
      map.easeTo({ center: coords, zoom });
    })
    .catch(() => {});
  return true;
}

export function hitLayersForMode(metric: SizeMetric): string[] {
  return metric === "icon" ? [DC_ICON_HIT_LAYER] : [DC_HIT_LAYER];
}

function clusterCoordinates(
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
): [number, number] | null {
  if (!geometry || geometry.type !== "Point") return null;
  const c = geometry.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  return [Number(c[0]), Number(c[1])];
}
