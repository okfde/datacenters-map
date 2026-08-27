import type { Component, JSX } from "solid-js";
import { For, Show } from "solid-js";

import {
  isGasPlantFeature,
  type DataCenterFeature,
  type GasPlantFeature,
  type GasPlantStatus,
  type MapSelectableFeature,
} from "../types/data";
import {
  fieldLabelDe,
  FLOOR_POWER_ATTR_KEYS,
  formatAttrValue,
  formatDbValueDe,
  isEmptyAttrDisplayValue,
  parseSources,
  PRIMARY_ATTR_KEYS,
  resolveFloorPowerEntries,
} from "../i18n/labels";

type FeaturePanelProps = {
  feature: MapSelectableFeature;
  coLocatedDataCenters?: DataCenterFeature[];
  coLocatedGasPlants?: GasPlantFeature[];
  onClose: () => void;
};

function orderedEntries(
  attrs: Record<string, string>,
  sizeFloorSqm: number | null | undefined,
  sizePowerKw: number | null | undefined,
  operationalStatus: string | null | undefined,
): Array<[string, string]> {
  const used = new Set<string>();
  const out: Array<[string, string]> = [];
  const showConstructionPhase = operationalStatus === "under_construction";

  for (const key of PRIMARY_ATTR_KEYS) {
    if (key === "sources") continue;
    if (key === "construction_status" && !showConstructionPhase) continue;
    if (key === "intended_use") {
      for (const entry of resolveFloorPowerEntries(
        attrs,
        sizeFloorSqm,
        sizePowerKw,
      )) {
        out.push(entry);
        used.add(entry[0]);
      }
    }
    const v = attrs[key];
    if (isEmptyAttrDisplayValue(v)) continue;
    out.push([key, v]);
    used.add(key);
  }

  for (const [k, v] of Object.entries(attrs)) {
    if (used.has(k) || k === "data_center_name" || k === "sources") continue;
    if (FLOOR_POWER_ATTR_KEYS.has(k)) continue;
    if (k === "construction_status" && !showConstructionPhase) continue;
    if (isEmptyAttrDisplayValue(v)) continue;
    out.push([k, v]);
  }
  return out;
}

function metaParts(
  status: string | null | undefined,
  type: string | null | undefined,
): string[] {
  const parts: string[] = [];
  if (!isEmptyAttrDisplayValue(status ?? undefined)) {
    parts.push(formatDbValueDe("status", status));
  }
  if (!isEmptyAttrDisplayValue(type ?? undefined)) {
    parts.push(formatDbValueDe("type", type));
  }
  return parts;
}

const GAS_STATUS_LABEL_DE: Record<GasPlantStatus, string> = {
  exploration: "angekündigt",
  preparation: "in Bau",
  operational: "in Betrieb",
};

const GAS_HIDDEN_ATTR_KEYS = new Set([
  "CreatedAt",
  "UpdatedAt",
  "Projektstatus",
  "Projektart",
]);

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

function isQuelleAttributeKey(key: string): boolean {
  if (key === "Quelle") return true;
  return key.toLowerCase().startsWith("quelle/");
}

function sortGasDetailEntries(a: [string, string], b: [string, string]): number {
  const qa = isQuelleAttributeKey(a[0]);
  const qb = isQuelleAttributeKey(b[0]);
  if (qa && !qb) return 1;
  if (!qa && qb) return -1;
  return a[0].localeCompare(b[0], "de");
}

function getUnternehmen(attrs: Record<string, string>): string | undefined {
  const v = attrs["Unternehmen"]?.trim();
  return v || undefined;
}

function displayGasAttrKey(status: GasPlantStatus, key: string): string {
  if (status === "operational" && key.startsWith("Geplante Inbetriebnahme")) {
    return key.replace(/^Geplante\s+/, "");
  }
  return key;
}

function sortedGasDetailEntries(
  feature: GasPlantFeature,
): [string, string][] {
  const attrs = feature.properties.source_attributes ?? {};
  const name = feature.properties.name;
  return Object.entries(attrs)
    .filter(([k, v]) => {
      if (GAS_HIDDEN_ATTR_KEYS.has(k)) return false;
      if (k === "Projektname" && v === name) return false;
      if (k === "Unternehmen") return false;
      return Boolean(v?.trim());
    })
    .sort(sortGasDetailEntries);
}

const DataCenterMeta: Component<{ feature: DataCenterFeature }> = (props) => {
  const p = () => props.feature.properties;
  const meta = () => metaParts(p().operational_status, p().data_center_type);
  return (
    <Show
      when={
        meta().length > 0 || p().has_protest || Boolean(p().owner_country_flag)
      }
    >
      <p class="feature-panel__meta">
        {meta().join(" · ")}
        <Show when={p().has_protest}>
          {meta().length > 0 ? " · " : ""}
          <span class="feature-panel__protest" title="Protest">
            <img
              class="feature-panel__megaphone"
              src={`${import.meta.env.BASE_URL}icons/megaphone.svg`}
              alt=""
              width="16"
              height="16"
            />{" "}
            Protest
          </span>
        </Show>
        <Show when={p().owner_country_flag}>
          {meta().length > 0 || p().has_protest ? " · " : ""}
          <span
            class="feature-panel__flag"
            title={formatDbValueDe("owner_country", p().owner_country)}
            aria-label={formatDbValueDe("owner_country", p().owner_country)}
          >
            {p().owner_country_flag}
          </span>
        </Show>
      </p>
    </Show>
  );
};

const DataCenterDetails: Component<{ feature: DataCenterFeature }> = (props) => {
  const p = () => props.feature.properties;
  const attrs = () => p().source_attributes ?? {};
  const sources = () => parseSources(attrs().sources);
  const entries = () =>
    orderedEntries(
      attrs(),
      p().size_floor_sqm,
      p().size_power_kw,
      p().operational_status,
    );

  return (
    <>
      <DataCenterMeta feature={props.feature} />
      <dl class="feature-panel__attrs">
        <For each={entries()}>
          {([k, v]) => (
            <div class="feature-panel__attr">
              <dt>{fieldLabelDe(k)}</dt>
              <dd>{formatAttrValue(k, v)}</dd>
            </div>
          )}
        </For>
        <Show when={sources().length > 0}>
          <div class="feature-panel__attr feature-panel__attr--sources">
            <dt>{fieldLabelDe("sources")}</dt>
            <dd>
              <ul class="feature-panel__sources">
                <For each={sources()}>
                  {(s) => (
                    <li>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </dd>
          </div>
        </Show>
      </dl>
    </>
  );
};

function datacenterSiteTitle(features: DataCenterFeature[]): string {
  if (features.length === 1) return features[0].properties.name;
  return (
    features[0].properties.name.replace(/\s*-\s*Phase\s+\d+\s*$/i, "").trim() ||
    features[0].properties.name
  );
}

function datacenterSectionTitle(feature: DataCenterFeature): string {
  const name = feature.properties.name;
  const phaseMatch = name.match(/\s*-\s*Phase\s+(\d+)\s*$/i);
  if (phaseMatch) return `Phase ${phaseMatch[1]}`;
  return name;
}

const DataCenterPanel: Component<{
  feature: DataCenterFeature;
  coLocated?: DataCenterFeature[];
  onClose: () => void;
}> = (props) => {
  const sections = () => {
    const siblings = props.coLocated;
    if (siblings && siblings.length > 1) {
      return [...siblings].sort((a, b) =>
        a.properties.name.localeCompare(b.properties.name, "de"),
      );
    }
    return [props.feature];
  };

  return (
    <aside class="feature-panel" aria-label="Details">
      <header class="feature-panel__header">
        <div class="feature-panel__heading">
          <h2 class="feature-panel__title">{datacenterSiteTitle(sections())}</h2>
          <Show when={sections().length > 1}>
            <p class="feature-panel__meta">
              {sections().length} Projekte an diesem Standort
            </p>
          </Show>
        </div>
        <button
          type="button"
          class="feature-panel__close"
          aria-label="Schließen"
          onClick={() => props.onClose()}
        >
          ×
        </button>
      </header>
      <div class="feature-panel__body">
        <For each={sections()}>
          {(section, index) => (
            <section class="feature-panel__section">
              <Show when={sections().length > 1}>
                <h3 class="feature-panel__section-title">
                  {datacenterSectionTitle(section)}
                </h3>
              </Show>
              <DataCenterDetails feature={section} />
              <Show when={index() < sections().length - 1}>
                <hr class="feature-panel__divider" />
              </Show>
            </section>
          )}
        </For>
      </div>
    </aside>
  );
};

const GasPlantRow: Component<{ label: string; children: JSX.Element }> = (p) => (
  <div class="feature-panel__attr">
    <dt>{p.label}</dt>
    <dd>{p.children}</dd>
  </div>
);

const GasPlantDetails: Component<{ feature: GasPlantFeature }> = (props) => {
  const p = () => props.feature.properties;
  const attrs = () => p().source_attributes ?? {};
  const unternehmen = () => getUnternehmen(attrs());
  const detailEntries = () => sortedGasDetailEntries(props.feature);
  const hasAttrDetail = () =>
    unternehmen() !== undefined || detailEntries().length > 0;

  return (
    <>
      <GasPlantRow label="Kategorie">Gaskraftwerk</GasPlantRow>
      <GasPlantRow label="Status">
        {GAS_STATUS_LABEL_DE[p().status]}
      </GasPlantRow>
      <Show when={unternehmen()}>
        {(u) => <GasPlantRow label="Unternehmen">{u()}</GasPlantRow>}
      </Show>
      <Show when={hasAttrDetail()}>
        <For each={detailEntries()}>
          {([attrKey, attrVal]) => (
            <GasPlantRow label={displayGasAttrKey(p().status, attrKey)}>
              {isHttpUrl(attrVal) ? (
                <a href={attrVal.trim()} target="_blank" rel="noopener noreferrer">
                  Link öffnen
                </a>
              ) : (
                attrVal
              )}
            </GasPlantRow>
          )}
        </For>
      </Show>
      <Show when={!hasAttrDetail() && p().description}>
        <GasPlantRow label="Beschreibung">{p().description}</GasPlantRow>
      </Show>
      <Show when={!hasAttrDetail() && p().source_url}>
        <GasPlantRow label="Quelle">
          <a href={p().source_url!} target="_blank" rel="noopener noreferrer">
            Link öffnen
          </a>
        </GasPlantRow>
      </Show>
    </>
  );
};

function gasPlantSectionTitle(feature: GasPlantFeature): string {
  const attrs = feature.properties.source_attributes ?? {};
  const tech = attrs.Technologie?.trim();
  const capacity = attrs["Geplante Kapazität in Megawatt (MW)"]?.trim();
  if (tech && capacity) return `${tech} · ${capacity} MW`;
  if (tech) return tech;
  return feature.properties.name;
}

const GasPlantPanel: Component<{
  feature: GasPlantFeature;
  coLocated?: GasPlantFeature[];
  onClose: () => void;
}> = (props) => {
  const sections = () => {
    const siblings = props.coLocated;
    if (siblings && siblings.length > 1) return siblings;
    return [props.feature];
  };

  return (
    <aside class="feature-panel" aria-label="Gaskraftwerk-Details" lang="de">
      <header class="feature-panel__header">
        <div class="feature-panel__heading">
          <h2 class="feature-panel__title">{props.feature.properties.name}</h2>
          <Show when={sections().length > 1}>
            <p class="feature-panel__meta">
              {sections().length} Projekte an diesem Standort
            </p>
          </Show>
        </div>
        <button
          type="button"
          class="feature-panel__close"
          aria-label="Schließen"
          onClick={() => props.onClose()}
        >
          ×
        </button>
      </header>
      <div class="feature-panel__body">
        <For each={sections()}>
          {(section, index) => (
            <section class="feature-panel__section">
              <Show when={sections().length > 1}>
                <h3 class="feature-panel__section-title">
                  {gasPlantSectionTitle(section)}
                </h3>
              </Show>
              <dl class="feature-panel__attrs">
                <GasPlantDetails feature={section} />
              </dl>
              <Show when={index() < sections().length - 1}>
                <hr class="feature-panel__divider" />
              </Show>
            </section>
          )}
        </For>
      </div>
    </aside>
  );
};

export const FeaturePanel: Component<FeaturePanelProps> = (props) => (
  <Show
    when={(() => {
      const f = props.feature;
      return isGasPlantFeature(f) ? f : undefined;
    })()}
    fallback={
      <DataCenterPanel
        feature={props.feature as DataCenterFeature}
        coLocated={props.coLocatedDataCenters}
        onClose={props.onClose}
      />
    }
  >
    {(plant) => (
      <GasPlantPanel
        feature={plant()}
        coLocated={props.coLocatedGasPlants}
        onClose={props.onClose}
      />
    )}
  </Show>
);
