import type maplibregl from "maplibre-gl";

import { BRAND_PINK } from "./constants";

const GERMANY_BORDER_SOURCE_ID = "germany-border";
const GERMANY_BORDER_LAYER_ID = "germany-border-line";

function firstSymbolLayerId(map: maplibregl.Map): string | undefined {
  const style = map.getStyle();
  const layers = style.layers ?? [];
  return layers.find((l) => l.type === "symbol")?.id;
}

export function addGermanyBorder(map: maplibregl.Map): void {
  if (map.getLayer(GERMANY_BORDER_LAYER_ID)) return;

  if (!map.getSource(GERMANY_BORDER_SOURCE_ID)) {
    map.addSource(GERMANY_BORDER_SOURCE_ID, {
      type: "geojson",
      data: `${import.meta.env.BASE_URL}data/border.geojson`,
    });
  }

  map.addLayer(
    {
      id: GERMANY_BORDER_LAYER_ID,
      type: "line",
      source: GERMANY_BORDER_SOURCE_ID,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": BRAND_PINK,
        "line-opacity": 0.95,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 6, 4.5, 10, 8],
      },
    },
    firstSymbolLayerId(map),
  );
}
