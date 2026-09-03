export type AgentId =
  | "compass"
  | "history"
  | "origin"
  | "channel"
  | "stack"
  | "vertical";

export type Basis = "wholesale" | "fob" | "farm" | "process" | "retail";
export type Unit = "cadKg" | "cadLb" | "usdLb" | "usdKg";

export type Origin = { when: string; who: string; why: string };
export type Channel = { id: string; label: string; use: string };

export type CommodityPlay = {
  nass?: string;
  aafc?: string;
  form: string[];
  origins: Origin[];
  channels: Channel[];
};

export type Playbooks = {
  scenario: string;
  destination: string;
  agents: { id: AgentId; name: string; job: string }[];
  commodities: Record<string, CommodityPlay>;
  fairnessRules: Record<string, string>;
};

export type MonthlyPt = {
  y: number;
  m: number;
  d: string;
  usdLb: number;
  cadKg: number;
};

export type NassSeries = {
  commodity?: string;
  short?: string;
  latest?: MonthlyPt;
  monthly?: MonthlyPt[];
  nMonthly?: number;
};

export type NassFile = {
  generated?: string;
  fxUsdCad?: number;
  series: Record<string, NassSeries>;
};

export type QuoteRow = {
  date: string;
  centre: string;
  cmd: string;
  var?: string;
  origin?: string;
  pkg?: number;
  kg?: number;
  mid_pack?: number;
};

export type MarketSnap = {
  centre: string;
  cmd: string;
  asof: string;
  p20?: number;
  p50?: number;
  p80?: number;
  n?: number;
  wow?: number | null;
  yoy?: number | null;
  origins?: (string | number)[][];
  estRetail?: number | null;
  markup?: number | null;
  blsCadKg?: number | null;
  fobCadKg?: number | null;
  quotes?: QuoteRow[];
};

export type WeekPt = {
  d: string;
  p50: number;
  p20?: number;
  p80?: number;
  n?: number;
};

export type ForecastPt = {
  d: string;
  p: number;
  lo: number;
  hi: number;
};

export type MarketFile = {
  generated?: string;
  source?: string;
  fxUsdCad?: number;
  snapshot: MarketSnap[];
  series?: Record<string, WeekPt[]>;
  forecast?: Record<string, ForecastPt[]>;
};

export type Layer = {
  id: string;
  name: string;
  owns: string;
  publicData: string;
  capexCad: string;
  workingDays: string;
  risk: string;
  ownIf: string;
  rentIf: string;
  integrate: string;
};

export type LayersFile = {
  disclaimer: string;
  thesis: string;
  whoBenefits: { who: string; get: string }[];
  whoDoesNot: string[];
  layers: Layer[];
  rules: string[];
};

export type VerdictCls = "great" | "good" | "fair" | "rich";

export type Verdict = { cls: VerdictCls; title: string; note: string };

export type Analysis = {
  cmd: string;
  form: string;
  unit: Unit;
  basis: Basis;
  originNote: string;
  quoteCadKg: number;
  farm: MonthlyPt | null;
  farmPctMonth: number | null;
  quoteVsFarmPct: number | null;
  quoteVsSeasonPct: number | null;
  wholesale: MarketSnap | null;
  play: CommodityPlay | null;
  hist: MonthlyPt[];
  verdict: Verdict;
};
