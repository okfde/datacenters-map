import maplibregl, { Hash, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { createAttributionControl } from "./attribution";
import { DEFAULT_STYLE_URL, GERMANY_BOUNDS } from "./constants";
import { addGermanyBorder } from "./germanyBorder";
import { applyGermanBasemapLabels } from "./applyGermanBasemapLabels";

export type MapResources = {
  map: maplibregl.Map;
  navControl: maplibregl.NavigationControl;
  attributionControl: maplibregl.AttributionControl;
  hash: maplibregl.Hash;
};

export function setupMap(container: HTMLElement): Promise<MapResources> {
  const map = new maplibregl.Map({
    container,
    style: DEFAULT_STYLE_URL,
    bounds: GERMANY_BOUNDS,
    fitBoundsOptions: { padding: 48 },
    pitch: 0,
    bearing: 0,
    maxPitch: 0,
    minZoom: 5,
    maxZoom: 18,
    renderWorldCopies: false,
    attributionControl: false,
  });

  const attributionControl = createAttributionControl();
  map.addControl(attributionControl);

  const navControl = new NavigationControl({
    visualizePitch: false,
    showZoom: true,
    showCompass: false,
  });

  const hash = new Hash();

  map.scrollZoom.disable();
  map.boxZoom.disable();
  map.dragRotate.disable();
  map.dragPan.disable();
  map.keyboard.disable();
  map.doubleClickZoom.disable();
  map.touchZoomRotate.disable();

  return new Promise((resolve, reject) => {
    map.once("error", (e) => reject(e.error ?? e));
    map.once("load", () => {
      applyGermanBasemapLabels(map);
      addGermanyBorder(map);
      resolve({ map, navControl, attributionControl, hash });
    });
  });
}

export function waitForMapIdle(map: maplibregl.Map): Promise<void> {
  return new Promise((resolve) => {
    // once("idle") does not fire if the map is already idle.
    if (map.loaded() && map.areTilesLoaded()) {
      resolve();
      return;
    }
    map.once("idle", () => resolve());
  });
}
