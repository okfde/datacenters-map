import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DataCenterClient } from "lm-dc-db-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, "../..");

function parseDotEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export async function loadDotEnvFiles(): Promise<void> {
  for (const name of [".env", ".env.local"]) {
    try {
      const raw = await fs.readFile(path.join(ROOT, name), "utf8");
      const parsed = parseDotEnv(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (process.env[k] === undefined) process.env[k] = v;
      }
    } catch {
    }
  }
}

export function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing env var: ${name}`);
  return String(v).trim();
}

export function createClient(): DataCenterClient {
  return new DataCenterClient({
    baseUrl: requiredEnv("BASE_URL"),
    apiKey: requiredEnv("API_KEY"),
  });
}

export function countryFilter(): string {
  return (process.env.COUNTRY ?? "Germany").trim();
}

export function hasCoords(lat: number | null | undefined, lon: number | null | undefined): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
