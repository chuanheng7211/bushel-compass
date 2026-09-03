# Bushel Compass

Public-data compass for people walking into produce: USDA farm-gate, Canadian wholesale asks, origin map, cost stack, and own-vs-rent.

## Live website

**[Open Bushel Compass](https://chuanheng7211.github.io/bushel-compass/)**

Source: [github.com/chuanheng7211/bushel-compass](https://github.com/chuanheng7211/bushel-compass)

Vercel production URL: [bushel-compass.vercel.app](https://bushel-compass.vercel.app) — auto-deploys from this repo after the Vercel GitHub App is granted access to it.

## What’s on the desk

- **Compass** — paste a quote, six agents walk it back to farm / FOB / freight / retail
- **Source map** — seasonal lanes into the GTA
- **Dashboard** — regional asks, farm history, value chain, how the majors bench
- **World** — FAO food index, produce belts, public tape vs experience

Data is public: USDA NASS (monthly farm-gate), AAFC InfoHort (weekly wholesale), FAO Food Price Index. Not a cleared trade. AMS shipping-point FOB is still the real North American tape and is not scraped yet.

## Refresh prices

GitHub Action **Refresh public produce data** runs Mondays. Set repo secret `NASS_API_KEY`.

Auth is off. No database required.
