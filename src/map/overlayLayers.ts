import type maplibregl from "maplibre-gl";

import type { GasPlantCollection } from "../types/data";
import {
  GAS_PLANT_ICON_BY_STATUS,
  GROUNDWATER_STRESS_COLORS,
} from "./constants";
import {
  applyDatacenterDimForGasOverlay,
  applyRackIconOutline,
} from "./dataCenterLayers";
import {
  DC_CIRCLES_LAYER,
  GAS_PLANTS_HIT_LAYER,
  GAS_PLANTS_LAYER,
  GAS_PLANTS_SOURCE,
  GROUNDWATER_LAYER,
  GROUNDWATER_SOURCE,
} from "./layerIds";
import {
  ICON_SIZE_DEFAULT,
  SELECTION_SIZE_RATIO,
  ensureGasPlantIcons,
  iconSizeForSelection,
} from "./loadIcons";

const GAS_ICON_SIZE_DEFAULT = ICON_SIZE_DEFAULT * 0.95;
const GAS_ICON_SIZE_SELECTED = GAS_ICON_SIZE_DEFAULT * SELECTION_SIZE_RATIO;

const GAS_PLANT_ICON_IMAGE: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "status"],
  "exploration",
  GAS_PLANT_ICON_BY_STATUS.exploration,
  "preparation",
  GAS_PLANT_ICON_BY_STATUS.preparation,
  "operational",
  GAS_PLANT_ICON_BY_STATUS.operational,
  GAS_PLANT_ICON_BY_STATUS.exploration,
];

let highlightedGasPlantIds: string[] = [];

function applyGasPlantIconSizeHighlight(
  map: maplibregl.Map,
  ids: string[],
): void {
  if (!map.getLayer(GAS_PLANTS_LAYER)) return;
  map.setLayoutProperty(
    GAS_PLANTS_LAYER,
    "icon-size",
    iconSizeForSelection(ids, GAS_ICON_SIZE_DEFAULT, GAS_ICON_SIZE_SELECTED),
  );
}

export function setSelectedGasPlantHighlight(
  map: maplibregl.Map,
  id: string | string[] | null,
): void {
  highlightedGasPlantIds =
    id == null ? [] : Array.isArray(id) ? [...id] : [id];
  applyGasPlantIconSizeHighlight(map, highlightedGasPlantIds);
}

export type OverlayVisibility = {
  gasPlants: boolean;
  groundwater: boolean;
};

type OverlayLoadResult = {
  gasPlants: GasPlantCollection | null;
};

export async function addOverlayLayers(
  map: maplibregl.Map,
): Promise<OverlayLoadResult> {
  const base = import.meta.env.BASE_URL;
  let gasPlants: GasPlantCollection | null = null;

  if (!map.getSource(GAS_PLANTS_SOURCE)) {
    try {
      const r = await fetch(`${base}data/gas_plants.geojson`);
      if (r.ok) {
        const data = (await r.json()) as GasPlantCollection;
        gasPlants = data;
        await ensureGasPlantIcons(map);
        map.addSource(GAS_PLANTS_SOURCE, {
          type: "geojson",
          data,
          promoteId: "id",
        });
        map.addLayer({
          id: GAS_PLANTS_HIT_LAYER,
          type: "circle",
          source: GAS_PLANTS_SOURCE,
          layout: { visibility: "none" },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4,
              12,
              12,
              24,
            ],
            "circle-color": "#000000",
            "circle-opacity": 0,
          },
        });
        map.addLayer({
          id: GAS_PLANTS_LAYER,
          type: "symbol",
          source: GAS_PLANTS_SOURCE,
          layout: {
            visibility: "none",
            "icon-image": GAS_PLANT_ICON_IMAGE,
            "icon-size": GAS_ICON_SIZE_DEFAULT,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
          paint: {
            "icon-opacity": 1,
          },
        });
        if (highlightedGasPlantIds.length > 0) {
          applyGasPlantIconSizeHighlight(map, highlightedGasPlantIds);
        }
      }
    } catch (err) {
      console.warn("Could not load gas_plants.geojson", err);
    }
  }

  if (!map.getSource(GROUNDWATER_SOURCE)) {
    try {
      const r = await fetch(`${base}data/groundwater_stress.geojson`);
      if (r.ok) {
        const data = await r.json();
        map.addSource(GROUNDWATER_SOURCE, { type: "geojson", data });
        const beforeId = map.getLayer(DC_CIRCLES_LAYER)
          ? DC_CIRCLES_LAYER
          : undefined;
        map.addLayer(
          {
            id: GROUNDWATER_LAYER,
            type: "fill",
            source: GROUNDWATER_SOURCE,
            layout: { visibility: "none" },
            paint: {
              "fill-color": [
                "match",
                ["get", "category"],
                "kein",
                GROUNDWATER_STRESS_COLORS.kein,
                "strukturell",
                GROUNDWATER_STRESS_COLORS.strukturell,
                "akut",
                GROUNDWATER_STRESS_COLORS.akut,
                "beides",
                GROUNDWATER_STRESS_COLORS.beides,
                GROUNDWATER_STRESS_COLORS.kein,
              ],
              "fill-opacity": 0.55,
              "fill-outline-color": "#ffffff",
            },
          },
          beforeId,
        );
      }
    } catch (err) {
      console.warn("Could not load groundwater_stress.geojson", err);
    }
  }

  return { gasPlants };
}

export function setOverlayVisibility(
  map: maplibregl.Map,
  visibility: OverlayVisibility,
): void {
  const gasVis = visibility.gasPlants ? "visible" : "none";
  if (map.getLayer(GAS_PLANTS_LAYER)) {
    map.setLayoutProperty(GAS_PLANTS_LAYER, "visibility", gasVis);
  }
  if (map.getLayer(GAS_PLANTS_HIT_LAYER)) {
    map.setLayoutProperty(GAS_PLANTS_HIT_LAYER, "visibility", gasVis);
  }
  if (map.getLayer(GROUNDWATER_LAYER)) {
    map.setLayoutProperty(
      GROUNDWATER_LAYER,
      "visibility",
      visibility.groundwater ? "visible" : "none",
    );
  }
  applyRackIconOutline(map, visibility.groundwater);
  applyDatacenterDimForGasOverlay(map, visibility.gasPlants);
}
