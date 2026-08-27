import type { DataCenterTag, Source } from "lm-dc-db-client";

type ParsedSource = { label: string; url: string };

const GENERIC_LABELS = new Set([
  "protest",
  "open petition",
  "petition",
  "civil action",
]);

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\s*\((https?:\/\/[^)\s]+)\)/gi;
const BARE_URL_RE = /https?:\/\/[^\s;)>\]]+/gi;

function normalizeUrl(raw: string): string {
  return raw.trim().replace(/[),.;\]]+$/u, "");
}

function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hostnameLabel(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function isGenericLabel(label: string): boolean {
  return GENERIC_LABELS.has(label.trim().toLowerCase());
}

function resolveLabel(
  label: string,
  url: string,
  sources: Source[],
): string {
  const cleanUrl = normalizeUrl(url);
  const src = sources.find(
    (s) => normalizeUrl(s.url).toLowerCase() === cleanUrl.toLowerCase(),
  );
  const fromSource =
    src?.publication_name?.trim() || src?.archived_title?.trim() || "";
  if (fromSource && !isGenericLabel(fromSource)) return fromSource;

  const trimmed = label.trim();
  if (trimmed && !isGenericLabel(trimmed)) return trimmed;

  return hostnameLabel(cleanUrl);
}

function extractLinksFromText(text: string, sources: Source[]): ParsedSource[] {
  const found: ParsedSource[] = [];
  const seen = new Set<string>();

  const add = (label: string, url: string) => {
    const cleanUrl = normalizeUrl(url);
    if (!isHttpUrl(cleanUrl)) return;
    const key = cleanUrl.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push({
      label: resolveLabel(label, cleanUrl, sources),
      url: cleanUrl,
    });
  };

  let remainder = text;
  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    add(match[1] ?? "", match[2] ?? "");
    remainder = remainder.replace(match[0], " ");
  }

  for (const match of remainder.matchAll(BARE_URL_RE)) {
    add("", match[0]);
  }

  return found;
}

export function buildProtestSourcesFromTags(
  tags: DataCenterTag[] | undefined,
  sources: Source[] | undefined,
  isProtestTag: (type: string) => boolean,
): ParsedSource[] {
  const sourceList = sources ?? [];
  const all: ParsedSource[] = [];
  const seen = new Set<string>();

  for (const tag of tags ?? []) {
    if (!isProtestTag(tag.type)) continue;

    const note = tag.note?.trim() ?? "";
    const value = tag.value?.trim() ?? "";

    if (note) {
      for (const link of extractLinksFromText(note, sourceList)) {
        const key = link.url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        all.push(link);
      }
      continue;
    }

    if (value && isHttpUrl(value)) {
      const url = normalizeUrl(value);
      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      all.push({
        label: resolveLabel(value, url, sourceList),
        url,
      });
    }
  }

  return all;
}

export function serializeProtestSources(links: ParsedSource[]): string {
  return links
    .filter((l) => {
      try {
        const u = new URL(l.url);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    })
    .map((l) => `${l.label}|${l.url}`)
    .join(" || ");
}
