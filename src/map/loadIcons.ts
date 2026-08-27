import type maplibregl from "maplibre-gl";

import { GAS_PLANT_ICON_BY_STATUS } from "./constants";

const ICON_BITMAP_SIZE = 128;
const ICON_BITMAP_REF = 64;

export const ICON_SIZE_DEFAULT = 0.72 * (ICON_BITMAP_REF / ICON_BITMAP_SIZE);
export const ICON_SIZE_SELECTED = 1.05 * (ICON_BITMAP_REF / ICON_BITMAP_SIZE);
export const MEGAPHONE_SIZE_CIRCLES = 0.4 * (ICON_BITMAP_REF / ICON_BITMAP_SIZE);
export const MEGAPHONE_SIZE_ICONS = 0.42 * (ICON_BITMAP_REF / ICON_BITMAP_SIZE);

export const SELECTION_SIZE_RATIO = ICON_SIZE_SELECTED / ICON_SIZE_DEFAULT;
export const MEGAPHONE_SIZE_ICONS_SELECTED =
  MEGAPHONE_SIZE_ICONS * SELECTION_SIZE_RATIO;

export const MEGAPHONE_OFFSET_ICONS: [number, number] = [8, -24];
export const MEGAPHONE_OFFSET_ICONS_SELECTED: [number, number] = [
  MEGAPHONE_OFFSET_ICONS[0] * SELECTION_SIZE_RATIO,
  MEGAPHONE_OFFSET_ICONS[1] * SELECTION_SIZE_RATIO,
];

export const RACK_ICON_OUTLINE_SUFFIX = "-gw";

const RACK_ICON_FILES: Record<string, string> = {
  rack: "rack.svg",
  "rack-paused": "rack-paused.svg",
  "rack-unknown": "rack-unknown.svg",
  "rack-planned": "rack-planned.svg",
  "rack-build-1": "rack-build-1.svg",
  "rack-build-2": "rack-build-2.svg",
  "rack-build-3": "rack-build-3.svg",
  "rack-build-4": "rack-build-4.svg",
  "rack-build-5": "rack-build-5.svg",
  "rack-build-6": "rack-build-6.svg",
};

// icon-size is layout-only; feature-state cannot scale symbols.
export function iconSizeForSelection(
  selectedIds: string[],
  sizeDefault: number,
  sizeSelected: number,
): maplibregl.ExpressionSpecification | number {
  if (selectedIds.length === 0) return sizeDefault;
  if (selectedIds.length === 1) {
    return [
      "case",
      ["==", ["get", "id"], selectedIds[0]],
      sizeSelected,
      sizeDefault,
    ];
  }
  return [
    "case",
    ["in", ["get", "id"], ["literal", selectedIds]],
    sizeSelected,
    sizeDefault,
  ];
}

export function megaphoneOffsetForSelection(
  selectedIds: string[],
): maplibregl.ExpressionSpecification | [number, number] {
  if (selectedIds.length === 0) return MEGAPHONE_OFFSET_ICONS;
  if (selectedIds.length === 1) {
    return [
      "case",
      ["==", ["get", "id"], selectedIds[0]],
      ["literal", MEGAPHONE_OFFSET_ICONS_SELECTED],
      ["literal", MEGAPHONE_OFFSET_ICONS],
    ];
  }
  return [
    "case",
    ["in", ["get", "id"], ["literal", selectedIds]],
    ["literal", MEGAPHONE_OFFSET_ICONS_SELECTED],
    ["literal", MEGAPHONE_OFFSET_ICONS],
  ];
}

function loadSvgAsImage(
  url: string,
  width: number,
  height: number,
): Promise<ImageData | HTMLImageElement | ImageBitmap> {
  return new Promise((resolve, reject) => {
    const img = new Image(width, height);
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export async function ensureMegaphoneIcon(map: maplibregl.Map): Promise<void> {
  if (map.hasImage("megaphone")) return;
  const url = `${import.meta.env.BASE_URL}icons/megaphone.svg`;
  try {
    const img = await loadSvgAsImage(url, ICON_BITMAP_SIZE, ICON_BITMAP_SIZE);
    map.addImage("megaphone", img, { sdf: false });
  } catch (err) {
    console.warn("Could not load megaphone icon", err);
  }
}

async function loadRackImage(
  map: maplibregl.Map,
  imageId: string,
  url: string,
): Promise<void> {
  if (map.hasImage(imageId)) return;
  try {
    const img = await loadSvgAsImage(url, ICON_BITMAP_SIZE, ICON_BITMAP_SIZE);
    map.addImage(imageId, img, { sdf: false });
  } catch (err) {
    console.warn(`Could not load rack icon ${url}`, err);
  }
}

export async function ensureRackIcons(map: maplibregl.Map): Promise<void> {
  const base = import.meta.env.BASE_URL;
  await Promise.all(
    Object.entries(RACK_ICON_FILES).map(async ([name, file]) => {
      const outlinedName = `${name}${RACK_ICON_OUTLINE_SUFFIX}`;
      const outlinedFile = file.replace(/\.svg$/, `${RACK_ICON_OUTLINE_SUFFIX}.svg`);
      await Promise.all([
        loadRackImage(map, name, `${base}icons/${file}`),
        loadRackImage(map, outlinedName, `${base}icons/${outlinedFile}`),
      ]);
    }),
  );
}

export async function ensureGasPlantIcons(map: maplibregl.Map): Promise<void> {
  const base = import.meta.env.BASE_URL;
  const stems = [...new Set(Object.values(GAS_PLANT_ICON_BY_STATUS))];
  await Promise.all(
    stems.map(async (stem) => {
      if (map.hasImage(stem)) return;
      try {
        const img = await loadSvgAsImage(
          `${base}icons/${stem}.svg`,
          ICON_BITMAP_SIZE,
          ICON_BITMAP_SIZE,
        );
        map.addImage(stem, img, { sdf: false });
      } catch (err) {
        console.warn(`Could not load gas plant icon ${stem}`, err);
      }
    }),
  );
}
