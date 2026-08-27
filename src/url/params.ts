import type { StorySceneId } from "../scenes/ids";

export type StartMode = "cover" | "story" | "explore";

export type SizeMetric = "floor" | "power" | "icon";

export type UrlState = {
  start: StartMode;
  scene: StorySceneId | null;
  status: string[];
  protest: boolean | null;
  size: SizeMetric;
  q: string;
  feature: string | null;
};

const STORY_SCENES = new Set<string>([
  "intro",
  "status",
  "energy",
  "energyGas",
  "water",
  "waterStress",
  "waterBaruth",
  "bigtech",
  "bigtechSearch",
  "protests",
  "protestsLayer",
  "outro",
  "outroFaq",
]);

function splitCsv(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseStart(raw: string | null): StartMode {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "explore") return "explore";
  if (v === "story" || v === "intro") return "story";
  if (v === "cover") return "cover";
  return "cover";
}

function parseScene(raw: string | null): StorySceneId | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (STORY_SCENES.has(v)) return v as StorySceneId;
  return null;
}

function parseProtest(raw: string | null): boolean | null {
  if (raw == null || raw === "") return null;
  if (raw === "1" || raw.toLowerCase() === "true") return true;
  if (raw === "0" || raw.toLowerCase() === "false") return false;
  return null;
}

function parseSize(raw: string | null): SizeMetric {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "power") return "power";
  if (v === "icon" || v === "symbols" || v === "marker") return "icon";
  return "floor";
}

export function parseUrlState(href: string = window.location.href): UrlState {
  const sp = new URL(href).searchParams;
  return {
    start: parseStart(sp.get("start")),
    scene: parseScene(sp.get("scene")),
    status: splitCsv(sp.get("status")),
    protest: parseProtest(sp.get("protest")),
    size: parseSize(sp.get("size")),
    q: (sp.get("q") ?? "").trim(),
    feature: (sp.get("feature") ?? "").trim() || null,
  };
}

export function serializeUrlState(state: Partial<UrlState>): string {
  const sp = new URLSearchParams();
  if (state.start && state.start !== "cover") sp.set("start", state.start);
  if (state.scene) sp.set("scene", state.scene);
  if (state.status?.length) sp.set("status", state.status.join(","));
  if (state.protest === true) sp.set("protest", "1");
  if (state.protest === false) sp.set("protest", "0");
  if (state.size && state.size !== "floor") sp.set("size", state.size);
  if (state.q) sp.set("q", state.q);
  if (state.feature) sp.set("feature", state.feature);
  return sp.toString();
}

export function writeUrlState(state: Partial<UrlState>): void {
  const current = parseUrlState();
  const merged: UrlState = { ...current, ...state };
  const qs = serializeUrlState(merged);
  const url = new URL(window.location.href);
  url.search = qs ? `?${qs}` : "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}
