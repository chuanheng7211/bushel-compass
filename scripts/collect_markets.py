#!/usr/bin/env python3
"""Delayed listed quotes around produce — Yahoo chart, not a live pit.

Fresh cartons almost never have a futures contract. These names are the
financial weather: growers who report, fertilizer and iron, trucks and boats,
cold rooms, carton paper, and the grocers / foodservice houses that set programs.
"""
from __future__ import annotations

import json
import time
import urllib.error
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


OUT = data_dir() / "markets.json"
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
CHART = "https://query1.finance.yahoo.com/v8/finance/chart/"

UNIVERSE = [
    {
        "symbol": "DOLE",
        "name": "Dole plc",
        "role": "grower",
        "lens": "growers",
        "what": "Bananas, pineapple, packed fruit. Sold the US fresh-veg book.",
        "means": "A DOLE move is banana / pineapple program weather — not Salinas lettuce.",
        "crops": ["Bananas", "Pineapples", "Grapes (Table)", "Apples", "Lemons"],
    },
    {
        "symbol": "DMC",
        "name": "Del Monte Corporation",
        "role": "grower",
        "lens": "growers",
        "what": "Bananas, pineapple, fresh-cut. Was Fresh Del Monte (FDP); ticker became DMC in June 2026 after taking Del Monte Foods assets.",
        "means": "Watch DMC when banana boats or fresh-cut programs are the question — not Salinas lettuce.",
        "crops": ["Bananas", "Pineapples", "Mangoes", "Melons"],
    },
    {
        "symbol": "AVO",
        "name": "Mission Produce",
        "role": "grower",
        "lens": "growers",
        "what": "Avocados. Bought Calavo in May 2026. Origin-switch (Mexico / Peru / California) plus ripening rooms and guacamole.",
        "means": "AVO is now the listed avocado desk. Green FOB is not the ripe invoice. Calavo (CVGW) no longer prints.",
        "crops": ["Avocados"],
    },
    {
        "symbol": "LMNR",
        "name": "Limoneira",
        "role": "grower",
        "lens": "growers",
        "what": "California lemon ranch, plus avocados and oranges. Water and greening risk.",
        "means": "LMNR is one of the few listed citrus ranches. Not a carton futures print.",
        "crops": ["Lemons", "Limes", "Oranges", "Avocados"],
    },
    {
        "symbol": "ALCO",
        "name": "Alico",
        "role": "grower",
        "lens": "growers",
        "what": "Florida orange groves. Freeze, greening, juice vs fresh.",
        "means": "ALCO is grove land and juice oranges — pair it with OJ futures, not navels at retail.",
        "crops": ["Oranges"],
    },
    {
        "symbol": "VFF",
        "name": "Village Farms",
        "role": "grower",
        "lens": "growers",
        "what": "Greenhouse tomatoes, cucumbers, peppers (and a cannabis book).",
        "means": "VFF is the listed greenhouse name vs the Mexico winter floor. Cannabis noise is not a cuke.",
        "crops": ["Tomatoes", "Cucumbers", "Peppers"],
    },
    {
        "symbol": "LW",
        "name": "Lamb Weston",
        "role": "grower",
        "lens": "growers",
        "what": "Frozen fries. Russet farm is an input; the SKU is a restaurant fry.",
        "means": "LW is process potato, not a fresh carton of russets on a wholesale dock.",
        "crops": ["Potatoes"],
    },
    {
        "symbol": "NTR",
        "name": "Nutrien",
        "role": "input",
        "lens": "inputs",
        "what": "Potash, nitrogen, retail farm centres. Biggest listed fertilizer name.",
        "means": "If NTR rips, next season's cost floor moves. Farm-gate lags weeks to months.",
        "crops": ["Lettuce", "Broccoli", "Potatoes", "Sweet Corn", "Onions", "Carrots"],
    },
    {
        "symbol": "MOS",
        "name": "Mosaic",
        "role": "input",
        "lens": "inputs",
        "what": "Phosphate and potash.",
        "means": "Same weather as NTR, phosphate-heavy. Not a carton print.",
        "crops": ["Potatoes", "Sweet Corn", "Lettuce"],
    },
    {
        "symbol": "CF",
        "name": "CF Industries",
        "role": "input",
        "lens": "inputs",
        "what": "Nitrogen (urea, ammonia).",
        "means": "Nitrogen spikes show up in leafy and corn cost, not this week's FOB.",
        "crops": ["Lettuce", "Broccoli", "Sweet Corn", "Celery"],
    },
    {
        "symbol": "DE",
        "name": "Deere",
        "role": "input",
        "lens": "inputs",
        "what": "Iron. Grower capex cycle.",
        "means": "DE is whether farms buy machines, not what a clamshell costs tomorrow.",
        "crops": ["Potatoes", "Sweet Corn", "Onions", "Apples"],
    },
    {
        "symbol": "CTVA",
        "name": "Corteva",
        "role": "input",
        "lens": "inputs",
        "what": "Seeds and crop protection.",
        "means": "CTVA is next planting's chemistry and genetics, lagged into farm-gate.",
        "crops": ["Lettuce", "Sweet Corn", "Broccoli", "Beans"],
    },
    {
        "symbol": "COLD",
        "name": "Americold",
        "role": "freight",
        "lens": "freight",
        "what": "Temperature-controlled warehouses. A REIT on cold rooms.",
        "means": "COLD occupancy / rates are storage-crop weather: apples, pears, onions, kiwi, fries.",
        "crops": ["Apples", "Pears", "Onions", "Potatoes", "Kiwi Fruit", "Carrots"],
    },
    {
        "symbol": "KNX",
        "name": "Knight-Swift",
        "role": "freight",
        "lens": "freight",
        "what": "The biggest listed trucker. Produce rides the same lanes as dry van — reefer is tighter.",
        "means": "If KNX rips on tightness, landed GTA can rise with origin FOB flat.",
        "crops": ["Lettuce", "Strawberries", "Tomatoes", "Broccoli", "Apples", "Celery"],
    },
    {
        "symbol": "ZIM",
        "name": "ZIM Integrated",
        "role": "freight",
        "lens": "freight",
        "what": "Ocean container line. Counter-season Chile / Peru / NZ boats.",
        "means": "A ZIM spike is boat weather for grapes, blueberries, asparagus, avocados, kiwi.",
        "crops": ["Grapes (Table)", "Blueberries", "Asparagus", "Avocados", "Kiwi Fruit", "Bananas"],
    },
    {
        "symbol": "AMCR",
        "name": "Amcor",
        "role": "pack",
        "lens": "freight",
        "what": "Flexible packaging and clamshells.",
        "means": "Berry and salad-kit film cost. A bag can be the SKU more than the leaf.",
        "crops": ["Strawberries", "Blueberries", "Raspberries", "Lettuce"],
    },
    {
        "symbol": "IP",
        "name": "International Paper",
        "role": "pack",
        "lens": "freight",
        "what": "Corrugated cartons and trays.",
        "means": "Apple, citrus, and banana boxes. Carton cost is a line on every FOB.",
        "crops": ["Apples", "Bananas", "Oranges", "Pears"],
    },
    {
        "symbol": "KR",
        "name": "Kroger",
        "role": "downstream",
        "lens": "downstream",
        "what": "Largest US grocer. Sets produce programs and slotting.",
        "means": "If KR is squeezing, FOB programs get leaned on even in a short crop.",
        "crops": ["Apples", "Strawberries", "Lettuce", "Tomatoes", "Avocados", "Bananas"],
    },
    {
        "symbol": "COST",
        "name": "Costco",
        "role": "downstream",
        "lens": "downstream",
        "what": "Warehouse club. Huge on berries, avocados, citrus, organic.",
        "means": "COST volume can clear a district — or reject a spec and leave it on the dock.",
        "crops": ["Strawberries", "Avocados", "Apples", "Blueberries", "Oranges"],
    },
    {
        "symbol": "WMT",
        "name": "Walmart",
        "role": "downstream",
        "lens": "downstream",
        "what": "The price-setter for a lot of North American produce retail.",
        "means": "WMT retail is not wholesale. A WMT move is bargaining power, not a farm print.",
        "crops": ["Bananas", "Apples", "Tomatoes", "Potatoes", "Onions"],
    },
    {
        "symbol": "SYY",
        "name": "Sysco",
        "role": "downstream",
        "lens": "downstream",
        "what": "Broadline foodservice. Buys kits, tomatoes, leafy, potatoes.",
        "means": "SYY is whether restaurants are pulling. Lettuce kits live here, not on NASS cwt.",
        "crops": ["Lettuce", "Tomatoes", "Potatoes", "Onions", "Mushrooms", "Celery"],
    },
    {
        "symbol": "USFD",
        "name": "US Foods",
        "role": "downstream",
        "lens": "downstream",
        "what": "Second broadline. Same desk as Sysco, different houses.",
        "means": "Foodservice pull for fresh-cut and foodservice tomato / leafy.",
        "crops": ["Lettuce", "Tomatoes", "Potatoes"],
    },
    {
        "symbol": "PFGC",
        "name": "Performance Food",
        "role": "downstream",
        "lens": "downstream",
        "what": "Third broadline plus convenience.",
        "means": "Same foodservice weather as SYY, smaller book.",
        "crops": ["Lettuce", "Tomatoes", "Potatoes"],
    },
    {
        "symbol": "OJ=F",
        "name": "FCOJ futures",
        "role": "futures",
        "lens": "futures",
        "what": "ICE frozen concentrated orange juice. The only fruit with a real pit.",
        "means": "This is juice, not a fresh navel carton. Florida freeze / Brazil pulp hits this.",
        "crops": ["Oranges"],
    },
    {
        "symbol": "DBA",
        "name": "Invesco DB Agriculture",
        "role": "etf",
        "lens": "futures",
        "what": "Grains, sugar, cattle, cocoa. Almost no fresh produce weight.",
        "means": "DBA ripping is feed and freight weather around produce — not iceberg.",
        "crops": [],
    },
    {
        "symbol": "MOO",
        "name": "VanEck Agribusiness",
        "role": "etf",
        "lens": "futures",
        "what": "Deere, fertilizer, processors. Listed ag businesses, not cartons.",
        "means": "MOO is the input-and-iron complex. Pair with NTR / DE, not AMS FOB.",
        "crops": [],
    },
    {
        "symbol": "USDCAD=X",
        "name": "US dollar / Canadian dollar",
        "role": "fx",
        "lens": "fx",
        "what": "Converts USDA USD prints into CAD landed.",
        "means": "A stronger USD makes US FOB more expensive in CAD even if the carton did not move.",
        "crops": ["Apples", "Lettuce", "Strawberries", "Grapes (Table)"],
    },
    {
        "symbol": "USDMXN=X",
        "name": "US dollar / Mexican peso",
        "role": "fx",
        "lens": "fx",
        "what": "Mexico winter veg and avocado cost in dollars.",
        "means": "A weak peso can print cheaper Nogales FOB in USD. Sinaloa tomatoes, berries, Hass.",
        "crops": ["Tomatoes", "Avocados", "Strawberries", "Cucumbers", "Asparagus", "Peppers"],
    },
    {
        "symbol": "HO=F",
        "name": "NY Harbor ULSD / heating oil",
        "role": "energy",
        "lens": "energy",
        "what": "The listed diesel proxy. Reefers and long-haul burn this, not crude.",
        "means": "If HO=F rips, landed GTA can rise with origin FOB sitting still. Every Salinas / Yakima / Nogales mile.",
        "crops": ["Lettuce", "Strawberries", "Tomatoes", "Broccoli", "Apples", "Celery", "Bananas"],
    },
    {
        "symbol": "NG=F",
        "name": "Henry Hub natural gas",
        "role": "energy",
        "lens": "energy",
        "what": "Greenhouse heat. Ontario and BC glass burn gas in winter.",
        "means": "NG=F is Village Farms' winter cost floor — tomatoes, cukes, peppers — not a field tomato.",
        "crops": ["Tomatoes", "Cucumbers", "Peppers"],
    },
    {
        "symbol": "CL=F",
        "name": "WTI crude",
        "role": "energy",
        "lens": "energy",
        "what": "Parent of diesel and of plastic resin for clamshells and bags.",
        "means": "Crude is two steps from the carton: freight (HO=F) and film (AMCR). Don't quote it as FOB.",
        "crops": ["Strawberries", "Lettuce", "Blueberries"],
    },
    {
        "symbol": "UAN",
        "name": "CVR Partners",
        "role": "input",
        "lens": "inputs",
        "what": "Listed urea ammonium nitrate. The nitrogen print closest to a farm invoice.",
        "means": "UAN ripping is next leafy / corn cost, not this week's FOB. Pair with CF.",
        "crops": ["Lettuce", "Broccoli", "Celery", "Sweet Corn"],
    },
    {
        "symbol": "ICL",
        "name": "ICL Group",
        "role": "input",
        "lens": "inputs",
        "what": "Potash, phosphate, specialty plant nutrition.",
        "means": "Same fertilizer weather as NTR / MOS, specialty-heavy. Lagged into farm-gate.",
        "crops": ["Potatoes", "Lettuce", "Onions"],
    },
    {
        "symbol": "PKG",
        "name": "Packaging Corp",
        "role": "pack",
        "lens": "freight",
        "what": "Corrugated boxes and trays — the carton around the carton.",
        "means": "A PKG move is box cost on apples, citrus, bananas. A line on every FOB.",
        "crops": ["Apples", "Bananas", "Oranges", "Pears"],
    },
    {
        "symbol": "UNP",
        "name": "Union Pacific",
        "role": "freight",
        "lens": "freight",
        "what": "West-coast rail. Potatoes, onions, apples, citrus ride this when truck is tight.",
        "means": "UNP is the long-haul alternative to KNX. Storage crops, not berries.",
        "crops": ["Potatoes", "Onions", "Apples", "Oranges"],
    },
    {
        "symbol": "USDCLP=X",
        "name": "US dollar / Chilean peso",
        "role": "fx",
        "lens": "fx",
        "what": "Chile counter-season grapes, kiwi, berries, stone fruit.",
        "means": "A weak peso can print cheaper Chilean FOB in USD. Pair with ZIM — it's still a boat.",
        "crops": ["Grapes (Table)", "Kiwi Fruit", "Blueberries", "Peaches"],
    },
    {
        "symbol": "NZDUSD=X",
        "name": "New Zealand dollar / US dollar",
        "role": "fx",
        "lens": "fx",
        "what": "NZ kiwi and apples into North America.",
        "means": "Zespri is a co-op. The kiwi is a boat plus this FX print.",
        "crops": ["Kiwi Fruit", "Apples"],
    },
    {
        "symbol": "USDPEN=X",
        "name": "US dollar / Peruvian sol",
        "role": "fx",
        "lens": "fx",
        "what": "Peru asparagus, avocado, blueberry boats.",
        "means": "Counter-season Peru is sol plus ZIM. Not a California print.",
        "crops": ["Asparagus", "Avocados", "Blueberries"],
    },
]

DEFAULT_CROP = {
    "tickers": ["HO=F", "NTR", "KNX", "IP", "KR", "SYY", "USDCAD=X"],
    "futures": [],
    "read": "No listed grower for this carton. Watch truck (KNX), fertilizer (NTR), carton paper (IP), and the buyers (KR, SYY) — they move landed cost even when farm-gate is quiet.",
}

CROP_MAPS = {
    "Apples": {
        "tickers": ["DOLE", "COLD", "IP", "KNX", "HO=F", "KR", "COST", "USDCAD=X"],
        "futures": [],
        "read": "No apple futures. Storage rooms (COLD), tray cartons (IP), and grocery programs (KR / COST) are the listed weather around Washington / Ontario fruit.",
    },
    "Strawberries": {
        "tickers": ["AMCR", "KNX", "HO=F", "KR", "COST", "USDMXN=X"],
        "futures": [],
        "read": "Driscoll's is private. Clamshell film (AMCR), truck (KNX), Costco / Kroger programs, and the peso for Mexico winter are the listed names. NASS cwt is too coarse for a clamshell.",
    },
    "Grapes (Table)": {
        "tickers": ["DOLE", "DMC", "ZIM", "KR", "USDCAD=X", "USDCLP=X"],
        "futures": [],
        "read": "Chile counter-season rides a boat (ZIM). Dole and Del Monte still pack table grapes. No grape futures.",
    },
    "Peaches": {
        "tickers": ["KNX", "ZIM", "KR"],
        "futures": [],
        "read": "A short US peach window, then Chile. Truck in season, boat counter-season. No listed peach ranch.",
    },
    "Pears": {
        "tickers": ["COLD", "KNX", "KR", "IP"],
        "futures": [],
        "read": "Storage crop on the same desk as apples. COLD rooms and carton paper matter more than any ticker with 'pear' in the name — there isn't one.",
    },
    "Tomatoes": {
        "tickers": ["VFF", "USDMXN=X", "NG=F", "SYY", "KR", "KNX", "HO=F"],
        "futures": [],
        "read": "Village Farms is the listed greenhouse. Mexico winter (peso + Nogales truck) sets the floor. Sysco buys spec, not NASS rounds.",
    },
    "Lettuce": {
        "tickers": ["SYY", "USFD", "KNX", "HO=F", "AMCR", "NTR", "UAN", "CTVA"],
        "futures": [],
        "read": "Taylor Farms and Fresh Express are private. The listed tape is the kit buyers (SYY / USFD), Salinas truck, salad film, and next crop's fertilizer.",
    },
    "Potatoes": {
        "tickers": ["LW", "COLD", "KNX", "DE", "SYY"],
        "futures": [],
        "read": "Lamb Weston is fries, not a fresh carton. Storage (COLD) and foodservice (SYY) still move the russet story.",
    },
    "Onions": {
        "tickers": ["COLD", "KNX", "WMT", "NTR"],
        "futures": [],
        "read": "Storage crop. Rooms and trucks, not a pit. Grocery ads (WMT) can dump a district.",
    },
    "Broccoli": {
        "tickers": ["KNX", "SYY", "NTR", "CF"],
        "futures": [],
        "read": "Salinas / desert brassica. Truck and nitrogen. No listed broccoli grower.",
    },
    "Carrots": {
        "tickers": ["COLD", "KR", "SYY", "NTR"],
        "futures": [],
        "read": "Grimmway and Bolthouse are private and most of US fresh carrots. Listed weather is storage, grocery, and fertilizer.",
    },
    "Cauliflower": {
        "tickers": ["KNX", "SYY", "NTR"],
        "futures": [],
        "read": "Same desert-and-Salinas clock as lettuce. No listed name. Watch truck and foodservice.",
    },
    "Celery": {
        "tickers": ["KNX", "SYY", "CF"],
        "futures": [],
        "read": "Oxnard / Salinas / Yuma rotation. Truck and nitrogen. No listed celery ranch.",
    },
    "Cucumbers": {
        "tickers": ["VFF", "USDMXN=X", "KR"],
        "futures": [],
        "read": "Greenhouse (VFF) vs Mexico winter (peso). Ontario sells spec against that floor.",
    },
    "Beans": {
        "tickers": ["KNX", "USDMXN=X", "CTVA"],
        "futures": [],
        "read": "US snap window then Florida / Mexico winter. Truck and the peso. No listed snap-bean name.",
    },
    "Asparagus": {
        "tickers": ["ZIM", "USDMXN=X", "KR"],
        "futures": [],
        "read": "Peru boat (ZIM) and Mexico spears (peso) are the counter-season. US CA / WA is a short spring.",
    },
    "Sweet Corn": {
        "tickers": ["KNX", "KR", "DE", "NTR"],
        "futures": [],
        "read": "The window walks north. Not #2 yellow corn futures. Truck, grocery ads, iron and fertilizer.",
    },
    "Melons": {
        "tickers": ["DMC", "KNX", "USDMXN=X", "KR"],
        "futures": [],
        "read": "California / Arizona then Mexico. Truck and peso. Del Monte still touches melon programs.",
    },
    "Avocados": {
        "tickers": ["AVO", "USDMXN=X", "ZIM", "USDPEN=X", "COST", "KR"],
        "futures": [],
        "read": "Mission (AVO) is the listed avocado desk after buying Calavo in 2026. Peso for Mexico, boat for Peru, Costco for volume.",
    },
    "Bananas": {
        "tickers": ["DOLE", "DMC", "ZIM", "IP", "WMT"],
        "futures": [],
        "read": "Closest thing produce has to a world price — still not a futures pit. Dole and Del Monte are the listed boats. Pink-sheet bananas live on World.",
    },
    "Lemons": {
        "tickers": ["LMNR", "DOLE", "IP"],
        "futures": [],
        "read": "Limoneira is the listed lemon ranch. Dole packs citrus. No lemon futures.",
    },
    "Limes": {
        "tickers": ["USDMXN=X", "LMNR", "KR"],
        "futures": [],
        "read": "Mexico is the lime belt. The peso is the listed name. Limoneira is lemon-first.",
    },
    "Oranges": {
        "tickers": ["ALCO", "OJ=F", "LMNR", "IP", "COST"],
        "futures": ["OJ=F"],
        "read": "OJ=F is frozen concentrate, not a navel carton. Alico is Florida groves. Fresh navels still trade as a district FOB.",
    },
    "Pineapples": {
        "tickers": ["DOLE", "DMC", "ZIM"],
        "futures": [],
        "read": "Tropical program fruit. Dole and Del Monte own the listed story. Boat, not a pit.",
    },
    "Peppers": {
        "tickers": ["VFF", "USDMXN=X", "KR"],
        "futures": [],
        "read": "Greenhouse vs Mexico, same as tomatoes and cukes. Village Farms is the listed GH name.",
    },
    "Blueberries": {
        "tickers": ["ZIM", "AMCR", "COST", "KR"],
        "futures": [],
        "read": "Peru / Chile boats and clamshells. Driscoll's is private. Costco can make a week.",
    },
    "Raspberries": {
        "tickers": ["AMCR", "KNX", "COST"],
        "futures": [],
        "read": "Clamshell and truck. No listed raspberry grower. Mexico / CA / WA windows.",
    },
    "Mangoes": {
        "tickers": ["DMC", "ZIM", "KR"],
        "futures": [],
        "read": "Tropical import. Del Monte and the boat. No mango futures.",
    },
    "Kiwi Fruit": {
        "tickers": ["ZIM", "COLD", "KR", "NZDUSD=X", "USDCLP=X"],
        "futures": [],
        "read": "NZ / Italy / Chile. Boat plus storage. Zespri is a co-op, not a ticker.",
    },
    "Mushrooms": {
        "tickers": ["SYY", "KR"],
        "futures": [],
        "read": "Indoor crop, private houses. Foodservice and grocery ads are the listed weather.",
    },
    "Garlic": {
        "tickers": ["ZIM", "USDMXN=X", "WMT"],
        "futures": [],
        "read": "China / Mexico / CA. Boat and peso. Retail ads move the jar more than the bulb pit — there is no pit.",
    },
}

LENSES = [
    {"id": "growers", "label": "Growers & packers", "blurb": "The few produce names that actually report as public companies."},
    {"id": "inputs", "label": "Fertilizer, seed, iron", "blurb": "Nitrogen, potash, phosphate, seed. Next season's cost floor."},
    {"id": "energy", "label": "Energy", "blurb": "Diesel for the reefer, gas for the greenhouse, crude behind plastic film."},
    {"id": "freight", "label": "Truck, boat, rail, carton", "blurb": "Landed GTA can move with FOB sitting still."},
    {"id": "downstream", "label": "Grocery & foodservice", "blurb": "The buyers who set programs and can squeeze a short crop."},
    {"id": "futures", "label": "Listed futures (rare)", "blurb": "OJ juice and grain ETFs. Not iceberg, not berries."},
    {"id": "fx", "label": "FX", "blurb": "USD/CAD landed. Peso, sol, Chilean peso, kiwi dollar for origin."},
]

RELATIONS = [
    {
        "if": "Fertilizer (NTR, MOS, CF) rips",
        "then": "Next planting's cost floor moves. Farm-gate and then FOB lag — this week's lettuce does not reprice overnight.",
        "watch": ["NTR", "MOS", "CF"],
    },
    {
        "if": "Truck (KNX) rips on tightness",
        "then": "Landed GTA / DC can rise with origin FOB flat. Salinas and Yakima feel it first.",
        "watch": ["KNX"],
    },
    {
        "if": "Ocean (ZIM) spikes",
        "then": "Chile grapes, Peru asparagus / avocado / blueberry, NZ kiwi get more expensive to land. Counter-season is a boat.",
        "watch": ["ZIM"],
    },
    {
        "if": "Grocery (KR, WMT, COST) dumps",
        "then": "Programs get leaned on even in a short crop. Retail is bargaining power, not a farm print.",
        "watch": ["KR", "WMT", "COST"],
    },
    {
        "if": "Foodservice (SYY, USFD) rips",
        "then": "Restaurant pull for kits, tomatoes, fries. A bag of salad is not NASS head lettuce.",
        "watch": ["SYY", "USFD", "PFGC"],
    },
    {
        "if": "Peso (USDMXN) weakens",
        "then": "Mexico winter veg and Hass can print cheaper in USD at Nogales / McAllen. Ontario greenhouse sells spec against that floor.",
        "watch": ["USDMXN=X", "VFF", "AVO"],
    },
    {
        "if": "USD strengthens vs CAD",
        "then": "The same USDA / AMS dollar FOB costs more in CAD. Compass farm prints move without the field moving.",
        "watch": ["USDCAD=X"],
    },
    {
        "if": "OJ futures rip",
        "then": "Florida freeze or Brazil pulp. Fresh navels on a retail rack are a different desk. Pair with Alico, not a carton of Valencias.",
        "watch": ["OJ=F", "ALCO"],
    },
    {
        "if": "Diesel (HO=F) rips",
        "then": "Reefer miles get more expensive. Landed Vancouver / GTA can rise with origin FOB flat. Salinas, Yakima, Nogales feel it first.",
        "watch": ["HO=F", "CL=F", "KNX"],
    },
    {
        "if": "Natural gas (NG=F) rips",
        "then": "Ontario / BC greenhouse heat jumps. Village Farms winter tomatoes, cukes, peppers. Field tomatoes do not.",
        "watch": ["NG=F", "VFF"],
    },
    {
        "if": "Urea (UAN) / nitrogen (CF) rips",
        "then": "Next leafy and sweet-corn cost floor. This week's lettuce FOB does not reprice overnight.",
        "watch": ["UAN", "CF", "NTR"],
    },
    {
        "if": "Chilean peso (USDCLP) weakens",
        "then": "Chile grapes, kiwi, berries can print cheaper in USD. Still a boat (ZIM).",
        "watch": ["USDCLP=X", "ZIM"],
    },
    {
        "if": "Cold storage (COLD) rips",
        "then": "Rooms are tight or rates are up — apples, pears, onions, kiwi, fries. Storage crops, not berries.",
        "watch": ["COLD"],
    },
]

FEATURED = {
    "DOLE",
    "DMC",
    "AVO",
    "LMNR",
    "VFF",
    "NTR",
    "KNX",
    "ZIM",
    "COLD",
    "KR",
    "SYY",
    "OJ=F",
    "USDCAD=X",
    "USDMXN=X",
    "HO=F",
    "NG=F",
    "UAN",
}

THESIS = (
    "A carton is farm + 原物料 + miles + FX + the buyer. Almost no fresh item has a futures pit. "
    "Listed names are the cost stack around the carton — fertilizer, diesel, greenhouse gas, truck, boat, "
    "box, peso / CAD, and the grocers who set programs. They are not AMS FOB and they are not your invoice."
)

DISCLAIMER = (
    "Yahoo delayed quotes (~15 minutes), not advice, not a cleared produce trade. "
    "HO=F is heating oil / ULSD, the diesel proxy — not a farm print. "
    "OJ=F is frozen concentrated orange juice. Iceberg and berries still do not have a ticker."
)


def get_json(url: str) -> dict | None:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Accept": "application/json"},
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=12) as r:
                return json.loads(r.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 503, 502) and attempt < 3:
                time.sleep(1.5 * (attempt + 1))
                continue
            print("fail", url, e.code)
            return None
        except Exception as e:
            print("fail", url, type(e).__name__, e)
            return None
    return None


def ret_from(closes: list[float | None], days: int) -> float | None:
    vals = [c for c in closes if c is not None]
    if len(vals) < days + 1:
        if len(vals) < 2:
            return None
        a, b = vals[-1], vals[0]
    else:
        a, b = vals[-1], vals[-(days + 1)]
    if not a or not b:
        return None
    return round((a / b - 1) * 100, 2)


def fetch_symbol(symbol: str, featured: bool = False) -> dict:
    span = "6mo" if featured else "1mo"
    q = urllib.parse.quote(symbol, safe="")
    url = f"{CHART}{q}?range={span}&interval=1d&includePrePost=false"
    data = get_json(url)
    empty = {
        "price": None,
        "chg": None,
        "chgPct": None,
        "prevClose": None,
        "currency": None,
        "asof": None,
        "ret1m": None,
        "ret3m": None,
        "closes": [],
    }
    if not data:
        return empty
    result = (data.get("chart") or {}).get("result") or []
    if not result:
        return empty
    row = result[0]
    meta = row.get("meta") or {}
    price = meta.get("regularMarketPrice")
    chg_pct = meta.get("regularMarketChangePercent")
    prev = meta.get("previousClose")
    chg = None
    if price is not None and chg_pct is not None:
        chg = round(float(price) * float(chg_pct) / 100.0, 4)
        if prev in (None, 0):
            denom = 1 + float(chg_pct) / 100.0
            if denom:
                prev = float(price) / denom
    elif price is not None and prev not in (None, 0):
        chg = round(float(price) - float(prev), 4)
    ts = meta.get("regularMarketTime")
    asof = None
    if ts:
        asof = datetime.fromtimestamp(int(ts), tz=timezone.utc).strftime("%Y-%m-%d")
    quote = ((row.get("indicators") or {}).get("quote") or [{}])[0]
    raw_closes = quote.get("close") or []
    stamps = row.get("timestamp") or []
    closes = []
    for i, p in enumerate(raw_closes):
        if p is None:
            continue
        d = ""
        if i < len(stamps):
            d = datetime.fromtimestamp(int(stamps[i]), tz=timezone.utc).strftime("%Y-%m-%d")
        closes.append({"d": d, "p": round(float(p), 4)})
    series = [c["p"] for c in closes]
    return {
        "price": round(float(price), 4) if price is not None else None,
        "chg": chg,
        "chgPct": round(float(chg_pct), 2) if chg_pct is not None else None,
        "prevClose": round(float(prev), 4) if prev is not None else None,
        "currency": meta.get("currency"),
        "asof": asof,
        "ret1m": ret_from(series, 21),
        "ret3m": ret_from(series, 63),
        "closes": closes[-80:],
    }


def main() -> None:
    print("listed weather around produce…")
    universe = []
    history: dict[str, list] = {}
    got = 0
    for i, item in enumerate(UNIVERSE):
        q = fetch_symbol(item["symbol"], item["symbol"] in FEATURED)
        closes = q.pop("closes")
        row = {**item, **q}
        universe.append(row)
        if q.get("price") is not None:
            got += 1
            print(f"  {item['symbol']:10} {q['price']}  {q.get('chgPct')}%")
        else:
            print(f"  {item['symbol']:10} —")
        if item["symbol"] in FEATURED and closes:
            history[item["symbol"]] = closes
        if i < len(UNIVERSE) - 1:
            time.sleep(2.1)

    payload = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "source": "Yahoo Finance delayed daily chart (query2). Not a live pit.",
        "thesis": THESIS,
        "disclaimer": DISCLAIMER,
        "lenses": LENSES,
        "relations": RELATIONS,
        "crops": CROP_MAPS,
        "defaultCrop": DEFAULT_CROP,
        "universe": universe,
        "history": history,
        "quoted": got,
        "of": len(UNIVERSE),
    }
    OUT.write_text(json.dumps(payload, indent=2) + "\n")
    print("wrote", OUT, "quotes", got, "/", len(UNIVERSE))


if __name__ == "__main__":
    main()
