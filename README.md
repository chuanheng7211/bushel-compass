# Bushel Compass

Public-data desk for fresh produce. Paste a quote — or later, a grocery ticket — and walk it back to USDA farm-gate, Canadian wholesale, origin season, and whether you should own or rent the layer.

**Not a flyer scrape. Not a cleared trade.** USDA NASS, AAFC InfoHort, FAO, delayed listed names.

## Live

**[Open the desk](https://chuanheng7211.github.io/bushel-compass/)**

That is the public site today (GitHub Pages). The source is this repo.

Vercel is **not** serving this project yet. `bushel-compass.vercel.app` will go live after the Vercel GitHub App is granted on this repository.

## On the desk

- **Compass** — paste a quote; six agents walk farm / FOB / freight / wholesale / retail
- **Source map** — seasonal origin lanes into the GTA
- **Sales chain** — regional asks, farm history, frozen/dried/juice as substitutes
- **World** — FAO food index, produce belts, public tape vs a receiving dock
- **Industry brief** — how majors actually bench the stack

Grocery shelf tracker + Instagram / 小红书 cards are in the next ship.

## Data

| Source | What | Cadence |
| --- | --- | --- |
| USDA NASS | US farm-gate, all grades | Monthly |
| AAFC InfoHort | Canadian destination wholesale + origin mix | Weekly |
| FAO FPI | World food weather around the carton | Monthly |

AMS shipping-point FOB is the real North American trade tape and is not scraped yet.

GitHub Action **Refresh public produce data** runs Mondays. Set repo secret `NASS_API_KEY` for the farm series.

Auth is off. No database. No ads.

## Use it

1. Open the live desk.
2. Pick a crop. Read farm vs Vancouver wholesale.
3. Play the source map if you care who packed this week.

If you buy or sell produce and the public tape would help, open an issue with the crop and the city.
