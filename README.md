# Bushel Compass

Public-data compass for people walking into produce: USDA farm-gate, Canadian wholesale asks, origin map, cost stack, and own-vs-rent.

**Live:** after Vercel deploy, `https://bushel-compass.vercel.app`

## What’s on the desk

- **Compass** — paste a quote, six agents walk it back to farm / FOB / freight / retail
- **Source map** — seasonal lanes into the GTA
- **Dashboard** — regional asks, farm history, value chain, how the majors bench
- **World** — FAO food index, produce belts, public tape vs experience

Data is public: USDA NASS (monthly farm-gate), AAFC InfoHort (weekly wholesale), FAO Food Price Index. Not a cleared trade. AMS shipping-point FOB is still the real North American tape and is not scraped yet.

## Refresh prices

```bash
export NASS_API_KEY=your-quick-stats-key
python3 scripts/refresh-all.py
```

GitHub Action **Refresh public produce data** runs Mondays. Set repo secret `NASS_API_KEY`.

## Local

```bash
npm install
npm run dev
```

Auth is off. No database required.
