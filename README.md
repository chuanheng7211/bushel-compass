# Bushel Compass

Public-data desk for fresh produce. The main page is what the files say about a carton: farm, Vancouver dest, AMS truck, origin, grocery, listed names, world.

**Not a flyer scrape. Not a cleared trade.** USDA NASS, AAFC InfoHort, FAO, BLS, AMS refrigerated truck, delayed Yahoo.

## Live

**[Open the desk](https://chuanheng7211.github.io/bushel-compass/)**

That is the public site (GitHub Pages). Source: this repo. Vercel is not linked yet.

## On the desk

- **Compass** — farm, dest, implied origin FOB (dest − AMS truck), grocery, listed names
- **Tape check** — paste a case book in the session. Hold / lock / counter / walk. The raw list is not stored
- **Source map** — seasonal lanes plus this week’s dest mix and truck
- **Sales chain** — fresh, frozen, dried, juice, plus the combined look
- **Grocery** — type the shelf ticket. Captions live here, not on the homepage
- **World** — FAO + dest + diesel + FX + AMS truck, stacked
- **Markets** — fertilizer, diesel, gas, truck, boat, FX. Delayed Yahoo on the live desk; Pages is the snapshot
- **Industry brief** — how majors bench the stack

## Data

| Source | What | Cadence |
| --- | --- | --- |
| USDA NASS | US farm-gate, all grades | Monthly |
| AAFC InfoHort | Canadian destination wholesale + origin mix | Weekly |
| BLS APU | US city grocery average | Monthly |
| FAO FPI | World food weather around the carton | Monthly |
| AMS truck (AgTransport) | Refrigerated load rates. Implied FOB = dest − truck. Not MARS shipping-point | Weekly |
| Yahoo delayed | Fertilizer, diesel, FX, listed names | ~15 min on a server; snapshot on Pages |

MARS shipping-point FOB is keyed and is not pulled. Grocery banners are modeled markups, not a store flyer. A pasted PO stays in the browser.

GitHub Action **Refresh public produce data** runs Mondays. Set repo secret `NASS_API_KEY` for the farm series.

Auth is off. No database. No ads.
