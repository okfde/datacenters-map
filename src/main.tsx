import { render } from "solid-js/web";

import { App } from "./components/App";
import { replaceAttributionControl } from "./map/attribution";
import { setupMap } from "./map/setupMap";
import { parseUrlState } from "./url";
import type { DataCenterCollection } from "./types/data";

import "./styles/main.css";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function hideLoader(appHost: HTMLElement): Promise<void> {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.classList.add("loader--leaving");
  await nextFrame();
  window.setTimeout(() => {
    loader.style.display = "none";
    appHost.classList.remove("app-shell--booting");
  }, 260);
}

function showLoadError(messageDe: string): void {
  const loader = document.getElementById("loader");
  if (!loader) return;
  loader.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "load-error";

  const p = document.createElement("p");
  p.className = "load-error__text";
  p.textContent = messageDe;
  wrap.appendChild(p);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "button button-primary";
  btn.textContent = "Erneut versuchen";
  btn.addEventListener("click", () => window.location.reload());
  wrap.appendChild(btn);

  loader.appendChild(wrap);
}

function setLoaderLogoSrc(): void {
  const logo = document.querySelector<HTMLImageElement>("#loader .loader__logo");
  if (logo) logo.src = `${import.meta.env.BASE_URL}img/logo.svg`;
}

async function bootstrap(): Promise<void> {
  setLoaderLogoSrc();

  const appHost = document.getElementById("app") as HTMLDivElement | null;
  const mapEl = document.getElementById("map") as HTMLDivElement | null;
  const solidRoot = document.getElementById("root") as HTMLDivElement | null;
  if (!appHost || !mapEl || !solidRoot) {
    console.error("Missing #app, #map, or #root");
    showLoadError("Die Karte konnte nicht geladen werden.");
    return;
  }

  const urlState = parseUrlState();
  const startMode = urlState.start;

  let resolveMapReady!: () => void;
  const mapReady = new Promise<void>((resolve) => {
    resolveMapReady = resolve;
  });

  const dataPromise = (async () => {
    const url = `${import.meta.env.BASE_URL}data/datacenters.geojson`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed to load datacenters.geojson: ${r.status}`);
    return (await r.json()) as DataCenterCollection;
  })();

  const [{ map, navControl, attributionControl, hash }, data] = await Promise.all([
    setupMap(mapEl),
    dataPromise,
  ]);

  replaceAttributionControl(map, attributionControl, data.fetched_at);

  mapEl.style.display = "block";
  mapEl.removeAttribute("aria-hidden");

  render(
    () => (
      <App
        map={map}
        navControl={navControl}
        hash={hash}
        data={data}
        container={appHost}
        startMode={startMode}
        onMapAssetsReady={resolveMapReady}
      />
    ),
    solidRoot,
  );

  await mapReady;
  await hideLoader(appHost);
}

bootstrap().catch((err) => {
  console.error(err);
  showLoadError(
    "Die Karte konnte nicht geladen werden. Bitte später erneut versuchen.",
  );
});
