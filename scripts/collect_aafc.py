#!/usr/bin/env python3
"""Rebuild data/market.json from AAFC weekly wholesale prices."""
import csv, json, math, re, urllib.request
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from pathlib import Path

SRC = "https://od-do.agr.gc.ca/WeeklyWholesalePrices_PrixDeGrossistesHebdomadaires55.csv"
FX_URL = "https://open.er-api.com/v6/latest/USD"
ROOT = Path(__file__).resolve().parents[1]

def data_dir():
    src = ROOT / "src" / "data"
    if src.exists():
        return src
    d = ROOT / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d

OUT = data_dir() / "market.json"

FOCUS = {
    "Apples","Avocados","Bananas","Blueberries","Broccoli","Cabbage","Carrots",
    "Cauliflower","Celery","Cherries","Cucumbers","Grapes (Table)","Kale",
    "Lemons","Lettuce","Limes","Mangoes","Melons","Mushrooms","Onions",
    "Oranges","Pears","Peppers","Potatoes","Raspberries","Spinach",
    "Strawberries","Tomatoes","Watermelon","Asparagus","Beans","Beets",
    "Corn","Garlic","Ginger Root","Kiwi Fruit","Nectarines","Peaches",
    "Pineapples","Plums","Radishes","Zucchini",
}
BLS_RETAIL_USD_LB = {
    "Bananas": 0.67, "Oranges": 1.80, "Lemons": 2.05,
    "Strawberries": 3.43, "Potatoes": 1.01, "Lettuce": 1.73,
    "Tomatoes": 1.91, "Apples": 1.75,
}
US_FOB_USD_LB = {
    "Apples": 0.84, "Pears": 0.94, "Nectarines": 1.05, "Peaches": 0.98,
    "Pineapples": 1.30, "Avocados": 0.60, "Mangoes": 1.60, "Limes": 0.66,
    "Oranges": 0.62, "Lemons": 0.76, "Grapes (Table)": 2.07,
    "Blueberries": 3.93, "Raspberries": 2.10, "Strawberries": 3.67,
    "Melons": 0.22, "Watermelon": 0.17, "Tomatoes": 0.89,
    "Broccoli": 0.56, "Cauliflower": 0.70, "Celery": 0.51,
    "Lettuce": 0.35, "Spinach": 0.85, "Potatoes": 0.40,
}
MARKUP = {
    "Bananas": 1.55, "Potatoes": 2.1, "Onions": 2.0, "Carrots": 2.2,
    "Apples": 1.85, "Oranges": 1.9, "Lemons": 2.0, "Limes": 2.1,
    "Tomatoes": 2.15, "Lettuce": 2.4, "Spinach": 2.6, "Kale": 2.5,
    "Broccoli": 2.2, "Cauliflower": 2.2, "Celery": 2.1, "Cucumbers": 2.0,
    "Peppers": 2.15, "Avocados": 1.9, "Strawberries": 2.3, "Blueberries": 2.2,
    "Raspberries": 2.25, "Grapes (Table)": 2.1, "Melons": 2.0, "Watermelon": 2.3,
    "Mushrooms": 2.0, "Mangoes": 2.0, "Pears": 1.9, "default": 2.05,
}


def fx_rate():
    try:
        with urllib.request.urlopen(FX_URL, timeout=20) as r:
            data = json.loads(r.read().decode())
        return float(data["rates"]["CAD"])
    except Exception:
        return 1.3863


def to_kg(row):
    try:
        qty = float(row["PkgQty_QtePqt"] or 1)
    except Exception:
        qty = 1
    try:
        wt = float(row["PkgWt_PdsPqt"] or 0)
    except Exception:
        wt = 0
    unit = (row["UnitMsrEn_QteUnitAn"] or "").strip().lower()
    pkg = row["PkgTypeEn_EmpqtgAn"] or ""
    if wt <= 0:
        m = re.search(r"(\d+(?:\.\d+)?)\s*(LBS|LB|KG|KILO)", pkg, re.I)
        if m:
            wt = float(m.group(1))
            unit = "lbs" if m.group(2).upper().startswith("L") else "kg"
            qty = 1
        else:
            m = re.search(r"(\d+)\s*[Xx]\s*(\d+(?:\.\d+)?)\s*(LB|LBS|KG|OZ)", pkg, re.I)
            if m:
                qty = float(m.group(1))
                wt = float(m.group(2))
                unit = m.group(3).lower()
    if wt <= 0:
        return None
    if unit in ("lb", "lbs"):
        return (qty * wt * 0.45359237) if qty > 1 and wt <= 10 else wt * 0.45359237
    if unit in ("kg", "kgs", "kilo"):
        return (qty * wt) if qty > 1 and wt <= 5 else wt
    if unit in ("oz",):
        return qty * wt * 0.0283495231
    if unit in ("gr", "g"):
        return qty * wt / 1000.0
    return None


def pct(vals, p):
    vals = sorted(vals)
    n = len(vals)
    if n == 1:
        return vals[0]
    i = (n - 1) * p
    lo, hi = int(math.floor(i)), int(math.ceil(i))
    if lo == hi:
        return vals[lo]
    return vals[lo] * (hi - i) + vals[hi] * (i - lo)


def main():
    usd_cad = fx_rate()
    dest = Path("/tmp/aafc55.csv")
    print("downloading AAFC weekly wholesale…")
    urllib.request.urlretrieve(SRC, dest)

    rows_by = defaultdict(list)
    latest_quotes = defaultdict(list)
    with dest.open(newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            cmd = row["CmdtyEn_PrdtAn"]
            if cmd not in FOCUS:
                continue
            centre = row["CentreEn_CentreAn"].replace("Wholesale-", "")
            try:
                lo = float(row["LowPrice_PrixMin"])
                hi = float(row["HighPrice_PrixMax"])
            except Exception:
                continue
            if lo <= 0 or hi <= 0 or hi < lo:
                continue
            kg = to_kg(row)
            if not kg or kg < 0.15 or kg > 80:
                continue
            mid = (lo + hi) / 2
            pkg = mid / kg
            if pkg < 0.15 or pkg > 40:
                continue
            rec = {
                "date": row["Date"],
                "centre": centre,
                "cmd": cmd,
                "var": row["VrtyEn_VrteAn"] or "Unspecified",
                "origin": (row["Cntry_Pays"] or "")
                + (("·" + row["ProvState_ProvEtat"]) if row["ProvState_ProvEtat"] else ""),
                "pkg": round(pkg, 2),
                "lo": round(lo, 2),
                "hi": round(hi, 2),
                "kg": round(kg, 3),
                "mid_pack": round(mid, 2),
            }
            rows_by[(centre, cmd, row["Date"])].append(pkg)
            latest_quotes[(centre, cmd)].append(rec)

    series = defaultdict(list)
    for (centre, cmd, date), vals in rows_by.items():
        series[f"{centre}|{cmd}"].append({
            "d": date,
            "p50": round(pct(vals, 0.5), 2),
            "p20": round(pct(vals, 0.2), 2),
            "p80": round(pct(vals, 0.8), 2),
            "n": len(vals),
        })
    for k in series:
        series[k].sort(key=lambda x: x["d"])

    snap = []
    for (centre, cmd), recs in latest_quotes.items():
        recs.sort(key=lambda x: x["date"], reverse=True)
        maxd = recs[0]["date"]
        cur = [x for x in recs if x["date"] == maxd]
        prices = sorted(x["pkg"] for x in cur)
        p50 = prices[len(prices) // 2]
        hist = series.get(f"{centre}|{cmd}", [])
        wow = None
        if len(hist) >= 2 and hist[-2]["p50"]:
            wow = round((hist[-1]["p50"] - hist[-2]["p50"]) / hist[-2]["p50"] * 100, 1)
        yoy = None
        if hist:
            last = hist[-1]
            want = datetime.strptime(last["d"], "%Y-%m-%d") - timedelta(days=364)
            best, bestd = None, 99
            for h in hist:
                dd = abs((datetime.strptime(h["d"], "%Y-%m-%d") - want).days)
                if dd < bestd:
                    best, bestd = h, dd
            if best and bestd <= 10 and best["p50"]:
                yoy = round((last["p50"] - best["p50"]) / best["p50"] * 100, 1)
        markup = MARKUP.get(cmd, MARKUP["default"])
        bls = BLS_RETAIL_USD_LB.get(cmd)
        fob = US_FOB_USD_LB.get(cmd)
        bls_cad = round(bls * 2.20462 * usd_cad, 2) if bls else None
        ratio = (p50 / bls_cad) if bls_cad else 1 / markup
        deal = max(0, min(100, round(100 * (0.75 - ratio) / 0.45))) if bls_cad else max(
            0, min(100, round(100 * (0.70 - ratio) / 0.40))
        )
        snap.append({
            "centre": centre, "cmd": cmd, "asof": maxd,
            "p20": round(prices[max(0, int(0.2 * (len(prices) - 1)))], 2),
            "p50": round(p50, 2),
            "p80": round(prices[int(0.8 * (len(prices) - 1))], 2),
            "n": len(cur), "wow": wow, "yoy": yoy,
            "origins": Counter(x["origin"] for x in cur).most_common(5),
            "estRetail": round(p50 * markup, 2), "markup": markup,
            "blsCadKg": bls_cad,
            "fobCadKg": round(fob * 2.20462 * usd_cad, 2) if fob else None,
            "deal": deal,
            "quotes": sorted(cur, key=lambda x: x["pkg"])[:8],
        })

    forecasts = {}
    for key, hist in series.items():
        if len(hist) < 8:
            continue
        vals = [h["p50"] for h in hist]
        dates = [h["d"] for h in hist]
        last, mean = vals[-1], sum(vals) / len(vals)
        slope = (vals[-1] - vals[-5]) / 4 if len(vals) >= 5 else 0
        by_w = defaultdict(list)
        for d, v in zip(dates, vals):
            by_w[datetime.strptime(d, "%Y-%m-%d").isocalendar()[1]].append(v)
        seas = {w: (sum(vs) / len(vs)) / mean for w, vs in by_w.items() if mean}
        recent = vals[-12:]
        mu = sum(recent) / len(recent)
        sd = (sum((x - mu) ** 2 for x in recent) / max(1, len(recent) - 1)) ** 0.5
        last_dt = datetime.strptime(dates[-1], "%Y-%m-%d")
        out = []
        for i in range(1, 9):
            dt = last_dt + timedelta(days=7 * i)
            seasonal = mean * seas.get(dt.isocalendar()[1], 1.0)
            trend = last + slope * i
            yoy_t = None
            want = dt.replace(year=dt.year - 1)
            for d, v in zip(dates, vals):
                if abs((datetime.strptime(d, "%Y-%m-%d") - want).days) <= 5:
                    yoy_t = v
                    break
            pt = (trend * 0.45 + seasonal * 0.55) if not yoy_t else (trend * 0.35 + seasonal * 0.35 + yoy_t * 0.30)
            band = sd * (1 + 0.12 * i)
            out.append({
                "d": dt.strftime("%Y-%m-%d"),
                "p": round(max(0.2, pt), 2),
                "lo": round(max(0.15, pt - 1.28 * band), 2),
                "hi": round(pt + 1.28 * band, 2),
            })
        forecasts[key] = out

    centres = ["Vancouver", "Calgary", "Edmonton", "Winnipeg"]
    payload = {
        "generated": datetime.utcnow().strftime("%Y-%m-%d"),
        "source": "Agriculture and Agri-Food Canada Weekly Wholesale Prices (InfoHort)",
        "unit": "CAD per kg",
        "fxUsdCad": usd_cad,
        "markets": centres,
        "commodities": sorted(FOCUS),
        "snapshot": [s for s in snap if s["centre"] in centres],
        "series": {k: v for k, v in series.items() if k.split("|")[0] in centres},
        "forecast": forecasts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")))
    print("wrote", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    main()
