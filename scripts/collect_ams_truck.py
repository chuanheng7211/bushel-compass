#!/usr/bin/env python3
"""AMS refrigerated truck rates (public SODA) → implied origin FOB ceiling.

Shipping-point FOB on MARS needs an API key. AgTransport truck rates do not.
A 40,000 lb reefer is the payload we convert $/load into CAD/kg with.
Vancouver dest minus that truck is the room left for origin FOB + packer —
not a reported FOB print.
"""
from __future__ import annotations

import json
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def data_dir() -> Path:
    src = ROOT / "src" / "data"
    if src.exists():
        return src
    d = ROOT / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d


OUT = data_dir() / "ams.json"
BASE = "https://agtransport.usda.gov/resource/acar-e3r8.json"
UA = "BushelCompass/1.0 (produce desk; public SODA)"
FX = 1.3863
LB_PER_KG = 2.20462
PAYLOAD_LB = 40000
PAYLOAD_KG = PAYLOAD_LB / LB_PER_KG  # ~18,144 kg

# Prefer west dest (Seattle is the Vancouver analog). Then LA, then Chicago.
DEST_PREF = ["SEATTLE", "LOS ANGELES", "CHICAGO", "DALLAS"]

CROPS = [
    {
        "cmd": "Apples",
        "has": ("APPLES",),
        "origins": ("YAKIMA", "WENATCHEE", "WASHINGTON"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Pears",
        "has": ("PEARS",),
        "origins": ("YAKIMA", "WENATCHEE", "WASHINGTON"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Tomatoes",
        "has": ("TOMATOES", "TOMATO"),
        "origins": ("NOGALES", "SOUTH TEXAS", "FLORIDA"),
        "dests": ("LOS ANGELES", "DALLAS", "CHICAGO"),
    },
    {
        "cmd": "Lettuce",
        "has": ("LETTUCE", "ICEBERG", "ROMAINE"),
        "origins": ("SALINAS", "IMPERIAL", "ARIZONA", "YUMA"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Strawberries",
        "has": ("STRAWBERRIES",),
        "origins": ("SALINAS", "OXNARD", "SANTA MARIA", "FLORIDA", "WATSONVILLE"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Potatoes",
        "has": ("POTATOES",),
        "origins": ("IDAHO", "WASHINGTON", "COLORADO", "SAN LUIS"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Onions",
        "has": ("ONIONS",),
        "origins": ("IDAHO", "OREGON", "WASHINGTON", "CALIFORNIA"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Grapes (Table)",
        "has": ("GRAPES",),
        "origins": ("SAN JOAQUIN", "CALIFORNIA", "MEXICO"),
        "dests": ("LOS ANGELES", "SEATTLE", "CHICAGO"),
    },
    {
        "cmd": "Broccoli",
        "has": ("BROCCOLI",),
        "origins": ("SALINAS", "IMPERIAL", "ARIZONA", "SOUTH TEXAS"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Celery",
        "has": ("CELERY",),
        "origins": ("SALINAS", "OXNARD", "CALIFORNIA"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Carrots",
        "has": ("CARROTS",),
        "origins": ("CALIFORNIA", "BAKERSFIELD", "IMPERIAL"),
        "dests": ("SEATTLE", "LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Peppers",
        "has": ("PEPPERS", "BELL PEPPERS"),
        "origins": ("NOGALES", "SOUTH TEXAS", "FLORIDA"),
        "dests": ("LOS ANGELES", "DALLAS", "CHICAGO"),
    },
    {
        "cmd": "Cucumbers",
        "has": ("CUCUMBERS",),
        "origins": ("NOGALES", "SOUTH TEXAS", "FLORIDA"),
        "dests": ("LOS ANGELES", "DALLAS", "CHICAGO"),
    },
    {
        "cmd": "Asparagus",
        "has": ("ASPARAGUS",),
        "origins": ("PERU", "MEXICO", "SOUTH TEXAS", "CALIFORNIA"),
        "dests": ("LOS ANGELES", "CHICAGO"),
    },
    {
        "cmd": "Sweet Corn",
        "has": ("SWEET CORN", "CORN"),
        "origins": ("FLORIDA", "GEORGIA", "CALIFORNIA"),
        "dests": ("ATLANTA", "CHICAGO", "LOS ANGELES"),
    },
    {
        "cmd": "Melons",
        "has": ("MELONS", "WATERMELONS", "CANTALOUP"),
        "origins": ("ARIZONA", "CALIFORNIA", "MEXICO", "TEXAS"),
        "dests": ("LOS ANGELES", "CHICAGO", "DALLAS"),
    },
]


def get(params: dict) -> list:
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def tokens(commodity: str) -> set[str]:
    return {t.strip() for t in commodity.upper().replace(".", ",").split(",") if t.strip()}


def has_crop(commodity: str, needles: tuple[str, ...]) -> bool:
    toks = tokens(commodity)
    up = commodity.upper()
    for n in needles:
        if n in toks:
            return True
        if n == "CORN" and "SWEET CORN" not in up:
            continue
        if n in up and n not in ("APPLE",):
            return True
    return False


def origin_rank(origin: str, prefs: tuple[str, ...]) -> int:
    up = origin.upper()
    for i, p in enumerate(prefs):
        if p in up:
            return i
    return 80


def dest_rank(dest: str, prefs: tuple[str, ...]) -> int:
    up = dest.upper()
    for i, p in enumerate(prefs):
        if p == up:
            return i
    return 80


def num(x) -> float | None:
    try:
        v = float(x)
        return v if v == v else None
    except Exception:
        return None


def cad_kg(mid_usd: float) -> float:
    return round(mid_usd * FX / PAYLOAD_KG, 4)


def pick_rows(cmd_cfg: dict) -> list[dict]:
    needles = cmd_cfg["has"]
    like = needles[0].replace("'", "")
    where = f"date>='2024-01-01' and upper(commodity) like '%{like}%'"
    rows = get({"$where": where, "$order": "date DESC", "$limit": "4000"})
    out = []
    for r in rows:
        c = r.get("commodity") or ""
        if not has_crop(c, needles):
            continue
        if "PINEAPPLE" in c.upper() and cmd_cfg["cmd"] == "Apples":
            continue
        mid = num(r.get("midpoint"))
        if mid is None or mid <= 0:
            continue
        out.append(r)
    return out


def lane_for(cmd_cfg: dict, rows: list[dict]) -> dict | None:
    if not rows:
        return None
    dests = cmd_cfg["dests"]
    origins = cmd_cfg["origins"]
    scored = []
    for r in rows:
        o = r.get("origin") or ""
        d = r.get("destination") or ""
        scored.append((origin_rank(o, origins), dest_rank(d, dests), r.get("date") or "", r))
    scored.sort(key=lambda x: (x[0], x[1], x[2] * -1 if False else 0))
    # latest week among preferred origin+dest
    best_origin = min((origin_rank(r.get("origin") or "", origins) for r in rows), default=80)
    cand = [r for r in rows if origin_rank(r.get("origin") or "", origins) == best_origin]
    if not cand:
        cand = rows
    best_dest = min((dest_rank(r.get("destination") or "", dests) for r in cand), default=80)
    lane_rows = [r for r in cand if dest_rank(r.get("destination") or "", dests) == best_dest]
    if not lane_rows:
        lane_rows = cand
    lane_rows.sort(key=lambda r: r.get("date") or "", reverse=True)
    latest = lane_rows[0]
    origin = latest.get("origin") or ""
    dest = latest.get("destination") or ""
    series_src = [
        r
        for r in rows
        if (r.get("origin") or "") == origin and (r.get("destination") or "") == dest
    ]
    series_src.sort(key=lambda r: r.get("date") or "")
    series = []
    seen = set()
    for r in series_src:
        d = (r.get("date") or "")[:10]
        if d in seen:
            continue
        seen.add(d)
        mid = num(r.get("midpoint"))
        if mid is None:
            continue
        series.append(
            {
                "d": d,
                "midUsd": round(mid, 1),
                "cadKg": cad_kg(mid),
                "rpm": num(r.get("rpm")),
                "avail": int(float(r["availability"])) if r.get("availability") not in (None, "") else None,
            }
        )
    series = series[-52:]
    mid = num(latest.get("midpoint")) or 0
    return {
        "cmd": cmd_cfg["cmd"],
        "origin": origin,
        "dest": dest,
        "commodity": latest.get("commodity") or "",
        "asof": (latest.get("date") or "")[:10],
        "midUsd": round(mid, 1),
        "rpm": num(latest.get("rpm")),
        "avail": int(float(latest["availability"])) if latest.get("availability") not in (None, "") else None,
        "cadKg": cad_kg(mid),
        "payloadKg": round(PAYLOAD_KG, 1),
        "n": len(series),
        "series": series,
    }


def main():
    print("AMS refrigerated truck (AgTransport SODA)…")
    lanes = {}
    for cfg in CROPS:
        try:
            rows = pick_rows(cfg)
            lane = lane_for(cfg, rows)
        except Exception as e:
            print(" fail", cfg["cmd"], type(e).__name__, e)
            continue
        if not lane:
            print("  skip", cfg["cmd"], "no lane")
            continue
        lanes[cfg["cmd"]] = lane
        print(
            f"  {cfg['cmd']:16} {lane['asof']}  ${lane['midUsd']:.0f}/load  "
            f"{lane['cadKg']:.3f} CAD/kg  {lane['origin'][:28]} → {lane['dest']}  n={lane['n']}"
        )

    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "USDA AMS refrigerated truck rates via AgTransport SODA (acar-e3r8). Not MARS shipping-point FOB.",
        "note": (
            "MARS shipping-point FOB is keyed. This file is the public truck tape. "
            "Payload assumed 40,000 lb. Seattle is the Vancouver analog, not GTA. "
            "Dest minus truck CAD/kg is the room left for origin FOB — not a reported FOB."
        ),
        "payloadLb": PAYLOAD_LB,
        "fx": FX,
        "lanes": lanes,
        "n": len(lanes),
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=True), encoding="utf-8")
    print("wrote", OUT, "lanes", len(lanes))


if __name__ == "__main__":
    main()
