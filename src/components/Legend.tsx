import type { Component } from "solid-js";
import { For, Show, createSignal } from "solid-js";

import {
  GROUNDWATER_STRESS_COLORS,
  GROUNDWATER_STRESS_LEGEND,
  STATUS_COLORS,
  STATUS_LEGEND_ICONS,
} from "../map/constants";
import {
  type DataCenterFeature,
  type DcOperationalStatus,
} from "../types/data";
import type { SizeMetric } from "../url/params";
import { formatDbValueDe } from "../i18n/labels";

function statusLegendIconUrl(status: DcOperationalStatus): string {
  return `${import.meta.env.BASE_URL}icons/${STATUS_LEGEND_ICONS[status]}`;
}

type LegendProps = {
  showBackToStory: boolean;
  onBackToStory: () => void;
  showGoToExplore: boolean;
  onGoToExplore: () => void;
  filtersDisabled?: boolean;
  highlightSearch?: boolean;
  storySpotlight?: boolean;
  statuses: DcOperationalStatus[];
  enabledStatus: Record<DcOperationalStatus, boolean>;
  onToggleStatus: (s: DcOperationalStatus) => void;
  sizeMetric: SizeMetric;
  onSizeMetric: (m: SizeMetric) => void;
  searchQ: string;
  onSearch: (q: string) => void;
  searchResults: DataCenterFeature[];
  onSelectResult: (f: DataCenterFeature) => void;
  onPreviewResult?: (f: DataCenterFeature | null) => void;
  gasPlantsVisible: boolean;
  onToggleGasPlants: () => void;
  groundwaterVisible: boolean;
  onToggleGroundwater: () => void;
  protestOnly: boolean;
  onToggleProtestOnly: () => void;
};

export const Legend: Component<LegendProps> = (props) => {
  const startCollapsed =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 720px)").matches;
  const [collapsed, setCollapsed] = createSignal(startCollapsed);
  const [toggleHint, setToggleHint] = createSignal(startCollapsed);

  function clearSearch(): void {
    props.onSearch("");
    props.onPreviewResult?.(null);
  }

  function onToggleClick(): void {
    setToggleHint(false);
    setCollapsed((c) => !c);
  }

  return (
    <aside
      class="legend"
      classList={{
        "legend--collapsed": collapsed(),
        "legend--filters-disabled": Boolean(props.filtersDisabled),
        "legend--story-spotlight": Boolean(props.storySpotlight),
      }}
      aria-label="Legende"
      aria-hidden={
        props.filtersDisabled && !props.storySpotlight ? true : undefined
      }
    >
      <div class="legend__panel">
        <div class="legend__header">
          <h2 class="legend__title">Legende</h2>
          <Show when={props.showBackToStory}>
            <button
              type="button"
              class="legend__back"
              onClick={() => props.onBackToStory()}
            >
              Zur Einführung
            </button>
          </Show>
          <Show when={props.showGoToExplore}>
            <button
              type="button"
              class="legend__back"
              onClick={() => props.onGoToExplore()}
            >
              Zur interaktiven Karte
            </button>
          </Show>
        </div>

        <div class="legend__body">
          <div class="legend__section" role="group" aria-label="Status">
            <h3 class="legend__section-title">Status</h3>
            <ul class="legend__list">
              <For each={props.statuses}>
                {(s) => (
                  <li class="legend__row">
                    <button
                      type="button"
                      class="legend__item"
                      classList={{ "legend__item--off": !props.enabledStatus[s] }}
                      aria-pressed={props.enabledStatus[s]}
                      disabled={props.filtersDisabled}
                      onClick={() => props.onToggleStatus(s)}
                    >
                      <Show
                        when={props.sizeMetric === "icon"}
                        fallback={
                          <span
                            class="legend__swatch"
                            style={{ "background-color": STATUS_COLORS[s] }}
                          />
                        }
                      >
                        <img
                          class="legend__swatch-icon"
                          src={statusLegendIconUrl(s)}
                          alt=""
                          width="20"
                          height="20"
                        />
                      </Show>
                      <span class="legend__label">
                        {s === "operational"
                          ? "seit 2026 in Betrieb"
                          : formatDbValueDe("status", s === "unknown" ? null : s)}
                      </span>
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </div>

          <div class="legend__section" role="group" aria-label="Ebenen">
            <h3 class="legend__section-title">Ebenen</h3>
            <ul class="legend__list">
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item"
                  classList={{ "legend__item--off": !props.gasPlantsVisible }}
                  aria-pressed={props.gasPlantsVisible}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onToggleGasPlants()}
                >
                  <img
                    class="legend__swatch-icon"
                    src={`${import.meta.env.BASE_URL}icons/key-category-gas-plant.svg`}
                    alt=""
                    width="20"
                    height="20"
                  />
                  <span class="legend__label">neue Gaskraftwerke</span>
                </button>
              </li>
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item"
                  classList={{ "legend__item--off": !props.groundwaterVisible }}
                  aria-pressed={props.groundwaterVisible}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onToggleGroundwater()}
                >
                  <img
                    class="legend__swatch-icon"
                    src={`${import.meta.env.BASE_URL}icons/droplet.svg`}
                    alt=""
                    width="20"
                    height="20"
                  />
                  <span class="legend__label">Grundwasserstress</span>
                </button>
                <Show when={props.groundwaterVisible}>
                  <ul
                    class="legend__sublist"
                    aria-label="Grundwasserstress Farben"
                  >
                    <For each={GROUNDWATER_STRESS_LEGEND}>
                      {(item) => (
                        <li class="legend__subrow" title={item.description}>
                          <span
                            class="legend__swatch legend__swatch--square"
                            style={{
                              "background-color":
                                GROUNDWATER_STRESS_COLORS[item.category],
                            }}
                          />
                          <span class="legend__sublabel">{item.label}</span>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
              </li>
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item"
                  classList={{ "legend__item--off": !props.protestOnly }}
                  aria-pressed={props.protestOnly}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onToggleProtestOnly()}
                >
                  <img
                    class="legend__swatch-icon"
                    src={`${import.meta.env.BASE_URL}icons/megaphone.svg`}
                    alt=""
                    width="20"
                    height="20"
                  />
                  <span class="legend__label">nur Proteste</span>
                </button>
              </li>
            </ul>
          </div>

          <div class="legend__section" role="group" aria-label="Darstellung">
            <h3 class="legend__section-title">Darstellung</h3>
            <ul class="legend__list">
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item legend__item--choice"
                  classList={{ "legend__item--off": props.sizeMetric !== "icon" }}
                  aria-pressed={props.sizeMetric === "icon"}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onSizeMetric("icon")}
                >
                  <img
                    class="legend__choice-icon"
                    src={`${import.meta.env.BASE_URL}icons/rack.svg`}
                    alt=""
                    width="20"
                    height="20"
                  />
                  <span class="legend__label">Standort</span>
                </button>
              </li>
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item legend__item--choice"
                  classList={{ "legend__item--off": props.sizeMetric !== "floor" }}
                  aria-pressed={props.sizeMetric === "floor"}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onSizeMetric("floor")}
                >
                  <span class="legend__swatch legend__swatch--circle" />
                  <span class="legend__label">Gebäudefläche (ha)</span>
                </button>
              </li>
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item legend__item--choice"
                  classList={{ "legend__item--off": props.sizeMetric !== "site" }}
                  aria-pressed={props.sizeMetric === "site"}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onSizeMetric("site")}
                >
                  <span class="legend__swatch legend__swatch--circle" />
                  <span class="legend__label">Grundstücksfläche (ha)</span>
                </button>
              </li>
              <li class="legend__row">
                <button
                  type="button"
                  class="legend__item legend__item--choice"
                  classList={{ "legend__item--off": props.sizeMetric !== "power" }}
                  aria-pressed={props.sizeMetric === "power"}
                  disabled={props.filtersDisabled}
                  onClick={() => props.onSizeMetric("power")}
                >
                  <span class="legend__swatch legend__swatch--circle" />
                  <span class="legend__label">Leistung (kW)</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div
          class="legend__search"
          classList={{ "legend__search--highlight": Boolean(props.highlightSearch) }}
        >
          <label class="legend__search-label" for="legend-search-input">
            Suche
          </label>
          <div class="legend__search-control">
            <input
              id="legend-search-input"
              type="search"
              value={props.searchQ}
              placeholder="Name, Betreiber, Stadt…"
              autocomplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="legend-search-results"
              aria-expanded={props.searchResults.length > 0}
              disabled={props.filtersDisabled}
              onInput={(e) => props.onSearch(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  clearSearch();
                }
              }}
            />
            <Show when={props.searchQ.length > 0}>
              <button
                type="button"
                class="legend__search-clear"
                aria-label="Suche leeren"
                disabled={props.filtersDisabled}
                onClick={() => clearSearch()}
              >
                ×
              </button>
            </Show>
          </div>
          <Show when={props.searchResults.length > 0 && !props.filtersDisabled}>
            <ul
              id="legend-search-results"
              class="legend__results"
              role="listbox"
              aria-label="Suchergebnisse"
              onMouseLeave={() => props.onPreviewResult?.(null)}
              onFocusOut={(e) => {
                const next = e.relatedTarget as Node | null;
                if (!e.currentTarget.contains(next)) {
                  props.onPreviewResult?.(null);
                }
              }}
            >
              <For each={props.searchResults}>
                {(f) => (
                  <li role="presentation">
                    <button
                      type="button"
                      class="legend__result"
                      role="option"
                      onMouseEnter={() => props.onPreviewResult?.(f)}
                      onFocus={() => props.onPreviewResult?.(f)}
                      onClick={() => props.onSelectResult(f)}
                    >
                      {f.properties.name}
                    </button>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>

        <button
          type="button"
          class="legend__download"
          onClick={() => {
            const a = document.createElement("a");
            a.href = `${import.meta.env.BASE_URL}data/datacenters.csv`;
            a.download = "datacenters.csv";
            a.rel = "noopener";
            document.body.append(a);
            a.click();
            a.remove();
          }}
        >
          Rohdaten herunterladen
        </button>
      </div>

      <button
        type="button"
        class="legend__toggle"
        classList={{ "legend__toggle--hint": toggleHint() }}
        onClick={() => onToggleClick()}
        aria-expanded={!collapsed()}
        aria-label={collapsed() ? "Legende einblenden" : "Legende ausblenden"}
        title={collapsed() ? "Legende einblenden" : "Legende ausblenden"}
      >
        <svg
          class="legend__toggle-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </aside>
  );
};
