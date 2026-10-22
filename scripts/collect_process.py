#!/usr/bin/env python3
"""NASS processing / dry-bean farm-gate + BLS retail substitutes → process.json.

Fresh cartons rarely have a pit. Frozen, dried, juice, and paste often print
as a processor $/ton (NASS, usually a marketing year), a monthly dry-bean
tape, FCOJ futures, or a BLS grocery average. Different SKU than the carton.
"""
from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NASS = "https://quickstats.nass.usda.gov/api/api_GET/"
BLS = "https://api.bls.gov/publicAPI/v2/timeseries/data/"
UA = "BushelCompass/1.0"
MONTH = {n: i for i, n in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], 1)}
BLS_MONTH = {f"M{i:02d}": i for i in range(1, 13)}


def data_dir() -> Path:
    src = ROOT / "src" / "data"
    if src.exists():
        return src
    d = ROOT / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d


OUT = data_dir() / "process.json"

# (id, crop label, commodity_desc, short_desc, freq, unit-key)
# unit-key: lb | cwt | ton | box90  → usd / lb
NASS_SERIES = [
    ("apples_process", "Apples", "APPLES",
     "APPLES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("tomatoes_process", "Tomatoes", "TOMATOES",
     "TOMATOES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("potatoes_process", "Potatoes", "POTATOES",
     "POTATOES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / CWT", "ANNUAL", "cwt"),
    ("strawberries_process", "Strawberries", "STRAWBERRIES",
     "STRAWBERRIES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / CWT", "ANNUAL", "cwt"),
    ("grapes_process", "Grapes (Table)", "GRAPES",
     "GRAPES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("peaches_process", "Peaches", "PEACHES",
     "PEACHES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("pears_process", "Pears", "PEARS",
     "PEARS, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("plums_process", "Plums", "PLUMS",
     "PLUMS, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("cherries_sweet_process", "Cherries", "CHERRIES",
     "CHERRIES, SWEET, PROCESSING - PRICE RECEIVED, MEASURED IN $ / TON", "ANNUAL", "ton"),
    ("cherries_tart_process", "Cherries", "CHERRIES",
     "CHERRIES, TART, PROCESSING - PRICE RECEIVED, MEASURED IN $ / LB", "ANNUAL", "lb"),
    ("beans_dry", "Beans", "BEANS",
     "BEANS, DRY EDIBLE, (EXCL CHICKPEAS) - PRICE RECEIVED, MEASURED IN $ / CWT", "MONTHLY", "cwt"),
    ("oranges_process", "Oranges", "ORANGES",
     "ORANGES, PROCESSING - PRICE RECEIVED, MEASURED IN $ / BOX, ON TREE EQUIV", "MONTHLY", "box90"),
]

BLS_SERIES = [
    {"id": "APU0000711211", "key": "bananas_retail", "crop": "Bananas", "kind": "fresh",
     "label": "Bananas, grocery average", "unit": "usdLb"},
    {"id": "APU0000711311", "key": "oranges_retail", "crop": "Oranges", "kind": "fresh",
     "label": "Navel oranges, grocery average", "unit": "usdLb"},
    {"id": "APU0000712112", "key": "potatoes_retail", "crop": "Potatoes", "kind": "fresh",
     "label": "White potatoes, grocery average", "unit": "usdLb"},
    {"id": "APU0000712211", "key": "lettuce_retail", "crop": "Lettuce", "kind": "fresh",
     "label": "Iceberg lettuce, grocery average", "unit": "usdLb"},
    {"id": "APU0000712311", "key": "tomatoes_retail", "crop": "Tomatoes", "kind": "fresh",
     "label": "Field tomatoes, grocery average", "unit": "usdLb"},
    {"id": "APU0000713111", "key": "oj_frozen_retail", "crop": "Oranges", "kind": "frozen",
     "label": "Frozen orange-juice concentrate (per 16 oz)", "unit": "usdPer16oz"},
    {"id": "APU0000714221", "key": "corn_canned_retail", "crop": "Sweet Corn", "kind": "canned",
     "label": "Canned corn, grocery average", "unit": "usdLb"},
    {"id": "APU0000714233", "key": "beans_dry_retail", "crop": "Beans", "kind": "dried",
     "label": "Dried beans, grocery average", "unit": "usdLb"},
    {"id": "APU0000FN1101", "key": "apples_retail", "crop": "Apples", "kind": "fresh",
     "label": "Apples, grocery average", "unit": "usdLb"},
    {"id": "APU0000FS1101", "key": "berries_retail", "crop": "Strawberries", "kind": "fresh",
     "label": "Strawberries, grocery average", "unit": "usdLb"},
]

# Crop → substitute forms. series keys point at NASS or BLS keys above.
CROPS = {
    "Apples": {
        "read": "Juice apples are a public $/ton. Dried snack slices are a private plant. Extra-fancy Honeycrisp is not either of those.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh carton", "tape": "fresh"},
            {"id": "juice", "kind": "juice", "label": "Juice / peeler stock", "nass": "apples_process",
             "honest": "NASS processing, marketing year. Culls and peelers — not extra-fancy."},
            {"id": "dried", "kind": "dried", "label": "Dried slices", "tape": "none",
             "honest": "No public dried-apple tape. Snack plants quote privately."},
        ],
    },
    "Strawberries": {
        "read": "IQF / jam berries print as NASS processing. A clamshell is a different desk. No public IQF FOB.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh clamshell", "tape": "fresh"},
            {"id": "frozen", "kind": "frozen", "label": "IQF / processing", "nass": "strawberries_process",
             "honest": "NASS processing cwt. The raw that goes into a freezer or jam kettle, not a Driscoll clamshell."},
        ],
    },
    "Grapes (Table)": {
        "read": "Crush / juice grapes print as NASS processing $/ton (wine and juice mashed together). Raisin plants do not print a separate monthly tape here.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Table lug", "tape": "fresh"},
            {"id": "juice", "kind": "juice", "label": "Juice / wine crush", "nass": "grapes_process",
             "honest": "NASS processing $/ton. Mostly California crush, not a Thompson seedless carton."},
            {"id": "dried", "kind": "dried", "label": "Raisins", "tape": "none",
             "honest": "Raisin bargaining is a co-op. No monthly public raisin pit on this desk."},
        ],
    },
    "Peaches": {
        "read": "Canning peaches are a public $/ton. Fresh extra-fancy is a short summer window.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh carton", "tape": "fresh"},
            {"id": "canned", "kind": "canned", "label": "Canning / process", "nass": "peaches_process",
             "honest": "NASS processing $/ton. Cling canning stock, not a tree-ripe tray."},
        ],
    },
    "Pears": {
        "read": "Bartlett process vs Anjou fresh. Processing prints yearly.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh carton", "tape": "fresh"},
            {"id": "canned", "kind": "canned", "label": "Canning / process", "nass": "pears_process",
             "honest": "NASS processing $/ton. Canners, not extra-fancy Anjou."},
        ],
    },
    "Tomatoes": {
        "read": "California paste is the most transparent tomato tape after AMS fresh FOB. It is not a greenhouse cluster.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh round / cluster", "tape": "fresh"},
            {"id": "process", "kind": "process", "label": "Paste / dice plant", "nass": "tomatoes_process",
             "honest": "NASS processing $/ton (California paste). A 2025 marketing-year floor, not Nogales vine-ripe."},
            {"id": "canned", "kind": "canned", "label": "Canned tomatoes", "tape": "none",
             "honest": "BLS used to print canned tomatoes; that grocery series is dead. Use paste farm-gate plus a plant quote."},
        ],
    },
    "Potatoes": {
        "read": "Fry / chip stock prints as NASS processing. Frozen fries no longer have a BLS grocery average (ended 2005). Lamb Weston (LW) is the listed weather.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Tablestock", "tape": "fresh"},
            {"id": "process", "kind": "process", "label": "Fry / chip stock", "nass": "potatoes_process",
             "honest": "NASS processing cwt. Contract russets into a plant, not a 50-lb table bag."},
            {"id": "frozen", "kind": "frozen", "label": "Frozen fries", "listed": ["LW"],
             "honest": "BLS frozen-fry grocery average ended in 2005. The public weather is Lamb Weston, not a fry FOB."},
        ],
    },
    "Onions": {
        "read": "Dehydrated onion is a real industrial market with no public pit. Fresh storage onions print NASS + AAFC.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Yellow storage", "tape": "fresh"},
            {"id": "dried", "kind": "dried", "label": "Dehydrated", "tape": "none",
             "honest": "Dehy plants (California / Idaho) quote privately. No NASS dehydrated series on this desk."},
        ],
    },
    "Broccoli": {
        "read": "IQF florets are a plant quote. Fresh crowns print NASS + AAFC.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Crown carton", "tape": "fresh"},
            {"id": "frozen", "kind": "frozen", "label": "IQF florets", "tape": "none",
             "honest": "No public IQF broccoli FOB. Frozen mixed-veg is a private packer."},
        ],
    },
    "Carrots": {
        "read": "Juice / jumbo vs cello. Grimmway / Bolthouse are private.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Cello / fresh", "tape": "fresh"},
            {"id": "juice", "kind": "juice", "label": "Jumbo / juice", "tape": "none",
             "honest": "No public carrot-juice tape. Two private firms dominate US fresh carrots."},
        ],
    },
    "Cucumbers": {
        "read": "Pickle stock vs slicer vs English greenhouse — three businesses.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Slicer / English", "tape": "fresh"},
            {"id": "process", "kind": "process", "label": "Pickle stock", "tape": "none",
             "honest": "No current NASS pickle series on this desk. Brine plants quote privately."},
        ],
    },
    "Beans": {
        "read": "Dry edible beans are one of the few produce substitutes with a real monthly public tape — storable, reported, comparable. Snap beans are a fresh carton.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Snap / fresh", "tape": "fresh"},
            {"id": "dried", "kind": "dried", "label": "Dry edible", "nass": "beans_dry", "bls": "beans_dry_retail",
             "honest": "NASS dry-bean farm-gate, monthly. BLS grocery dried beans is the retail end. This is what transparent looks like."},
        ],
    },
    "Sweet Corn": {
        "read": "Canned corn still prints a BLS grocery average. Fresh sweet corn is a short window.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh ear", "tape": "fresh"},
            {"id": "canned", "kind": "canned", "label": "Canned corn", "bls": "corn_canned_retail",
             "honest": "BLS canned corn, grocery average, monthly. Not a fresh ear, not a frozen cob."},
            {"id": "frozen", "kind": "frozen", "label": "Frozen cut / cob", "tape": "none",
             "honest": "No public IQF sweet-corn FOB on this desk."},
        ],
    },
    "Oranges": {
        "read": "Frozen concentrated orange juice is the only fruit with a real futures pit (OJ=F). Fresh navels are a carton. Do not mix them.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh navel / Valencia", "tape": "fresh"},
            {"id": "juice", "kind": "juice", "label": "Processing oranges", "nass": "oranges_process",
             "honest": "NASS on-tree equivalent $/box (~90 lb). Juice fruit, not a gift carton."},
            {"id": "frozen", "kind": "frozen", "label": "FCOJ (frozen concentrate)", "bls": "oj_frozen_retail",
             "listed": ["OJ=F", "ALCO"],
             "honest": "ICE FCOJ futures plus BLS frozen-concentrate grocery average. Not a fresh navel."},
        ],
    },
    "Plums": {
        "read": "Prune / drying stock vs fresh plum. Processing prints yearly.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh plum", "tape": "fresh"},
            {"id": "dried", "kind": "dried", "label": "Prune / drying stock", "nass": "plums_process",
             "honest": "NASS plum processing $/ton. Not a fresh black plum lug."},
        ],
    },
    "Cherries": {
        "read": "Tart cherries for pie/IQF print in $/lb. Sweet fresh is a short June desk.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Sweet fresh", "tape": "fresh"},
            {"id": "frozen", "kind": "frozen", "label": "Tart / IQF / pie", "nass": "cherries_tart_process",
             "honest": "NASS tart processing $/lb. Pie and IQF, not a Northwest sweet lug."},
            {"id": "process", "kind": "process", "label": "Sweet brining / process", "nass": "cherries_sweet_process",
             "honest": "NASS sweet processing $/ton."},
        ],
    },
    "Lettuce": {
        "read": "Fresh-cut kits are not frozen lettuce. There is no public IQF iceberg tape.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Head / leaf", "tape": "fresh"},
            {"id": "frozen", "kind": "frozen", "label": "Fresh-cut kit (not frozen)", "tape": "none",
             "honest": "Kits are a plant SKU (Taylor / Fresh Express, private). Frozen lettuce is a niche. Watch SYY, not a freezer print."},
        ],
    },
    "Bananas": {
        "read": "Chips / puree are private. Fresh bananas are the only produce with a real world pink-sheet cousin — still not a pit.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh ripe", "tape": "fresh"},
            {"id": "dried", "kind": "dried", "label": "Chips / puree", "tape": "none",
             "honest": "Banana chips and puree are industrial quotes. Dole / Del Monte (DMC) are the listed weather."},
        ],
    },
    "Garlic": {
        "read": "Dehydrated garlic is a large industrial market (China) with no clean public pit on this desk.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh bulb", "tape": "fresh"},
            {"id": "dried", "kind": "dried", "label": "Dehydrated", "tape": "none",
             "honest": "Dehy garlic is China industrial. No monthly USDA dehydrated series here."},
        ],
    },
    "Blueberries": {
        "read": "IQF blueberries are a real trade. USDA does not print a clean monthly IQF FOB on this desk.",
        "forms": [
            {"id": "fresh", "kind": "fresh", "label": "Fresh clamshell", "tape": "fresh"},
            {"id": "frozen", "kind": "frozen", "label": "IQF", "tape": "none",
             "honest": "IQF is a plant and import quote (Chile / Peru / GA). No NASS processing series pulled here."},
        ],
    },
}

DEFAULT_CROP = {
    "read": "No listed frozen or dried public tape for this carton. IQF and dehy are plant quotes. Use fresh farm + AAFC wholesale, and do not pretend a freezer FOB exists.",
    "forms": [
        {"id": "fresh", "kind": "fresh", "label": "Fresh", "tape": "fresh"},
        {"id": "frozen", "kind": "frozen", "label": "Frozen / IQF", "tape": "none",
         "honest": "No public IQF FOB for this item on the desk."},
        {"id": "dried", "kind": "dried", "label": "Dried / dehydrated", "tape": "none",
         "honest": "No public dehydrated tape for this item on the desk."},
    ],
}

THESIS = (
    "Frozen, dried, juice, and paste are often more transparent than a fresh carton "
    "because they store, processors report a $/ton, dry beans print monthly, and FCOJ "
    "has a futures pit. They are not the carton. A juice apple is not extra-fancy; "
    "paste is not a greenhouse cluster; FCOJ is not a navel."
)

DISCLAIMER = (
    "NASS processing is usually a marketing year, national, all grades of processing fruit. "
    "BLS is a US grocery average, not a GTA invoice. AAFC is a destination ask. "
    "AMS shipping-point FOB is still the real fresh trade tape and is not scraped here."
)


def load_key() -> str:
    env = os.environ.get("NASS_API_KEY") or os.environ.get("USDA_NASS_API_KEY")
    if env:
        return env.strip()
    for p in (ROOT / "secrets" / "nass_key.txt", ROOT / "artifacts" / "produce-tracker" / "secrets" / "nass_key.txt"):
        if p.exists():
            return p.read_text().strip()
    raise SystemExit("Set NASS_API_KEY")


def fx_rate() -> float:
    try:
        req = urllib.request.Request("https://open.er-api.com/v6/latest/USD", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=20) as r:
            return float(json.loads(r.read().decode())["rates"]["CAD"])
    except Exception:
        nass = data_dir() / "nass_farm.json"
        if nass.exists():
            return float(json.loads(nass.read_text()).get("fxUsdCad") or 1.3863)
        return 1.3863


def to_usd_lb(raw: float, unit: str) -> float:
    if unit == "lb":
        return raw
    if unit == "cwt":
        return raw / 100.0
    if unit == "ton":
        return raw / 2000.0
    if unit == "box90":
        return raw / 90.0
    return raw


def parse_val(v) -> float | None:
    v = str(v or "").replace(",", "").strip()
    if v in ("", "(D)", "(NA)", "(Z)", "(S)", "-"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def nass_get(key: str, **params) -> dict:
    q = dict(key=key, format="JSON")
    q.update(params)
    url = NASS + "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


def collect_nass(key: str, sid: str, crop: str, cmd: str, short: str, freq: str, unit: str, fx: float) -> dict:
    d = nass_get(key, commodity_desc=cmd, statisticcat_desc="PRICE RECEIVED",
                 agg_level_desc="NATIONAL", short_desc=short, freq_desc=freq)
    pts = []
    for row in d.get("data") or []:
        raw = parse_val(row.get("Value"))
        if raw is None:
            continue
        year = int(row["year"])
        period = row.get("reference_period_desc") or ""
        if freq == "MONTHLY":
            m = MONTH.get(period)
            if not m:
                continue
            day = f"{year}-{m:02d}-01"
        else:
            m = 12
            day = f"{year}-12-01"
        usd = to_usd_lb(raw, unit)
        pts.append({
            "y": year, "m": m, "d": day, "raw": raw, "usdLb": round(usd, 4),
            "cadKg": round(usd * 2.20462 * fx, 3), "period": period,
        })
    pts.sort(key=lambda x: (x["y"], x["m"]))
    keep = pts[-36:] if freq == "MONTHLY" else pts[-20:]
    latest = keep[-1] if keep else None
    return {
        "id": sid, "crop": crop, "short": short, "freq": freq, "unit": unit,
        "n": len(pts), "monthly": keep, "latest": latest,
        "label": short.split(" - ")[0].title() if " - " in short else sid,
    }


def collect_bls(fx: float) -> dict:
    ids = [s["id"] for s in BLS_SERIES]
    payload = json.dumps({"seriesid": ids, "startyear": "2024", "endyear": "2026"}).encode()
    req = urllib.request.Request(BLS, data=payload, headers={"Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        data = json.loads(r.read().decode())
    by_id = {s["id"]: s for s in BLS_SERIES}
    out = {}
    for row in data.get("Results", {}).get("series", []):
        meta = by_id.get(row.get("seriesID"))
        if not meta:
            continue
        pts = []
        for p in row.get("data") or []:
            val = parse_val(p.get("value"))
            if val is None:
                continue
            year = int(p["year"])
            m = BLS_MONTH.get(p.get("period") or "", 0)
            if not m:
                continue
            usd_lb = val  # 16oz series is quoted per 16 oz ≈ 1 lb of that unit
            pts.append({
                "y": year, "m": m, "d": f"{year}-{m:02d}-01",
                "usdLb": round(usd_lb, 4), "cadKg": round(usd_lb * 2.20462 * fx, 3),
            })
        pts.sort(key=lambda x: (x["y"], x["m"]))
        pts = pts[-24:]
        out[meta["key"]] = {
            **{k: meta[k] for k in ("id", "crop", "kind", "label", "unit")},
            "n": len(pts), "monthly": pts, "latest": pts[-1] if pts else None,
        }
    return out


def main() -> None:
    key = load_key()
    fx = fx_rate()
    print("process / frozen / dried tapes… fx", fx)
    series = {}
    for sid, crop, cmd, short, freq, unit in NASS_SERIES:
        print(" ", sid, flush=True)
        try:
            series[sid] = collect_nass(key, sid, crop, cmd, short, freq, unit, fx)
            last = series[sid]["latest"]
            print("   ", last["d"] if last else "—", last["cadKg"] if last else "")
        except Exception as e:
            print("   fail", type(e).__name__, e)
            series[sid] = {"id": sid, "crop": crop, "short": short, "latest": None, "monthly": [], "n": 0}
    print(" BLS grocery averages…", flush=True)
    try:
        bls = collect_bls(fx)
        for k, v in bls.items():
            last = v.get("latest")
            print("  ", k, last["d"] if last else "—", last["cadKg"] if last else "")
    except Exception as e:
        print("  bls fail", e)
        bls = {}
    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "USDA NASS prices received (processing / dry beans) + BLS average price (grocery).",
        "fxUsdCad": round(fx, 6),
        "thesis": THESIS,
        "disclaimer": DISCLAIMER,
        "series": series,
        "bls": bls,
        "crops": CROPS,
        "defaultCrop": DEFAULT_CROP,
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print("wrote", OUT, "nass", sum(1 for s in series.values() if s.get("latest")), "bls", sum(1 for s in bls.values() if s.get("latest")))


if __name__ == "__main__":
    main()
