import type { LngLatBoundsLike, Map } from "maplibre-gl";
import type maplibregl from "maplibre-gl";

import { GERMANY_BOUNDS } from "./constants";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function animationDurationMs(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs;
}

export type CameraSpec =
  | {
      mode: "fitBounds";
      bounds: LngLatBoundsLike;
      padding?: number | maplibregl.PaddingOptions;
    }
  | {
      mode: "flyTo";
      center: [number, number];
      zoom: number;
      bearing?: number;
    };

export function applyCamera(
  map: Map,
  camera: CameraSpec | undefined,
  options?: { instant?: boolean },
): void {
  if (!camera) return;
  const durationMsOverride = options?.instant ? 0 : undefined;
  if (camera.mode === "fitBounds") {
    const pad =
      typeof camera.padding === "number"
        ? {
            top: camera.padding,
            bottom: camera.padding,
            left: camera.padding,
            right: camera.padding,
          }
        : (camera.padding ?? { top: 48, bottom: 48, left: 48, right: 48 });
    map.fitBounds(camera.bounds, {
      ...pad,
      duration: durationMsOverride ?? animationDurationMs(1800),
    });
  } else {
    map.flyTo({
      center: camera.center,
      zoom: camera.zoom,
      bearing: camera.bearing ?? 0,
      pitch: 0,
      duration: durationMsOverride ?? animationDurationMs(1600),
    });
  }
}

export const GERMANY_CAMERA: CameraSpec = {
  mode: "fitBounds",
  bounds: GERMANY_BOUNDS,
  padding: 48,
};
