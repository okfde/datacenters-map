import type { Component, JSX } from "solid-js";
import { Show } from "solid-js";

import type { SceneId } from "../scenes/registry";

type StoryTextEntry = {
  title: string;
  body: string;
  faqUrl?: string;
};

function storyBodyContent(entry: StoryTextEntry): JSX.Element {
  const { body, faqUrl } = entry;
  if (!faqUrl) return body;
  const match = /\bFAQs?\b/.exec(body);
  if (!match || match.index == null) return body;
  const idx = match.index;
  const label = match[0];
  return (
    <>
      {body.slice(0, idx)}
      <a href={faqUrl} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
      {body.slice(idx + label.length)}
    </>
  );
}

type Props = {
  activeSceneId: SceneId;
  onOpenExplore: () => void;
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
};

const FAQ_HREF = "https://fragdenstaat.de/aktionen/heisse-luft/faq/";

const TEXT: Partial<Record<SceneId, StoryTextEntry>> = {
  intro: {
    title: "Einführung",
    body: "Bundeswirtschaftsministerin Katherina Reiche will im großen Stil den Bau von Rechenzentren ermöglichen. Wir machen mit unserer Heiße-Luft-Karte transparent, wo solche Rechenzentren entstehen sollen und beleuchten die Folgen für Klima, Wasser und Umwelt.",
  },
  status: {
    title: "Rechenzentren",
    body: "Auf der Karte bilden wir ab, welchen Planungsstatus geplante und angekündigte Rechenzentren haben und in welcher Bauphase sie sich befinden. Hinzu kommen weitere Daten, beispielsweise wer das Rechenzentrum betreiben wird.",
  },
  energy: {
    title: "Stromverbrauch",
    body: "Rechenzentren verbrauchen enorme Mengen Strom. Wir haben den Energiebedarf für die geplanten Rechenzentren prognostiziert. Informationen zu unseren Methoden findest du in den FAQs.",
    faqUrl: FAQ_HREF,
  },
  energyGas: {
    title: "Stromverbrauch",
    body: "Für den Ausbau von Rechenzentren soll auch die fossile Gasinfrastruktur massiv ausgebaut werden. Blende auf der Karte alle geplanten Gaskraftwerke ein: Ein Großteil des zusätzlichen Strombedarfs von Rechenzentren soll mit fossilen Brennstoffen gedeckt werden.",
  },
  water: {
    title: "Wasserkonflikte",
    body: "Die geplanten Rechenzentren sind riesige Wasserschlucker. Rund ein Drittel der großen deutschen Rechenzentren nutzt wasserintensive Verdunstungskühlung, meist aus Grundwasserreserven, die auch den Großteil unseres Trinkwassers liefern.",
  },
  waterStress: {
    title: "Wasserkonflikte",
    body: "Schon heute herrscht in jedem zweiten deutschen Landkreis Grundwasserstress. Blende die Ebene Grundwasserstress ein, um zu sehen, wo neue Rechenzentren die Wasserversorgung zusätzlich belasten könnten.",
  },
  waterBaruth: {
    title: "Wasserkonflikte",
    body: "Die Gemeinde Baruth in Brandenburg liegt in einem Landkreis mit akutem und strukturellem Grundwasserstress. Dort hat sich der RedBull Konzern einen großen Teil des Grundwassers gesichert und zusätzlich möchte Amazon dort ein großes Rechenzentrum bauen.",
  },
  bigtech: {
    title: "BigTech",
    body: "Die Bundesregierung begründet den Ausbau mit „digitaler Souveränität\". Doch ein Großteil der geplanten Rechenzentren wird von US-Konzernen betrieben, die dem US Cloud Act unterliegen – der sie im Zweifelsfall zur Herausgabe der Daten europäischer Nutzer:innen an die US-Behörden verpflichtet, selbst wenn die Server in Europa stehen.",
  },
  bigtechSearch: {
    title: "BigTech",
    body: "Über die Suchfunktion kannst du finden, wo bestimmte Investor:innen ihre Rechenzentren bauen wollen.",
  },
  protests: {
    title: "Proteste",
    body: "Rechenzentren haben starke Auswirkungen auf lokaler Ebene. Sie verbrauchen viel Strom, Wasser und Flächen und erhitzen ihre Umgebung. Versprochene Jobs bleiben oft heiße Luft: Im rumänischen Mischii entstanden statt 21 nur 10 Stellen, in der niederländischen Gemeinde Hollands Kroon statt 2.000 nur rund 530.",
  },
  protestsLayer: {
    title: "Proteste",
    body: "Die Ebene Proteste zeigt, wo Anwohner:innen sich gegen den Bau von Rechenzentren organisieren.",
  },
  outro: {
    title: "Heiße Luft",
    body: "Die Bundesregierung treibt den Ausbau von Rechenzentren massiv voran – mit schwerwiegenden Auswirkungen auf Umwelt und Gesellschaft. Bislang gibt es keine öffentlich verfügbaren Informationen darüber, wo bereits Rechenzentren geplant werden.",
  },
  outroFaq: {
    title: "Heiße Luft",
    body: "Doch ein ausufernder Zugriff auf Ressourcen wie Strom und Wasser, eine folgenschwere Gefährdung des Klimas und gravierende lokale Auswirkungen dürfen nicht im Verborgenen geschehen. Darum machen wir den Ausbau der Rechenzentren mit unserer Karte für alle sichtbar.\nAlle Informationen zu Quellen und Methodik gibt es in den FAQ.",
    faqUrl: FAQ_HREF,
  },
};

export const StoryOverlay: Component<Props> = (props) => {
  const entry = () => TEXT[props.activeSceneId];
  const isExplore = () => props.activeSceneId === "explore";

  return (
    <Show when={!isExplore() && entry()}>
      {(e) => (
        <div class="story-overlay" aria-live="polite">
          <header class="story-overlay__header">
            <div class="story-overlay__heading">
              <Show when={e().title}>
                <h1 class="story-overlay__title">{e().title}</h1>
              </Show>
            </div>
            <button
              type="button"
              class="story-overlay__close"
              aria-label="Einführung beenden"
              title="Einführung beenden"
              onClick={() => props.onOpenExplore()}
            >
              <svg
                class="story-overlay__close-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </header>
          <div class="story-overlay__content">
            <p class="story-overlay__body">{storyBodyContent(e())}</p>
            <div class="story-overlay__actions">
              <Show when={props.canGoPrev}>
                <button
                  type="button"
                  class="button"
                  onClick={() => props.onPrev()}
                >
                  Zurück
                </button>
              </Show>
              <Show when={props.canGoNext}>
                <button
                  type="button"
                  class="button"
                  onClick={() => props.onNext()}
                >
                  Weiter
                </button>
              </Show>
              <Show when={props.activeSceneId === "outroFaq"}>
                <button
                  type="button"
                  class="button"
                  onClick={() => props.onOpenExplore()}
                >
                  Karte interaktiv erkunden
                </button>
              </Show>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
};
