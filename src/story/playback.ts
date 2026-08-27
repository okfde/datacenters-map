import type maplibregl from "maplibre-gl";

import { setLayerOpacity, type LegendFilter } from "../map/layers";
import { applyCamera, prefersReducedMotion } from "../map/mapActions";
import type { StorySceneId } from "../scenes/ids";
import {
  STORY_ORDER,
  type SceneDefinition,
  type SceneId,
} from "../scenes/registry";
import {
  ALL_STATUS,
  collectPresentStatuses,
  type DataCenterCollection,
  type DcOperationalStatus,
  type MapSelectableFeature,
} from "../types/data";
import type { SizeMetric } from "../url/params";
import { writeUrlState } from "../url";

const STATUS_CYCLE_MS = 2000;

export type StoryPlaybackDeps = {
  map: maplibregl.Map;
  data: DataCenterCollection;
  sceneRegistry: Record<SceneId, SceneDefinition>;
  isMapInteractive: () => boolean;
  activeSceneId: () => SceneId;
  setMapInteractive: (value: boolean) => void;
  setActiveSceneId: (id: SceneId) => void;
  setStoryLegendOverride: (value: Partial<LegendFilter> | null) => void;
  setSizeMetric: (metric: SizeMetric) => void;
  setSearchQ: (q: string) => void;
  setHighlightSearch: (value: boolean) => void;
  setShowStoryLegend: (value: boolean) => void;
  setGasPlantsVisible: (value: boolean) => void;
  setGroundwaterVisible: (value: boolean) => void;
  setProtestOnly: (value: boolean) => void;
  setHighlightIds: (ids: string[]) => void;
  setSelected: (feature: MapSelectableFeature | null) => void;
};

export function createStoryPlayback(deps: StoryPlaybackDeps) {
  let statusCycleTimer: ReturnType<typeof setInterval> | null = null;
  const presentStatuses = collectPresentStatuses(deps.data);

  function clearStatusCycle(): void {
    if (statusCycleTimer != null) {
      clearInterval(statusCycleTimer);
      statusCycleTimer = null;
    }
  }

  function startStatusCycle(baseOverride: Partial<LegendFilter> | null): void {
    clearStatusCycle();
    const cycleStatuses =
      presentStatuses.length > 0 ? presentStatuses : ALL_STATUS;
    if (prefersReducedMotion()) {
      deps.setStoryLegendOverride({
        ...baseOverride,
        enabledStatus: Object.fromEntries(
          ALL_STATUS.map((s) => [s, cycleStatuses.includes(s)]),
        ) as Record<DcOperationalStatus, boolean>,
      });
      return;
    }

    let index = 0;
    const tick = (): void => {
      const status = cycleStatuses[index % cycleStatuses.length];
      const enabledStatus = Object.fromEntries(
        ALL_STATUS.map((s) => [s, s === status]),
      ) as Record<DcOperationalStatus, boolean>;
      deps.setStoryLegendOverride({
        ...baseOverride,
        enabledStatus,
      });
      index += 1;
    };
    tick();
    statusCycleTimer = setInterval(tick, STATUS_CYCLE_MS);
  }

  function applyScene(def: SceneDefinition, sceneId: string): void {
    if (deps.isMapInteractive()) return;
    clearStatusCycle();
    deps.setActiveSceneId(sceneId as SceneId);
    if (def.camera) applyCamera(deps.map, def.camera);
    if (def.layerOpacity != null) setLayerOpacity(deps.map, def.layerOpacity);
    deps.setStoryLegendOverride(def.legendOverride ?? null);
    if (def.overlays) {
      if (def.overlays.gasPlants != null) {
        deps.setGasPlantsVisible(def.overlays.gasPlants);
      }
      if (def.overlays.groundwater != null) {
        deps.setGroundwaterVisible(def.overlays.groundwater);
      }
    }
    if (def.sizeMetric) deps.setSizeMetric(def.sizeMetric);
    deps.setSearchQ(def.searchQ ?? "");
    deps.setHighlightSearch(Boolean(def.highlightSearch));
    deps.setShowStoryLegend(Boolean(def.showLegend ?? def.highlightSearch));

    const ids =
      def.selectFeatureIds ??
      (def.selectFeatureId ? [def.selectFeatureId] : []);
    deps.setHighlightIds(ids);
    if (ids.length > 0) {
      const primary =
        deps.data.features.find((x) => x.properties.id === ids[0]) ?? null;
      deps.setSelected(primary);
    } else if (sceneId !== "explore") {
      deps.setSelected(null);
    }

    if (def.statusCycle) {
      startStatusCycle(def.legendOverride ?? null);
    }

    if (sceneId === "explore") {
      openExplore();
      return;
    }
    writeUrlState({
      start: "story",
      scene: sceneId as StorySceneId,
    });
  }

  function openExplore(): void {
    clearStatusCycle();
    deps.setMapInteractive(true);
    deps.setActiveSceneId("explore");
    deps.setStoryLegendOverride(null);
    deps.setSearchQ("");
    deps.setHighlightSearch(false);
    deps.setShowStoryLegend(false);
    deps.setHighlightIds([]);
    setLayerOpacity(deps.map, 0.85);
    deps.setGasPlantsVisible(false);
    deps.setGroundwaterVisible(false);
    deps.setProtestOnly(false);
    writeUrlState({ start: "explore", scene: null });
  }

  function backToStory(): void {
    clearStatusCycle();
    deps.setMapInteractive(false);
    deps.setSelected(null);
    deps.setHighlightIds([]);
    deps.setSearchQ("");
    deps.setHighlightSearch(false);
    deps.setShowStoryLegend(false);
    deps.setActiveSceneId("intro");
    deps.setStoryLegendOverride(null);
    deps.setGasPlantsVisible(false);
    deps.setGroundwaterVisible(false);
    deps.setProtestOnly(false);

    queueMicrotask(() => {
      deps.map.resize();
      applyScene(deps.sceneRegistry.intro, "intro");
    });
  }

  function goNextScene(): void {
    const idx = STORY_ORDER.indexOf(deps.activeSceneId());
    const nextId = STORY_ORDER[idx + 1];
    if (!nextId) return;
    const def = deps.sceneRegistry[nextId];
    if (def) applyScene(def, nextId);
  }

  function goPrevScene(): void {
    const idx = STORY_ORDER.indexOf(deps.activeSceneId());
    const prevId = STORY_ORDER[idx - 1];
    if (!prevId) return;
    const def = deps.sceneRegistry[prevId];
    if (def) applyScene(def, prevId);
  }

  function canGoNext(): boolean {
    const idx = STORY_ORDER.indexOf(deps.activeSceneId());
    return idx >= 0 && idx < STORY_ORDER.length - 1;
  }

  function canGoPrev(): boolean {
    const idx = STORY_ORDER.indexOf(deps.activeSceneId());
    return idx > 0;
  }

  return {
    applyScene,
    openExplore,
    backToStory,
    goNextScene,
    goPrevScene,
    canGoNext,
    canGoPrev,
    clearStatusCycle,
  };
}
