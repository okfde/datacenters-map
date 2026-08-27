import type { Component } from "solid-js";
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type maplibregl from "maplibre-gl";

import { FeaturePanel } from "./FeaturePanel";
import { Legend } from "./Legend";
import { StoryOverlay } from "./StoryOverlay";
import {
  addDataCentersToMap,
  addOverlayLayers,
  featureMatchesFilter,
  setDataCentersFilter,
  setLayerOpacity,
  setOverlayVisibility,
  setSelectedDataCenterHighlight,
  setSelectedGasPlantHighlight,
  setSizeMetric,
  type LegendFilter,
  type OverlayVisibility,
} from "../map/layers";
import { applyCamera, GERMANY_CAMERA } from "../map/mapActions";
import { cursorHitLayers, pickFeatureAtPoint } from "../map/mapSelection";
import { waitForMapIdle } from "../map/setupMap";
import {
  ALL_STATUS,
  collectPresentStatuses,
  datacentersAtSameLocation,
  gasPlantsAtSameLocation,
  isGasPlantFeature,
  type DataCenterCollection,
  type DataCenterFeature,
  type DcOperationalStatus,
  type GasPlantCollection,
  type MapSelectableFeature,
} from "../types/data";
import { parseUrlState, writeUrlState, type StartMode } from "../url";
import {
  STORY_ORDER,
  buildDefaultLegendFilter,
  buildSceneRegistry,
  type SceneId,
} from "../scenes/registry";
import { createStoryPlayback } from "../story/playback";

type ControlWithInternalMap = { _map?: maplibregl.Map };

function initialStatusFilter(fromUrl: string[]): Record<DcOperationalStatus, boolean> {
  const allOn = Object.fromEntries(ALL_STATUS.map((s) => [s, true])) as Record<
    DcOperationalStatus,
    boolean
  >;
  if (fromUrl.length) {
    for (const s of ALL_STATUS) allOn[s] = fromUrl.includes(s);
  }
  return allOn;
}

type AppProps = {
  map: maplibregl.Map;
  navControl: maplibregl.NavigationControl;
  hash: maplibregl.Hash;
  data: DataCenterCollection;
  container: HTMLElement;
  startMode: StartMode;
  onMapAssetsReady: () => void;
};

export const App: Component<AppProps> = (props) => {
  const initial = parseUrlState();
  const sceneRegistry = buildSceneRegistry(props.data);
  const defaults = buildDefaultLegendFilter(props.data);
  const presentStatuses = collectPresentStatuses(props.data);

  const initialScene: SceneId =
    props.startMode === "explore"
      ? "explore"
      : initial.scene && STORY_ORDER.includes(initial.scene as SceneId)
        ? (initial.scene as SceneId)
        : "intro";

  const [activeSceneId, setActiveSceneId] = createSignal<SceneId>(initialScene);
  const [mapInteractive, setMapInteractive] = createSignal(
    props.startMode === "explore",
  );
  const [selected, setSelected] = createSignal<MapSelectableFeature | null>(null);
  const [highlightIds, setHighlightIds] = createSignal<string[]>([]);
  const [enabledStatus, setEnabledStatus] = createSignal(
    initialStatusFilter(initial.status),
  );
  const [storyLegendOverride, setStoryLegendOverride] = createSignal<Partial<LegendFilter> | null>(
    null,
  );
  const [sizeMetric, setSizeMetricState] = createSignal(initial.view);
  const [searchQ, setSearchQ] = createSignal(initial.q);
  const [highlightSearch, setHighlightSearch] = createSignal(false);
  const [previewIds, setPreviewIds] = createSignal<string[]>([]);
  const [showStoryLegend, setShowStoryLegend] = createSignal(false);
  const [gasPlantsVisible, setGasPlantsVisible] = createSignal(false);
  const [gasPlantsData, setGasPlantsData] = createSignal<GasPlantCollection | null>(
    null,
  );
  const [groundwaterVisible, setGroundwaterVisible] = createSignal(false);
  const [protestOnly, setProtestOnly] = createSignal(initial.protest === true);

  const playback = createStoryPlayback({
    map: props.map,
    data: props.data,
    sceneRegistry,
    isMapInteractive: mapInteractive,
    activeSceneId,
    setMapInteractive,
    setActiveSceneId,
    setStoryLegendOverride,
    setSizeMetric: setSizeMetricState,
    setSearchQ,
    setHighlightSearch,
    setShowStoryLegend,
    setGasPlantsVisible,
    setGroundwaterVisible,
    setProtestOnly,
    setHighlightIds,
    setSelected,
  });

  function userLegendFilter(): LegendFilter {
    const q = searchQ().trim();
    return {
      enabledStatus: enabledStatus(),
      enabledTypes: defaults.enabledTypes,
      enabledOwnerTypes: defaults.enabledOwnerTypes,
      enabledOwnerCountries: defaults.enabledOwnerCountries,
      protestOnly: protestOnly(),
      minPowerKw: null,
      searchQuery: q || null,
    };
  }

  function currentLegend(): LegendFilter {
    const base = userLegendFilter();
    const override = storyLegendOverride();
    if (!override || mapInteractive()) return base;
    return { ...base, ...override };
  }

  function displayStatus(): Record<DcOperationalStatus, boolean> {
    const override = storyLegendOverride();
    if (!mapInteractive() && override?.enabledStatus) return override.enabledStatus;
    return enabledStatus();
  }

  function displayProtestOnly(): boolean {
    const override = storyLegendOverride();
    if (!mapInteractive() && override?.protestOnly != null) {
      return Boolean(override.protestOnly);
    }
    return protestOnly();
  }

  onMount(() => {
    void (async () => {
      await addDataCentersToMap(props.map, props.data, sizeMetric());
      const overlays = await addOverlayLayers(props.map);
      if (overlays.gasPlants) setGasPlantsData(overlays.gasPlants);

      await waitForMapIdle(props.map);
      props.onMapAssetsReady();

      if (props.startMode === "explore") {
        playback.openExplore();
      } else {
        setLayerOpacity(props.map, 0.7);
        const startDef = sceneRegistry[initialScene];
        if (startDef && initialScene !== "explore") {
          playback.applyScene(startDef, initialScene);
        }
      }

      if (initial.feature) {
        const dc = props.data.features.find(
          (x) => x.properties.id === initial.feature,
        );
        if (dc) {
          setSelected(dc);
          setHighlightIds(
            datacentersAtSameLocation(props.data, dc).map((f) => f.properties.id),
          );
          props.map.flyTo({
            center: dc.geometry.coordinates,
            zoom: Math.max(props.map.getZoom(), 9),
          });
        } else {
          const plant = overlays.gasPlants?.features.find(
            (x) => x.properties.id === initial.feature,
          );
          if (plant) {
            setGasPlantsVisible(true);
            setSelected(plant);
            const siblingIds = gasPlantsAtSameLocation(
              overlays.gasPlants,
              plant,
            ).map((f) => f.properties.id);
            setHighlightIds(siblingIds);
            props.map.flyTo({
              center: plant.geometry.coordinates,
              zoom: Math.max(props.map.getZoom(), 9),
            });
          }
        }
      }
    })();

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const picked = pickFeatureAtPoint({
        map: props.map,
        point: e.point,
        interactive: mapInteractive(),
        sizeMetric: sizeMetric(),
        data: props.data,
        gasPlantsVisible: gasPlantsVisible(),
        gasPlants: gasPlantsData(),
      });
      if (!picked || picked.kind === "cluster") return;
      setSelected(picked.feature);
      setHighlightIds(picked.highlightIds);
      writeUrlState({ feature: picked.feature?.properties.id ?? null });
    };

    const onMove = (e: maplibregl.MapMouseEvent) => {
      if (!mapInteractive()) return;
      const present = cursorHitLayers(
        props.map,
        sizeMetric(),
        gasPlantsVisible(),
      );
      const hits =
        present.length > 0
          ? props.map.queryRenderedFeatures(e.point, { layers: present })
          : [];
      props.map.getCanvas().style.cursor = hits.length ? "pointer" : "";
    };

    props.map.on("click", onClick);
    props.map.on("mousemove", onMove);
    onCleanup(() => {
      playback.clearStatusCycle();
      props.map.off("click", onClick);
      props.map.off("mousemove", onMove);
      document.body.classList.remove("interactive");
      document.body.classList.remove("story-mode");
    });
  });

  createEffect(() => {
    const interactive = mapInteractive();
    const map = props.map;
    const nav = props.navControl as unknown as ControlWithInternalMap;
    const hashCtl = props.hash as unknown as ControlWithInternalMap;

    map.scrollZoom[interactive ? "enable" : "disable"]();
    map.boxZoom[interactive ? "enable" : "disable"]();
    map.dragRotate[interactive ? "enable" : "disable"]();
    map.dragPan[interactive ? "enable" : "disable"]();
    map.keyboard[interactive ? "enable" : "disable"]();
    map.doubleClickZoom[interactive ? "enable" : "disable"]();
    map.touchZoomRotate[interactive ? "enable" : "disable"]();

    document.body.classList.toggle("interactive", interactive);
    document.body.classList.toggle("story-mode", !interactive);

    if (interactive) {
      props.container.classList.remove("non-interactive");
      if (!nav._map) map.addControl(props.navControl, "top-right");
      if (!hashCtl._map) props.hash.addTo(map);
    } else {
      props.container.classList.add("non-interactive");
      if (nav._map) map.removeControl(props.navControl);
      if (hashCtl._map) props.hash.remove();
    }

    queueMicrotask(() => map.resize());
  });

  createEffect(() => {
    if (props.map.getSource("datacenters")) {
      setDataCentersFilter(props.map, currentLegend());
    }
    writeUrlState({
      status: ALL_STATUS.filter((s) => enabledStatus()[s]),
      view: sizeMetric(),
      q: searchQ() || undefined,
      protest: protestOnly() ? true : null,
    });
  });

  createEffect(() => {
    setSizeMetric(props.map, sizeMetric());
  });

  createEffect(() => {
    const preview = previewIds();
    const ids = preview.length ? preview : highlightIds();
    const sel = selected();
    if (sel && isGasPlantFeature(sel) && !preview.length) {
      setSelectedDataCenterHighlight(props.map, null);
      setSelectedGasPlantHighlight(props.map, ids.length ? ids : null);
    } else {
      setSelectedGasPlantHighlight(props.map, null);
      setSelectedDataCenterHighlight(props.map, ids.length ? ids : null);
    }
  });

  createEffect(() => {
    const visibility: OverlayVisibility = {
      gasPlants: gasPlantsVisible(),
      groundwater: groundwaterVisible(),
    };
    setOverlayVisibility(props.map, visibility);
    if (!visibility.gasPlants) {
      const sel = selected();
      if (sel && isGasPlantFeature(sel)) {
        setSelected(null);
        setHighlightIds([]);
        writeUrlState({ feature: null });
      }
    }
  });

  const filteredList = createMemo(() => {
    const q = searchQ().trim();
    if (!q) return [] as DataCenterFeature[];
    const legend = currentLegend();
    return props.data.features.filter((f) => featureMatchesFilter(f, legend));
  });

  const coLocatedDataCenters = createMemo(() => {
    const sel = selected();
    if (!sel || isGasPlantFeature(sel)) return undefined;
    const siblings = datacentersAtSameLocation(props.data, sel);
    return siblings.length > 1 ? siblings : undefined;
  });

  const coLocatedGasPlants = createMemo(() => {
    const sel = selected();
    if (!sel || !isGasPlantFeature(sel)) return undefined;
    const siblings = gasPlantsAtSameLocation(gasPlantsData(), sel);
    return siblings.length > 1 ? siblings : undefined;
  });

  return (
    <div class="ui-layer" id="explore-anchor">
      <Legend
        showBackToStory={mapInteractive()}
        onBackToStory={playback.backToStory}
        showGoToExplore={!mapInteractive()}
        onGoToExplore={playback.openExplore}
        filtersDisabled={!mapInteractive()}
        highlightSearch={highlightSearch()}
        storySpotlight={showStoryLegend()}
        statuses={presentStatuses}
        enabledStatus={displayStatus()}
        onToggleStatus={(s) =>
          setEnabledStatus((cur) => {
            const next = { ...cur, [s]: !cur[s] };
            const anyOn = presentStatuses.some((k) => next[k]);
            return anyOn
              ? next
              : {
                  ...cur,
                  ...Object.fromEntries(presentStatuses.map((k) => [k, true])),
                };
          })
        }
        sizeMetric={sizeMetric()}
        onSizeMetric={setSizeMetricState}
        searchQ={searchQ()}
        onSearch={(q) => {
          const wasEmpty = !searchQ().trim();
          setSearchQ(q);
          setPreviewIds([]);
          if (wasEmpty && q.trim()) {
            applyCamera(props.map, GERMANY_CAMERA);
          }
        }}
        searchResults={filteredList()}
        onPreviewResult={(f) => {
          setPreviewIds(f ? [f.properties.id] : []);
        }}
        onSelectResult={(f) => {
          setPreviewIds([]);
          setSelected(f);
          setHighlightIds(
            datacentersAtSameLocation(props.data, f).map((x) => x.properties.id),
          );
          writeUrlState({ feature: f.properties.id });
          props.map.flyTo({
            center: f.geometry.coordinates,
            zoom: 10,
          });
        }}
        gasPlantsVisible={gasPlantsVisible()}
        onToggleGasPlants={() => setGasPlantsVisible(!gasPlantsVisible())}
        groundwaterVisible={groundwaterVisible()}
        onToggleGroundwater={() =>
          setGroundwaterVisible(!groundwaterVisible())
        }
        protestOnly={displayProtestOnly()}
        onToggleProtestOnly={() => setProtestOnly(!protestOnly())}
      />

      <Show when={!mapInteractive()}>
        <StoryOverlay
          activeSceneId={activeSceneId()}
          onOpenExplore={playback.openExplore}
          onNext={playback.goNextScene}
          onPrev={playback.goPrevScene}
          canGoNext={playback.canGoNext()}
          canGoPrev={playback.canGoPrev()}
        />
      </Show>

      <Show when={selected()}>
        {(f) => (
          <FeaturePanel
            feature={f()}
            coLocatedDataCenters={coLocatedDataCenters()}
            coLocatedGasPlants={coLocatedGasPlants()}
            onClose={() => {
              setSelected(null);
              setHighlightIds([]);
              writeUrlState({ feature: null });
            }}
          />
        )}
      </Show>
    </div>
  );
};
