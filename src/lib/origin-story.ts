import { countryOfPlace, type BeltRow } from "./origin-geo";

export type FactorKind = "frost" | "heat" | "rain" | "storage" | "boat" | "freight" | "spec";

export type Factor = {
  id: string;
  crops: string[];
  months: number[];
  kind: FactorKind;
  t: string;
  d: string;
  where: string;
};

export type Coupling = {
  id: string;
  crops: string[];
  months: number[];
  if: string;
  then: string;
  so: string;
};

const ALL = [] as string[];

const FACTORS: Factor[] = [
  {
    id: "wa-storage",
    crops: ["Apples", "Pears"],
    months: [8, 9, 10, 11, 12, 1, 2, 3, 4],
    kind: "storage",
    t: "Washington / BC storage",
    d: "The north is the inventory. Extra-fancy in a CA room is not a Chilean boat.",
    where: "Washington",
  },
  {
    id: "south-boat",
    crops: ["Apples", "Pears", "Grapes (Table)", "Peaches", "Nectarines"],
    months: [1, 2, 3, 4, 5, 6, 7],
    kind: "boat",
    t: "Southern hemisphere boat",
    d: "Chile / NZ / Peru. 16–28 days, duty, arrival quality. A different clock than Yakima.",
    where: "Chile",
  },
  {
    id: "bloom-frost",
    crops: ["Apples", "Pears", "Peaches", "Cherries"],
    months: [4, 5],
    kind: "frost",
    t: "Bloom frost",
    d: "A frost tweet in April is next year’s pack, not this week’s carton. Don’t reprice storage on it.",
    where: "Washington",
  },
  {
    id: "salinas-heat",
    crops: ["Lettuce", "Broccoli", "Cauliflower", "Celery", "Strawberries"],
    months: [6, 7, 8, 9],
    kind: "heat",
    t: "Salinas heat",
    d: "Tipburn, light packs, desert comes early. The calendar says November; the field may say September.",
    where: "Salinas–Watsonville",
  },
  {
    id: "yuma-freeze",
    crops: ["Lettuce", "Broccoli", "Cauliflower", "Celery"],
    months: [12, 1, 2, 3],
    kind: "frost",
    t: "Yuma / Imperial freeze",
    d: "Desert winter is the only US leaf. A freeze shorts the GTA in about four reefer days.",
    where: "Yuma / Imperial",
  },
  {
    id: "sinaloa-freeze",
    crops: ["Tomatoes", "Cucumbers", "Peppers", "Strawberries", "Asparagus"],
    months: [12, 1, 2, 3],
    kind: "frost",
    t: "Sinaloa freeze",
    d: "Nogales crossings gap. Florida mature-green and Ontario greenhouse leftover are not the same SKU.",
    where: "Sinaloa",
  },
  {
    id: "on-gh",
    crops: ["Tomatoes", "Cucumbers", "Peppers"],
    months: [4, 5, 6, 7, 8, 9, 10],
    kind: "spec",
    t: "Ontario greenhouse spec",
    d: "Cluster / English / colored peppers. Sell spec against the Mexico floor, don’t average them.",
    where: "Ontario",
  },
  {
    id: "berry-rain",
    crops: ["Strawberries", "Blueberries", "Raspberries"],
    months: [5, 6, 7],
    kind: "rain",
    t: "Rain on the local peak",
    d: "Ontario / QC berries are a 48-hour clock. Rain is shrink, not a cheaper FOB.",
    where: "Ontario",
  },
  {
    id: "potato-news",
    crops: ["Potatoes"],
    months: [3, 4, 5, 6],
    kind: "storage",
    t: "Storage empty, news crop",
    d: "Idaho / PEI rooms run out. CA / AZ / FL news is a different solids spec, not a cheaper russet.",
    where: "Idaho",
  },
  {
    id: "onion-sweets",
    crops: ["Onions"],
    months: [4, 5, 6, 7],
    kind: "spec",
    t: "Sweets vs storage yellows",
    d: "Mexico / Texas / Georgia sweets and Peruvian arrivals. Not a cheaper Idaho yellow.",
    where: "Texas / McAllen",
  },
  {
    id: "avocado-mx",
    crops: ["Avocados"],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    kind: "spec",
    t: "Michoacán floor",
    d: "Mexico is the year-round floor. CA spring and Peru summer are overlays, not a replacement.",
    where: "Mexico",
  },
  {
    id: "banana-boat",
    crops: ["Bananas"],
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    kind: "boat",
    t: "Tropical boat + ripening",
    d: "Ecuador / CR / Colombia. The pink sheet is the world. Weather is a storm on the water plus a room in Mississauga.",
    where: "Ecuador",
  },
  {
    id: "freight",
    crops: ALL,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    kind: "freight",
    t: "Freight is a crop",
    d: "Reefer, diesel, Panama, a tight boat. A cheap FOB with a 22-day crossing is not cheap landed GTA.",
    where: "GTA",
  },
];

const COUPLINGS: Coupling[] = [
  {
    id: "apples-handoff",
    crops: ["Apples", "Pears"],
    months: [3, 4, 5],
    if: "Washington storage is still on",
    then: "Chile / NZ boat is the fresh alternative — not a cheaper Yakima",
    so: "Compare landed duty fruit to leftover extra-fancy, never August FOB",
  },
  {
    id: "apples-frost",
    crops: ["Apples"],
    months: [4, 5],
    if: "Bloom frost in WA / BC",
    then: "Next year’s pack tightens",
    so: "Do not reprice this month’s storage carton on a frost tweet",
  },
  {
    id: "lettuce-heat",
    crops: ["Lettuce", "Cauliflower", "Celery", "Broccoli"],
    months: [7, 8, 9],
    if: "Heat spike in Salinas",
    then: "Tipburn, light packs, desert comes early",
    so: "Yuma FOB can print before the calendar says November",
  },
  {
    id: "lettuce-freeze",
    crops: ["Lettuce", "Broccoli", "Cauliflower"],
    months: [12, 1, 2, 3],
    if: "Freeze in Yuma / Imperial",
    then: "GTA iceberg shorts in about four days",
    so: "Salinas leftover and Mexico leaf are not the same SKU",
  },
  {
    id: "tomato-sinaloa",
    crops: ["Tomatoes", "Cucumbers", "Peppers"],
    months: [12, 1, 2, 3],
    if: "Sinaloa freeze",
    then: "Nogales crossings gap",
    so: "Florida mature-green and Ontario GH leftover set the floor — different spec",
  },
  {
    id: "tomato-gh",
    crops: ["Tomatoes", "Cucumbers", "Peppers"],
    months: [5, 6, 7, 8, 9],
    if: "Ontario greenhouse is in season",
    then: "Mexico is the floor, not the spec",
    so: "Pay cluster / English against Leamington, not against a Roma field print",
  },
  {
    id: "grapes-boat",
    crops: ["Grapes (Table)"],
    months: [12, 1, 2, 3, 4],
    if: "California lugs end",
    then: "Chile / Peru is the inventory",
    so: "Don’t bench a Chilean lug to a Delano FOB",
  },
  {
    id: "berry-local",
    crops: ["Strawberries", "Blueberries"],
    months: [6, 7],
    if: "Ontario / QC peak",
    then: "48-hour quality clock",
    so: "CA / MX clamshells are the program. Local is a window, not a bid",
  },
  {
    id: "potato-news",
    crops: ["Potatoes"],
    months: [4, 5, 6],
    if: "Storage sheds empty",
    then: "CA / AZ / FL news crop",
    so: "News is not a cheaper Idaho — different solids",
  },
  {
    id: "asparagus-counter",
    crops: ["Asparagus"],
    months: [8, 9, 10, 11, 12, 1],
    if: "US spears are done",
    then: "Mexico / Peru take the grocery set",
    so: "Peru is a boat. Mexico is a truck. Same spear name, different clock",
  },
  {
    id: "avocado-overlay",
    crops: ["Avocados"],
    months: [4, 5, 6, 7, 8],
    if: "California or Peru overlays Mexico",
    then: "The floor is still Michoacán",
    so: "A CA fruit is spec, not a cheaper Hass",
  },
  {
    id: "freight-boat",
    crops: ALL,
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    if: "Reefer or diesel rips",
    then: "Boat origins get expensive landed even if FOB looks cheap",
    so: "Buy the cheaper landed spec, not the cheaper PDF",
  },
];

function matchesCrop(list: string[], cmd: string) {
  return !list.length || list.includes(cmd);
}

export function factorsFor(cmd: string, month: number, rows: BeltRow[]): Factor[] {
  const encoded = FACTORS.filter((f) => matchesCrop(f.crops, cmd) && f.months.includes(month));
  const live = rows.filter((r) => !r.process && r.months.includes(month));
  const inferred: Factor[] = [];
  if (live.some((l) => l.mode === "boat") && !encoded.some((f) => f.kind === "boat")) {
    inferred.push({
      id: "infer-boat",
      crops: [cmd],
      months: [month],
      kind: "boat",
      t: "Counter-season boat",
      d: `${live.filter((l) => l.mode === "boat").map((l) => l.label).join(" / ")} is on the water. Duty and arrival are the risk.`,
      where: live.find((l) => l.mode === "boat")?.label || "boat",
    });
  }
  if (live.some((l) => ["yuma", "az", "sinaloa", "baja", "fl"].includes(l.id)) && !encoded.some((f) => f.kind === "frost")) {
    inferred.push({
      id: "infer-desert",
      crops: [cmd],
      months: [month],
      kind: "frost",
      t: "Desert / winter field",
      d: "A freeze in this belt reprices the SKU in 72 hours. FAO will not tell you in time.",
      where: live.find((l) => ["yuma", "az", "sinaloa", "baja", "fl"].includes(l.id))?.label || "desert",
    });
  }
  return [...encoded, ...inferred];
}

export function couplingsFor(cmd: string, month: number): Coupling[] {
  return COUPLINGS.filter((c) => matchesCrop(c.crops, cmd) && c.months.includes(month));
}

export function factorPulls(rows: BeltRow[], month: number) {
  const live = rows.filter((r) => !r.process && r.months.includes(month));
  const countries = [...new Set(live.map((r) => countryOfPlace(r).name))];
  const boats = live.filter((r) => r.mode === "boat");
  const trucks = live.filter((r) => r.mode !== "boat");
  return {
    countries,
    truckDays: trucks.length ? Math.min(...trucks.map((t) => t.daysToGta)) : null,
    boatDays: boats.length ? Math.min(...boats.map((b) => b.daysToGta)) : null,
  };
}
