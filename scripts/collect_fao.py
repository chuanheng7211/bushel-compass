#!/usr/bin/env python3
"""FAO Food Price Index + world produce tape notes → src/data/world.json"""
import csv, io, json, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def data_dir():
    src = ROOT / "src" / "data"
    if src.exists():
        return src
    d = ROOT / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d
OUT = data_dir() / "world.json"
FAO_CSV = (
    "https://www.fao.org/media/docs/worldfoodsituationlibraries/"
    "default-document-library/food_price_indices_data.csv?sfvrsn=523ebd2a_82"
)


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "BushelCompass/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def parse_fao(raw: bytes):
    text = raw.decode("utf-8-sig", errors="replace")
    rows = []
    started = False
    for rec in csv.reader(io.StringIO(text)):
        if not rec or not rec[0]:
            continue
        if rec[0].strip() == "Date":
            started = True
            continue
        if not started:
            continue
        if not rec[0][:4].isdigit():
            continue
        def num(i):
            try:
                return float(str(rec[i]).replace(",", ""))
            except Exception:
                return None
        d = rec[0].strip()
        if len(d) == 7:
            d = d + "-01"
        rows.append({
            "d": d,
            "food": num(1),
            "meat": num(2),
            "dairy": num(3),
            "cereals": num(4),
            "oils": num(5),
            "sugar": num(6),
        })
    return rows


def yoy(series, key):
    if len(series) < 13:
        return None
    a, b = series[-1].get(key), series[-13].get(key)
    if not a or not b:
        return None
    return round((a / b - 1) * 100, 1)


def main():
    print("FAO Food Price Index…")
    series = parse_fao(get(FAO_CSV))
    last = series[-1] if series else {}
    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "FAO Food Price Index (2014–2016=100)",
        "latest": last,
        "yoy": {
            "food": yoy(series, "food"),
            "cereals": yoy(series, "cereals"),
            "oils": yoy(series, "oils"),
            "sugar": yoy(series, "sugar"),
            "meat": yoy(series, "meat"),
            "dairy": yoy(series, "dairy"),
        },
        "series": series[-120:],
        "note": "FFPI is grains, oils, sugar, meat, dairy — not lettuce. Use it as the freight-and-feed weather around fresh produce, not as a carton print.",
        "tapes": [
            {"id": "ams", "name": "USDA AMS Market News", "what": "Daily shipping-point and terminal FOB by pack. The actual North American trade tape.", "cadence": "daily", "fresh": True},
            {"id": "nass", "name": "USDA NASS Agricultural Prices", "what": "Monthly national farm-gate. Floor under FOB. Too coarse for a PO.", "cadence": "monthly", "fresh": True},
            {"id": "aafc", "name": "AAFC InfoHort wholesale", "what": "Canadian city asking ranges. Destination, not origin.", "cadence": "weekly", "fresh": True},
            {"id": "fao", "name": "FAO Food Price Index", "what": "World staples. Bananas are closer to this world than iceberg is.", "cadence": "monthly", "fresh": True},
            {"id": "pink", "name": "World Bank pink sheet", "what": "Bananas, oranges, sugar. One of the few listed produce prices.", "cadence": "monthly", "fresh": False},
            {"id": "faostat", "name": "FAOSTAT producer prices", "what": "National farm-gate, 160+ countries, lagged a year. Good for 'what did Chile get paid', not for this week's boat.", "cadence": "annual / lagged monthly", "fresh": False},
            {"id": "comtrade", "name": "UN Comtrade unit values", "what": "Value / kg on the customs declaration. Too late for a bid, useful for 'what did Canada actually pay Peru last year'.", "cadence": "monthly, lagged", "fresh": False},
            {"id": "defra", "name": "UK Defra wholesale", "what": "Home-grown UK wholesale averages. Europe analog to AAFC.", "cadence": "weekly", "fresh": False},
            {"id": "experience", "name": "Your PO book", "what": "Landed, shrink, claims, pack-out. This is what Sysco actually lives on.", "cadence": "every load", "fresh": True},
        ],
        "belts": [
            {"belt": "US West / desert", "who": "Salinas, Yuma, Yakima, Idaho", "feeds": "North America year-round veg + storage fruit", "clock": "truck 2–5 days"},
            {"belt": "Mexico winter", "who": "Sinaloa, Baja, Jalisco", "feeds": "US/Canada tomatoes, berries, cukes, asparagus Nov–May", "clock": "truck 3–6 days via Nogales / McAllen"},
            {"belt": "Andes counter-season", "who": "Chile, Peru", "feeds": "Grapes, blueberries, asparagus, avocados to NA/EU/Asia when the north is dark", "clock": "16–22 days sea"},
            {"belt": "Oceania", "who": "New Zealand, Australia", "feeds": "Apples, kiwifruit, counter-season pipfruit", "clock": "21–28 days sea"},
            {"belt": "EU winter", "who": "Spain, Morocco, Netherlands GH", "feeds": "EU + UK. Netherlands is a re-export machine, not a field.", "clock": "truck / short sea"},
            {"belt": "Tropical banana", "who": "Ecuador, Philippines, Costa Rica, Colombia", "feeds": "The only produce with a real world price (pink sheet)", "clock": "boat + ripening room"},
            {"belt": "China apples", "who": "Shandong / Shaanxi", "feeds": "World's largest apple crop. Presses the juice/process market more than extra-fancy GTA.", "clock": "process / export"},
            {"belt": "Ontario / Almería GH", "who": "Leamington, Almería", "feeds": "High-spec tomato/cuke/pepper. Sell spec against Mexico/Morocco floor.", "clock": "local / EU truck"},
        ],
        "conditions": [
            {"t": "Fresh is not a futures pit", "d": "Wheat, corn, soy, FCOJ, sugar, and (sort of) bananas have a listed world price. Iceberg, berries, and greenhouse tomatoes do not. The 'world price' is a district FOB this morning plus a boat."},
            {"t": "Hemispheres are the inventory", "d": "When Washington apples are in storage, Chile and NZ are the fresh alternative — not a cheaper Yakima. Counter-season is a different clock and a different risk (duty, arrival, claims)."},
            {"t": "Freight is a crop", "d": "Reefer rates, Red Sea diversion, Panama, and diesel move landed GTA as much as the farm print. A cheap FOB in Chile with a tight boat is not cheap."},
            {"t": "Climate shows up as a district, not an index", "d": "A freeze in Sinaloa or a heat spike in Salinas reprices that SKU in 72 hours. FAO's monthly food index will not tell you in time. AMS will."},
            {"t": "Programs beat spots for volume", "d": "Dole, Driscoll, Taylor, Sysco buy on a schedule: AMS FOB ± a grid, or a kit price. Spot AAFC is what you use when you are short or entering."},
            {"t": "Experience is shrink and spec", "d": "Two cartons with the same FOB are not the same deal if pack-out, pressure bruises, or days-to-GTA differ. Public data has no column for that. Your receiving log does."},
        ],
        "howToUse": [
            "Start with the in-season belt (source map), not the cheapest FOB on a PDF.",
            "NASS / FAOSTAT = floor. AMS / AAFC = ask. Your landed + shrink = the only number that matters.",
            "If FAO food index is ripping on oils and cereals, expect freight and packing costs up even if lettuce farm-gate is quiet.",
            "Bananas and orange juice can be checked on the pink sheet. Everything else is a district.",
            "Keep a book of your last 20 POs by origin and spec. That book beats any dashboard once you have it.",
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload))
    print("wrote", OUT, "points", len(payload["series"]), "latest", last)


if __name__ == "__main__":
    main()
