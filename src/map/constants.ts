export const GERMANY_BOUNDS: [number, number, number, number] = [
  5.8663, 47.2701, 15.0419, 55.0581,
];

export const DEFAULT_STYLE_URL =
  "https://tiles.openfreemap.org/styles/positron";

export const BRAND_YELLOW = "#f7da06";
export const BRAND_PINK = "#fd2c8d";
export const BRAND_INK = "#1a1a1a";
export const BRAND_CREAM = "#faf8f0";

export const NULL_FILTER_VALUE = "unknown";

export const STATUS_COLORS: Record<string, string> = {
  planned: "#fefad6",
  under_construction: "#f7da06",
  operational: "#fd2c8d",
  paused: "#c9b005",
  cancelled: "#8a7a2a",
  unknown: "#9a9a9a",
};

export const STATUS_LEGEND_ICONS: Record<string, string> = {
  planned: "rack-planned.svg",
  under_construction: "rack-build-4.svg",
  operational: "rack.svg",
  paused: "rack-paused.svg",
  cancelled: "rack-cancelled.svg",
  unknown: "rack-unknown.svg",
};

export const GAS_PLANTS_SOURCE = "gas-plants";
export const GAS_PLANTS_LAYER = "gas-plants-icons";
export const GAS_PLANTS_HIT_LAYER = "gas-plants-hit";
export const GROUNDWATER_SOURCE = "groundwater-stress";
export const GROUNDWATER_LAYER = "groundwater-fill";

export const GROUNDWATER_STRESS_COLORS: Record<string, string> = {
  kein: "#95a5a6",
  strukturell: "#f1c40f",
  akut: "#e67e22",
  beides: "#c0392b",
};

export const GROUNDWATER_STRESS_LEGEND = [
  {
    category: "kein",
    label: "Kein Grundwasserstress",
    description: "Gebiete ohne messbaren Grundwasserstress.",
  },
  {
    category: "strukturell",
    label: "Struktureller Grundwasserstress",
    description:
      "Die Grundwasserentnahmen überschreiten hier 20% der langjährigen Grundwasserneubildung. Dieser Wert wird laut BUND empfohlen, damit langfristig keine Schäden am Ökosystem auftreten.",
  },
  {
    category: "akut",
    label: "Akuter Grundwasserstress",
    description:
      "Im Zeitraum 2012–2021 sind die Grundwasserstände hier signifikant gesunken.",
  },
  {
    category: "beides",
    label: "Akuter UND struktureller Grundwasserstress",
    description:
      "Gebiete mit sowohl akutem als auch strukturellem Grundwasserstress.",
  },
] as const;

export const GAS_PLANT_ICON_BY_STATUS: Record<string, string> = {
  exploration: "erkundung-kraftwerk",
  preparation: "vorbereitung-kraftwerk",
  operational: "betrieb-kraftwerk",
};
