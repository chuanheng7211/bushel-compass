# Bushel Compass

Public-data desk for fresh produce. Paste a quote — or a grocery ticket — and walk it back to USDA farm-gate, Canadian wholesale, origin season, and whether you should own or rent the layer.

**Not a flyer scrape. Not a cleared trade.** USDA NASS, AAFC InfoHort, FAO, BLS grocery averages, delayed listed names.

## Live

**[Open the desk](https://chuanheng7211.github.io/bushel-compass/)**

**[Grocery tracker + Instagram / 小红书 cards](https://chuanheng7211.github.io/bushel-compass/grocery/)**

That is the public site (GitHub Pages). Source: this repo.

Vercel is **not** serving this project yet. `bushel-compass.vercel.app` will go live after the Vercel GitHub App is granted on this repository.

## On the desk

- **Compass** — paste a quote; six agents walk farm / FOB / freight / wholesale / retail
- **Source map** — seasonal origin lanes into the GTA, year rail, country clock
- **Sales chain** — regional asks, farm history, frozen/dried/juice as substitutes
- **Grocery** — type the shelf ticket. Bench it vs warehouse / discount / conventional / premium / farm stand. Copy a caption for Instagram or 小红书
- **World** — FAO food index, produce belts, public tape vs a receiving dock
- **Markets** — listed growers, fertilizer, truck, boat, cold rooms (OJ juice futures, not a navel carton)
- **Industry brief** — how majors actually bench the stack

## Data

| Source | What | Cadence |
| --- | --- | --- |
| USDA NASS | US farm-gate, all grades | Monthly |
| AAFC InfoHort | Canadian destination wholesale + origin mix | Weekly |
| BLS APU | US city grocery average | Monthly |
| FAO FPI | World food weather around the carton | Monthly |

AMS shipping-point FOB is the real North American trade tape and is not scraped yet. Grocery banners are modeled GTA markups on the public wholesale tape — not a store flyer.

GitHub Action **Refresh public produce data** runs Mondays. Set repo secret `NASS_API_KEY` for the farm series.

Auth is off. No database. No ads.

## Use it

1. Open the [grocery desk](https://chuanheng7211.github.io/bushel-compass/grocery/).
2. Pick a crop. Type the ticket you saw. Compare to BLS and the warehouse band.
3. Copy the Instagram or 小红书 caption. Download the 4:5 card.

If you buy or sell produce and the public tape would help, open an issue with the crop and the city.
