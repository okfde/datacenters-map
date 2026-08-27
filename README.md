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

Exports records whose `data_source` is `Data Center Rebellion (Germany dataset)` and that have coordinates. Operational sites additionally need a `commissioning_date` year ≥ 2026.

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
| `size` | `floor` / `power` / `icon` | Circle by area, by power, or clustered rack icons |
| `q` | text | Search |
| `feature` | UUID | Open detail panel |

