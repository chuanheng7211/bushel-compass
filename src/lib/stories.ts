import { fullPlaybooks } from "./catalog";
import { wholesaleFor } from "./compass";
import { marketFile } from "./data";
import { groceryPrints, ownerBench, shelfBands, type BannerId } from "./grocery";
import { tapeMix } from "./origin-geo";

export type AngleId = "markup" | "origin" | "mover" | "banner" | "owner";

export type StoryAngle = {
  id: AngleId;
  label: string;
  job: string;
  play: string;
};

export const ANGLES: StoryAngle[] = [
  {
    id: "markup",
    label: "Farm to shelf",
    job: "The 2–3× gap. Best first post.",
    play: "Post the grower, the wholesale ask, and the grocery average on one card.",
  },
  {
    id: "origin",
    label: "Country of origin",
    job: "Who packed this week vs the calendar.",
    play: "Show the mix walking — Washington this week, Chile on the boat in March.",
  },
  {
    id: "mover",
    label: "What’s moving",
    job: "A YoY jump people can feel at the till.",
    play: "One number, one crop. The till already knows; the post names it.",
  },
  {
    id: "banner",
    label: "Store-format spread",
    job: "Same crop, club vs premium.",
    play: "Type a ticket. Post warehouse vs the store you were standing in.",
  },
  {
    id: "owner",
    label: "How to price",
    job: "DTC window vs grocery markup.",
    play: "For the stall or the independent: floor, target, ceiling.",
  },
];

export type StoryDraft = {
  angle: AngleId;
  cmd: string;
  kicker: string;
  headline: string;
  lines: { k: string; v: string }[];
  foot: string;
  en: string;
  zh: string;
  tagsEn: string[];
  tagsZh: string[];
};

function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function pct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function mixLine(cmd: string): string {
  const snap = wholesaleFor(marketFile, cmd);
  const mix = tapeMix(snap);
  if (!mix.length) {
    const play = fullPlaybooks().commodities[cmd];
    const who = play?.origins?.[0]?.who;
    return who ? `Calendar source: ${who}` : "No origin mix on this week’s tape.";
  }
  return mix.map((m) => `${m.name} ${Math.round(m.share * 100)}%`).join(" · ");
}

const CMD_ZH: Record<string, string> = {
  Apples: "苹果",
  Lettuce: "生菜",
  Tomatoes: "番茄",
  Potatoes: "土豆",
  Bananas: "香蕉",
  Oranges: "橙子",
  Strawberries: "草莓",
  Onions: "洋葱",
  Avocados: "牛油果",
  Blueberries: "蓝莓",
  "Grapes (Table)": "葡萄",
  Carrots: "胡萝卜",
  Peppers: "甜椒",
  Broccoli: "西兰花",
  Cucumbers: "黄瓜",
  Celery: "西芹",
  Peaches: "桃",
  Pears: "梨",
  Beans: "菜豆",
  "Sweet Corn": "甜玉米",
  Melons: "甜瓜",
  Asparagus: "芦笋",
  Cauliflower: "花椰菜",
};

const COUNTRY_ZH: Record<string, string> = {
  "United States": "美国",
  Canada: "加拿大",
  Mexico: "墨西哥",
  "New Zealand": "新西兰",
  Chile: "智利",
  Peru: "秘鲁",
  Guatemala: "危地马拉",
  China: "中国",
  Ecuador: "厄瓜多尔",
  "Costa Rica": "哥斯达黎加",
  Colombia: "哥伦比亚",
  Spain: "西班牙",
  Morocco: "摩洛哥",
};

export function cmdZh(cmd: string): string {
  return CMD_ZH[cmd] || cmd;
}

function mixLineZh(en: string): string {
  let s = en;
  for (const [enName, zh] of Object.entries(COUNTRY_ZH)) s = s.replaceAll(enName, zh);
  return s;
}

export function storyFor(
  cmd: string,
  angle: AngleId,
  extra?: { ticketCadKg?: number | null; store?: string; banner?: BannerId },
): StoryDraft {
  const g = groceryPrints(cmd);
  const bands = shelfBands(cmd);
  const warehouse = bands.find((b) => b.id === "warehouse")?.cadKg ?? null;
  const discount = bands.find((b) => b.id === "discount")?.cadKg ?? null;
  const premium = bands.find((b) => b.id === "premium")?.cadKg ?? null;
  const farmstand = bands.find((b) => b.id === "farmstand")?.cadKg ?? null;
  const multiple = g.farm != null && g.bls != null ? g.bls / g.farm : g.farm != null && g.conventional != null ? g.conventional / g.farm : null;
  const store = extra?.store?.trim() || "";
  const ticket = extra?.ticketCadKg != null && extra.ticketCadKg > 0 ? extra.ticketCadKg : null;
  const foot = "Public tape · USDA NASS · AAFC InfoHort · BLS · not a flyer";

  if (angle === "origin") {
    const mix = mixLine(cmd);
    const play = fullPlaybooks().commodities[cmd];
    const when = play?.origins?.[0]?.when || "this season";
    const who = play?.origins?.[0]?.who || "the live belt";
    return {
      angle,
      cmd,
      kicker: "COUNTRY OF ORIGIN",
      headline: cmd,
      lines: [
        { k: "This week’s mix", v: mix },
        { k: "Calendar", v: `${when} · ${who}` },
        { k: "Wholesale", v: `${money(g.wholesale)} CAD/kg` },
      ],
      foot,
      en: [
        `${cmd}. This week’s Vancouver mix: ${mix}.`,
        `The calendar still says ${when} from ${who}. Country of origin walks. A boat week is not a storage week.`,
        `Wholesale ${money(g.wholesale)} CAD/kg. Public tape, not a flyer.`,
        `The source map plays the year. Open Bushel Compass before you buy — or before you post.`,
      ].join("\n\n"),
      zh: [
        `${cmdZh(cmd)} 原产地这周在换班。`,
        `温哥华本周配比：${mixLineZh(mix)}。`,
        `日历上的当季来源：${when}，${who}。`,
        `船期和仓储不是同一周。批发 ${money(g.wholesale)} CAD/kg。`,
        `公开报价，不是超市海报。先看产地，再决定买不买。`,
      ].join("\n"),
      tagsEn: ["produce", "countryoforigin", "farmtotable", "grocery", "bushelcompass"],
      tagsZh: ["水果产地", "超市干货", "农产品", "买菜", "加拿大生活"],
    };
  }

  if (angle === "mover") {
    const yoy = g.yoy;
    const wow = g.wow;
    const dir = yoy != null && yoy > 0 ? "up" : "down";
    const dirZh = yoy != null && yoy > 0 ? "涨了" : "跌了";
    return {
      angle,
      cmd,
      kicker: "WHAT’S MOVING",
      headline: cmd,
      lines: [
        { k: "Wholesale", v: `${money(g.wholesale)} CAD/kg` },
        { k: "vs last year", v: pct(yoy) },
        { k: "vs last week", v: pct(wow) },
      ],
      foot,
      en: [
        `${cmd} at the destination ask: ${money(g.wholesale)} CAD/kg.`,
        yoy != null
          ? `That is ${dir} ${Math.abs(yoy).toFixed(1)}% vs last year${wow != null ? `, ${pct(wow)} vs last week` : ""}. The till already felt it.`
          : `No year-on-year print this week. Use the farm history and the origin map.`,
        `Public Vancouver wholesale (AAFC). Not a store flyer. Bushel Compass names the move before the receipt does.`,
      ].join("\n\n"),
      zh: [
        `${cmdZh(cmd)} 温哥华批发 ${money(g.wholesale)} CAD/kg。`,
        yoy != null
          ? `比去年${dirZh} ${Math.abs(yoy).toFixed(1)}%${wow != null ? `，周环比 ${pct(wow)}` : ""}。收银台已经感觉到了。`
          : `这周没有同比。看农场历史和产地图。`,
        `加拿大农业部公开批发价，不是某家超市的海报。`,
      ].join("\n"),
      tagsEn: ["groceryprices", "inflation", "produce", "toronto", "bushelcompass"],
      tagsZh: ["菜价", "超市", "农产品价格", "干货分享", "多伦多"],
    };
  }

  if (angle === "banner") {
    return {
      angle,
      cmd,
      kicker: "STORE FORMAT",
      headline: cmd,
      lines: [
        { k: "Warehouse club", v: money(warehouse) },
        { k: "Discount grocery", v: money(discount) },
        { k: "Conventional", v: money(g.conventional) },
        { k: "Premium", v: money(premium) },
        ...(ticket != null ? [{ k: store || "Your ticket", v: money(ticket) }] : []),
      ],
      foot,
      en: [
        `Same ${cmd.toLowerCase()}. Different store format.`,
        `Warehouse club ${money(warehouse)} · discount ${money(discount)} · conventional ${money(g.conventional)} · premium ${money(premium)} CAD/kg.`,
        ticket != null
          ? `I typed ${money(ticket)} CAD/kg${store ? ` at ${store}` : ""}. ${ticket <= (warehouse || ticket) * 1.03 ? "Club-like." : ticket <= (discount || Infinity) ? "Discounter." : ticket <= (g.conventional || Infinity) ? "Ordinary grocery." : "Premium territory."}`
          : `Type the ticket you saw. We do not scrape Loblaws or Costco — you bring the shelf, we bring the public tape.`,
        `Modeled GTA markups on AAFC wholesale. BLS is the grocery average. Bushel Compass.`,
      ].join("\n\n"),
      zh: [
        `同一箱${cmdZh(cmd)}，五类店五个价。`,
        `仓储会员店 ${money(warehouse)} · 折扣超市 ${money(discount)} · 普通超市 ${money(g.conventional)} · 高端 ${money(premium)} CAD/kg。`,
        ticket != null
          ? `我输入的货架价 ${money(ticket)} CAD/kg${store ? `（${store}）` : ""}。`
          : `我们不爬 Loblaws / Costco 海报。你输入看到的价签，对照公开批发和超市均价。`,
        `这是按批发价推的店型区间，不是某家店的真实海报。`,
      ].join("\n"),
      tagsEn: ["grocery", "costco", "loblaws", "savemoney", "bushelcompass"],
      tagsZh: ["超市比价", "省钱", "Costco", "买菜攻略", "多伦多生活"],
    };
  }

  if (angle === "owner") {
    const bench = ownerBench(cmd, ticket, extra?.banner);
    return {
      angle,
      cmd,
      kicker: "HOW TO PRICE",
      headline: cmd,
      lines: [
        { k: "Farm", v: money(g.farm) },
        { k: "Wholesale cost", v: money(g.wholesale) },
        { k: "DTC window", v: `${money(bench.dtcLo)} – ${money(bench.dtcHi)}` },
        { k: "Farm-stand target", v: money(bench.dtcTarget) },
        { k: "Conventional shelf", v: money(g.conventional) },
      ],
      foot,
      en: [
        `${cmd}. If you grow it: DTC window ${money(bench.dtcLo)}–${money(bench.dtcHi)} CAD/kg. Target the stall at ${money(bench.dtcTarget)}.`,
        `Above conventional grocery (${money(g.conventional)}) shoppers walk to the banner. Below the warehouse band (${money(warehouse)}) you donate margin.`,
        g.wholesale != null
          ? `If you retail it: land near ${money(g.wholesale)}, sell discount for volume and conventional for the everyday shelf.`
          : `If you retail it: no public wholesale. Keep a thin markup off landed cost and watch BLS.`,
        ticket != null
          ? `Competitor ticket ${money(ticket)}${store ? ` at ${store}` : ""}. Implied cost at a ${extra?.banner || "conventional"} markup: ${money(bench.impliedCost)}.`
          : `Public farm, wholesale, and grocery tape — a benchmark, not a suggested retail price.`,
      ].join("\n\n"),
      zh: [
        `${cmdZh(cmd)} 怎么定价。`,
        `农场直销窗口 ${money(bench.dtcLo)}–${money(bench.dtcHi)} CAD/kg，摊位目标 ${money(bench.dtcTarget)}。`,
        `高于普通超市（${money(g.conventional)}），顾客去连锁；低于仓储会员店（${money(warehouse)}），你在让利润。`,
        g.wholesale != null
          ? `如果你是零售：进货对着批发 ${money(g.wholesale)}，走量用折扣店价，日常货架用普通超市价。`
          : `没有公开批发。按到岸成本加薄利，对着 BLS 超市均价。`,
        `公开报价推出来的区间，不是建议零售价。`,
      ].join("\n"),
      tagsEn: ["farmstand", "pricing", "independentretail", "produce", "bushelcompass"],
      tagsZh: ["农场直销", "定价", "农产品", "创业干货", "超市"],
    };
  }

  // markup (default)
  return {
    angle: "markup",
    cmd,
    kicker: "FARM TO SHELF",
    headline: cmd,
    lines: [
      { k: "US farm-gate", v: `${money(g.farm)} CAD/kg` },
      { k: "Vancouver wholesale", v: `${money(g.wholesale)} CAD/kg` },
      { k: "BLS grocery average", v: `${money(g.bls)} CAD/kg` },
      { k: "Farm-stand model", v: money(farmstand) },
      ...(multiple != null ? [{ k: "Shelf vs farm", v: `${multiple.toFixed(1)}×` }] : []),
    ],
    foot,
    en: [
      `${cmd}. US farm-gate ${money(g.farm)} CAD/kg. Vancouver wholesale ${money(g.wholesale)}. BLS grocery average ${money(g.bls)}.`,
      multiple != null
        ? `That is about ${multiple.toFixed(1)}× the grower. The ticket on the shelf is not the farm.`
        : `The ticket on the shelf is not the farm.`,
      `Public tape: USDA, AAFC, BLS. Not a flyer scrape. Type the ticket you saw — see which store format you paid.`,
    ].join("\n\n"),
    zh: [
      `${cmdZh(cmd)} 地头到货架。`,
      `美国农场收购 ${money(g.farm)} CAD/kg`,
      `温哥华批发 ${money(g.wholesale)}`,
      `超市公开均价 ${money(g.bls)}`,
      multiple != null ? `货架大约是农场的 ${multiple.toFixed(1)} 倍。价签不是地头价。` : `价签不是地头价。`,
      `USDA + 加拿大农业部 + 美国劳工统计局。不是某家超市的海报。下次买，先看这一层差价。`,
    ].join("\n"),
    tagsEn: ["produceprices", "farmtotable", "grocery", "torontofood", "bushelcompass"],
    tagsZh: ["水果价格", "超市对比", "农产品", "干货分享", "多伦多生活"],
  };
}

export function captionWithTags(body: string, tags: string[]): string {
  return `${body}\n\n${tags.map((t) => `#${t}`).join(" ")}`;
}
