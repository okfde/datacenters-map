# Heiße-Luft-Karte

*Map of data centers in Germany*

https://okfde.github.io/datacenters-map/

data is exported from the [Data Center Database API](https://github.com/LeitmotivDigital/dc-db-client)
via [`lm-dc-db-client`](https://www.npmjs.com/package/lm-dc-db-client).

## Setup

```bash
pnpm install
cp .env.example .env.local
# set BASE_URL and API_KEY
```

## Data pipeline

```bash
pnpm build:data   # → public/data/datacenters.geojson + datacenters.csv
```

Exports records whose `data_source` is `Data Center Rebellion (Germany dataset)` and that have coordinates (active and dismissed). Operational sites additionally need a `commissioning_date` year ≥ 2026.

A scheduled GitHub Actions workflow runs `pnpm build:data` daily (00:00 UTC). It commits and redeploys only when the GeoJSON/CSV content changed (ignoring `fetched_at`). Requires repository secrets `BASE_URL` and `API_KEY`.

## Dev / build

```bash
pnpm dev
pnpm build
```

## URL parameters

| Param | Values | Effect |
|-------|--------|--------|
| `start` | `cover` (default), `story` / `intro`, `explore` | Entry mode |
| `scene` | `intro`, `status`, `energy`, `energyGas`, `water`, `waterStress`, `waterBaruth`, `bigtech`, `bigtechSearch`, `protests`, `protestsLayer`, `outro`, `outroFaq` | Story scene |
| `status` | comma list | Filter `operational_status` (`unknown` = null) |
| `protest` | `1` / `0` | Protest sites only |
| `view` | `icon` (default) / `floor` / `site` / `power` | Clustered rack icons, circle by building area (ha), site area (ha), or power |
| `q` | text | Search |
| `feature` | UUID | Open detail panel |

