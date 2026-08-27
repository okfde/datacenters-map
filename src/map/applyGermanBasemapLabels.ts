import type maplibregl from "maplibre-gl";

const GERMAN_TEXT_FIELD: maplibregl.ExpressionSpecification = [
  "coalesce",
  ["get", "name:de"],
  ["get", "name:latin"],
  ["get", "name"],
];

function textFieldUsesNameProperty(
  textField: unknown,
): boolean {
  if (textField == null) return false;
  if (typeof textField === "string") {
    return textField.includes("name");
  }
  return JSON.stringify(textField).includes('"name');
}

export function applyGermanBasemapLabels(map: maplibregl.Map): void {
  const layers = map.getStyle()?.layers;
  if (!layers) return;

  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    const textField = layer.layout?.["text-field"];
    if (!textFieldUsesNameProperty(textField)) continue;
    try {
      map.setLayoutProperty(layer.id, "text-field", GERMAN_TEXT_FIELD);
    } catch (err) {
      console.warn(`Could not set German labels on layer ${layer.id}`, err);
    }
  }
}
