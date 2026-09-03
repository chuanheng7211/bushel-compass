#!/usr/bin/env python3
"""USDA NASS Quick Stats → src/data/nass_farm.json. Needs NASS_API_KEY."""
import json, os, time, urllib.parse, urllib.request
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

OUT = data_dir() / "nass_farm.json"
BASE = "https://quickstats.nass.usda.gov/api/api_GET/"

SERIES = [
    ("apples_fresh", "APPLES", "APPLES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / LB", "$/lb", 1.0),
    ("strawberries_fresh", "STRAWBERRIES", "STRAWBERRIES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("grapes_fresh", "GRAPES", "GRAPES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / TON", "$/ton", 1 / 2000),
    ("peaches_fresh", "PEACHES", "PEACHES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / TON", "$/ton", 1 / 2000),
    ("pears_fresh", "PEARS", "PEARS, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / TON", "$/ton", 1 / 2000),
    ("tomatoes_fresh", "TOMATOES", "TOMATOES, IN THE OPEN, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("lettuce_head", "LETTUCE", "LETTUCE, HEAD, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("potatoes_fresh", "POTATOES", "POTATOES, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("onions_dry", "ONIONS", "ONIONS, DRY, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("broccoli", "BROCCOLI", "BROCCOLI, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("carrots", "CARROTS", "CARROTS, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("cauliflower", "CAULIFLOWER", "CAULIFLOWER, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("celery", "CELERY", "CELERY, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("cucumbers", "CUCUMBERS", "CUCUMBERS, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("beans_snap", "BEANS", "BEANS, SNAP, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("asparagus", "ASPARAGUS", "ASPARAGUS, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("sweet_corn", "SWEET CORN", "SWEET CORN, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
    ("cantaloupe", "MELONS", "MELONS, CANTALOUP, FRESH MARKET - PRICE RECEIVED, MEASURED IN $ / CWT", "$/cwt", 0.01),
]
MONTH = {n: i for i, n in enumerate(
    ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"], 1)}


def load_key():
    env = os.environ.get("NASS_API_KEY") or os.environ.get("USDA_NASS_API_KEY")
    if env:
        return env.strip()
    for p in (ROOT / "secrets" / "nass_key.txt", ROOT / "artifacts" / "produce-tracker" / "secrets" / "nass_key.txt"):
        if p.exists():
            return p.read_text().strip()
    raise SystemExit("Set NASS_API_KEY")


def fx_rate():
    try:
        req = urllib.request.Request("https://open.er-api.com/v6/latest/USD", headers={"User-Agent": "BushelCompass/1.0"})
        with urllib.request.urlopen(req, timeout=20) as r:
            return float(json.loads(r.read().decode())["rates"]["CAD"])
    except Exception:
        return 1.3863


def fetch(key, **params):
    q = dict(key=key, format="JSON")
    q.update(params)
    url = BASE + "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"User-Agent": "BushelCompass/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode())


def parse_val(v):
    v = (v or "").replace(",", "").strip()
    if v in ("", "(D)", "(NA)", "(Z)", "(S)"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def collect_one(key, sid, cmd, short, unit, factor, fx):
    d = fetch(key, commodity_desc=cmd, statisticcat_desc="PRICE RECEIVED",
              agg_level_desc="NATIONAL", short_desc=short, freq_desc="MONTHLY")
    pts = []
    for row in d.get("data", []):
        m = MONTH.get(row.get("reference_period_desc", ""))
        if not m:
            continue
        raw = parse_val(row.get("Value"))
        if raw is None:
            continue
        usd = raw * factor
        pts.append({
            "y": int(row["year"]), "m": m, "d": f"{row['year']}-{m:02d}-01",
            "usdLb": round(usd, 4), "cadKg": round(usd * 2.20462 * fx, 3),
        })
    pts.sort(key=lambda x: (x["y"], x["m"]))
    pts = pts[-120:]
    return {
        "id": sid, "commodity": cmd.title(), "short": short, "unit": unit,
        "nMonthly": len(pts), "monthly": pts, "latest": pts[-1] if pts else None,
    }


def main():
    key = load_key()
    fx = fx_rate()
    out = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "USDA NASS Quick Stats, prices received by growers (national, monthly)",
        "fxUsdCad": fx,
        "series": {},
    }
    for sid, cmd, short, unit, factor in SERIES:
        print("fetch", sid, flush=True)
        try:
            out["series"][sid] = collect_one(key, sid, cmd, short, unit, factor, fx)
            print(" ", out["series"][sid]["nMonthly"], "latest", out["series"][sid]["latest"])
        except Exception as e:
            print("  ERR", e)
        time.sleep(0.25)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out))
    print("wrote", OUT, OUT.stat().st_size)


if __name__ == "__main__":
    main()
