import maplibregl, { AttributionControl } from "maplibre-gl";

import { formatDateDe } from "../i18n/labels";

const ATTRIBUTION_LINKS = {
  leitmotiv: "https://leitmotiv.digital/",
  fragDenStaat: "https://fragdenstaat.de",
  bkg: "https://gdz.bkg.bund.de/",
  openFreeMap: "https://openfreemap.org",
  openMapTiles: "https://www.openmaptiles.org/",
  openStreetMap: "https://www.openstreetmap.org/copyright",
} as const;

const BASEMAP_ATTRIBUTION = [
  `<a href="${ATTRIBUTION_LINKS.openFreeMap}" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>`,
  `<a href="${ATTRIBUTION_LINKS.openMapTiles}" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a>`,
  `Data from <a href="${ATTRIBUTION_LINKS.openStreetMap}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>`,
].join(" ");

function linkHtml(href: string, label: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

// MapLibre sorts attributions by string length; inner HTML keeps a fixed order.
function buildCustomAttribution(fetchedAt?: string): string {
  const parts: string[] = [];

  if (fetchedAt?.trim()) {
    parts.push(`Stand: ${formatDateDe(fetchedAt.trim().slice(0, 10))}`);
  }

  parts.push(
    `Datenquelle: Tiziana von Witzleben, ${linkHtml(ATTRIBUTION_LINKS.leitmotiv, "Leitmotiv")}`,
    `Kartengestaltung: ${linkHtml(ATTRIBUTION_LINKS.fragDenStaat, "FragDenStaat")}`,
    `Geodaten: ${linkHtml(ATTRIBUTION_LINKS.bkg, "Geodatenzentrum")} © GeoBasis-DE / BKG 2018 (VG250 31.12., Daten verändert)`,
    BASEMAP_ATTRIBUTION,
  );

  return parts.join(" | ");
}

function paintAttribution(map: maplibregl.Map, html: string): void {
  const inner = map
    .getContainer()
    .querySelector<HTMLElement>(".maplibregl-ctrl-attrib-inner");
  if (!inner) return;
  if (inner.innerHTML === html) return;
  inner.innerHTML = html;
  const details = inner.closest(".maplibregl-ctrl-attrib");
  details?.classList.remove("maplibregl-attrib-empty");
}

// Compact control stays `open` so MapLibre hides the native disclosure marker.
function collapseAttributionOnce(map: maplibregl.Map): void {
  const details = map
    .getContainer()
    .querySelector<HTMLDetailsElement>("details.maplibregl-ctrl-attrib");
  if (!details) return;
  details.classList.add("maplibregl-compact");
  details.classList.remove("maplibregl-compact-show");
  details.open = true;
}

function bindAttributionOrder(
  map: maplibregl.Map,
  fetchedAt?: string,
): void {
  const html = buildCustomAttribution(fetchedAt);
  const sync = () => {
    queueMicrotask(() => paintAttribution(map, html));
  };
  map.on("sourcedata", sync);
  map.on("styledata", sync);
  sync();
  queueMicrotask(() => collapseAttributionOnce(map));
}

export function createAttributionControl(
  fetchedAt?: string,
): maplibregl.AttributionControl {
  return new AttributionControl({
    compact: true,
    customAttribution: buildCustomAttribution(fetchedAt),
  });
}

export function replaceAttributionControl(
  map: maplibregl.Map,
  previous: maplibregl.AttributionControl,
  fetchedAt?: string,
): maplibregl.AttributionControl {
  map.removeControl(previous);
  const next = createAttributionControl(fetchedAt);
  map.addControl(next);
  bindAttributionOrder(map, fetchedAt);
  return next;
}
