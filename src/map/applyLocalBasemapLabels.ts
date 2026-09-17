import type maplibregl from "maplibre-gl";

const LOCAL_TEXT_FIELD: maplibregl.ExpressionSpecification = [
  "coalesce",
  ["get", "name"],
  ["get", "name:latin"],
];

function textFieldUsesNameProperty(textField: unknown): boolean {
  if (textField == null) return false;
  if (typeof textField === "string") {
    return textField.includes("name");
  }
  return JSON.stringify(textField).includes('"name');
}

/** Override English-first labels with local OSM names. */
export function applyLocalBasemapLabels(map: maplibregl.Map): void {
  const layers = map.getStyle()?.layers;
  if (!layers) return;

  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    const textField = layer.layout?.["text-field"];
    if (!textFieldUsesNameProperty(textField)) continue;
    try {
      map.setLayoutProperty(layer.id, "text-field", LOCAL_TEXT_FIELD);
    } catch (err) {
      console.warn(`Could not set local labels on layer ${layer.id}`, err);
    }
  }
}
