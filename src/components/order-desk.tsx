import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookList } from "@/components/book-list";
import { ItemOutlook } from "@/components/item-outlook";
import { TapeCheck } from "@/components/tape-check";
import { useDeskMoney } from "@/lib/desk-money";
import {
  SAMPLE_PO,
  bookScript,
  MOVE_LABEL,
  planBook,
  scriptFor,
  type BargainMove,
  type CropRollup,
  type ScoredLine,
} from "@/lib/order-book";
import { cn } from "@/lib/utils";

const MOVE_TONE: Record<BargainMove, string> = {
  hold: "bg-moss-soft text-moss",
  lock: "bg-moss-soft text-moss",
  counter: "bg-warn-soft text-warn",
  walk: "bg-rich-soft text-rich",
  unknown: "bg-cream text-ink-soft",
};

export function OrderDesk() {
  const { cad, tag, unit } = useDeskMoney();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState<"book" | string | null>(null);
  const [openCmd, setOpenCmd] = useState<string | null>(null);
  const [tab, setTab] = useState<"check" | "list" | "item" | "score">("check");
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<Record<string, number>>({});
  const [itemCmd, setItemCmd] = useState("Apples");
  const fileRef = useRef<HTMLInputElement>(null);
  const plan = useMemo(() => planBook(text, unit), [text, unit]);

  function copy(id: string, body: string) {
    void navigator.clipboard.writeText(body).then(() => {
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    });
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = String(reader.result || "");
      if (next.trim()) setText(next);
    };
    reader.readAsText(file);
  }

  const skuFor = openCmd ? plan.scored.filter((l) => l.cmd === openCmd).slice(0, 12) : [];
  const tabs = [
    { id: "check" as const, label: "Tape check" },
    { id: "item" as const, label: "Item" },
    { id: "list" as const, label: "List" },
    { id: "score" as const, label: "Paste" },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 rounded-xl border px-4 text-sm font-medium",
              tab === t.id ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "check" ? (
        <TapeCheck
          cmd={itemCmd}
          onCmd={(c) => {
            setItemCmd(c);
            setTab("item");
          }}
        />
      ) : null}

      {tab === "list" ? (
        <BookList
          plan={plan}
          query={query}
          onQuery={setQuery}
          cases={cases}
          onCases={(id, n) => setCases((prev) => ({ ...prev, [id]: n }))}
          onOpenItem={(c) => {
            setItemCmd(c);
            setTab("item");
          }}
        />
      ) : null}

      {tab === "item" ? <ItemOutlook cmd={itemCmd} onCmd={setItemCmd} book={plan.scored} /> : null}

      {tab === "score" ? (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
      <section className="h-fit rounded-xl border border-line bg-cream p-5">
        <h2 className="font-display text-lg">The book</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Paste a kilo sheet or a distributor case list. Case $ converts to CAD/kg from the pack size. Nothing is stored. The held-out book used for Tape check is not on this site.
        </p>
        <label className="mt-3 block text-xs text-ink-soft" htmlFor="po-text">
          Paste the list
        </label>
        <textarea
          id="po-text"
          className="mt-1 min-h-52 w-full rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-line bg-paper px-3 text-sm font-medium"
            onClick={() => setText(SAMPLE_PO)}
          >
            Sample kilo sheet
          </button>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-line bg-paper px-3 text-sm font-medium"
            onClick={() => fileRef.current?.click()}
          >
            Read a file on this device
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <p className="mt-3 text-xs text-ink-soft">
          A distributor is not the terminal. Held-out check: dest p50 is the bench; a 1.25× “fair delivered” rule overstated that book. Count cartons without a printed weight use a typical pack — treat those as ±15%.
        </p>
      </section>

      <div className="grid gap-4">
        <section className="rounded-xl border border-line bg-cream p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            {plan.kind === "casebook" ? `${plan.vendor}${plan.week ? ` · ${plan.week}` : ""}` : "What to do with this book"}
          </p>
          <p className="mt-2 font-display text-2xl leading-tight">{plan.thesis}</p>
          {plan.kind === "casebook" ? (
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat k="SKUs scored" v={String(plan.scored.length)} d={`${plan.rollups.length} crops on the public tape`} />
              <Stat k="Hold / lock" v={String(plan.rollups.filter((r) => r.move === "hold" || r.move === "lock").length)} d="Crops inside a distributor band" />
              <Stat k="Counter" v={String(plan.rollups.filter((r) => r.move === "counter").length)} d="Ask them toward 1.25× the mid" />
              <Stat k="Walk" v={String(plan.rollups.filter((r) => r.move === "walk").length)} d="Rich vs the terminal" />
            </ul>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat k="Over the mid" v={plan.saveIfMidCad > 0 ? cad(plan.saveIfMidCad) : cad(0)} d="If every rich line met Vancouver p50" />
              <Stat k="Open" v={String(plan.open.length)} d="Counter or walk" />
              <Stat k="Hold" v={String(plan.hold.length)} d="Already cheap — silence" />
              <Stat k="Lock" v={String(plan.lock.length)} d="Fair. Get a hold" />
            </ul>
          )}
          <button
            type="button"
            className="mt-4 min-h-11 rounded-xl border border-ink bg-ink px-4 text-sm font-medium text-paper"
            onClick={() => copy("book", bookScript(plan, cad))}
          >
            {copied === "book" ? "Copied the talking points" : "Copy the bargain sheet"}
          </button>
        </section>

        {plan.kind === "casebook" && plan.rollups.length ? (
          <section className="rounded-xl border border-line bg-cream p-5">
            <h2 className="font-display text-lg">Crop vs Vancouver terminal</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Median conventional SKU, CAD/kg. Seasonal crops (berries, lettuce, stone fruit) are a different calendar than the August tape — don’t bargain those on this print.
            </p>
            <ul className="mt-3 grid gap-2">
              {plan.rollups.map((r) => (
                <RollupRow
                  key={r.cmd}
                  r={r}
                  cad={cad}
                  open={openCmd === r.cmd}
                  onOpen={() => setOpenCmd(openCmd === r.cmd ? null : r.cmd)}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {plan.kind === "casebook" && skuFor.length ? (
          <section className="rounded-xl border border-line bg-cream p-5">
            <h2 className="font-display text-lg">{openCmd} SKUs</h2>
            <ul className="mt-3 grid gap-2">
              {skuFor.map((line, i) => (
                <LineCard
                  key={`${line.sku || line.raw}-${i}`}
                  line={line}
                  cad={cad}
                  copied={copied === `s${i}`}
                  onCopy={() => copy(`s${i}`, scriptFor(line, cad))}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {plan.kind === "po" ? (
          <section className="rounded-xl border border-line bg-cream p-5">
            <h2 className="font-display text-lg">Line by line</h2>
            <ul className="mt-3 grid gap-2">
              {plan.lines.map((line, i) => (
                <LineCard
                  key={`${line.raw}-${i}`}
                  line={line}
                  cad={cad}
                  copied={copied === `l${i}`}
                  onCopy={() => copy(`l${i}`, scriptFor(line, cad))}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
      ) : null}
    </div>
  );
}

function RollupRow({
  r,
  cad,
  open,
  onOpen,
}: {
  r: CropRollup;
  cad: (n: number | null | undefined) => string;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex min-h-11 w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between",
          open ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink",
        )}
      >
        <span>
          <span className="font-display text-lg leading-tight">{r.cmd}</span>
          <span className={cn("mt-1 block text-xs", open ? "opacity-70" : "text-ink-soft")}>
            {r.nConv} conventional{r.nOrg ? ` · ${r.nOrg} organic` : ""}
            {r.seasonal ? " · seasonal — noisy vs this tape" : ""}
            {r.yoy != null ? ` · tape ${r.yoy > 0 ? "+" : ""}${r.yoy.toFixed(0)}% YoY` : ""}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className="tabular-nums">
            {cad(r.medianCadKg)} vs {cad(r.wholesale)}
            <span className="ml-2 font-display">
              {r.ratio != null ? `${r.ratio.toFixed(2)}×` : "—"}
            </span>
          </span>
          <span className={cn("rounded-lg px-2 py-1 text-xs font-medium", open ? "bg-paper/15 text-paper" : MOVE_TONE[r.move])}>
            {MOVE_LABEL[r.move]}
          </span>
        </span>
      </button>
    </li>
  );
}

function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <li className="rounded-lg border border-line px-3 py-3">
      <span className="block text-xs uppercase tracking-wide text-ink-soft">{k}</span>
      <span className="mt-1 block font-display text-xl tabular-nums leading-tight">{v}</span>
      <span className="mt-1 block text-xs text-ink-soft">{d}</span>
    </li>
  );
}

function LineCard({
  line,
  cad,
  copied,
  onCopy,
}: {
  line: ScoredLine;
  cad: (n: number | null | undefined) => string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <li className="rounded-xl border border-line bg-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg leading-tight">{line.label || line.cmd || line.unknown || "Unnamed"}</p>
          <p className="text-xs text-ink-soft">
            {line.sku ? `#${line.sku} · ` : ""}
            {line.pack || ""}
            {line.casePrice != null ? ` · case $${line.casePrice.toFixed(2)}` : ""}
            {line.vendor ? ` · ${line.vendor}` : ""}
            {line.organic ? " · organic" : ""}
          </p>
        </div>
        <span className={cn("rounded-lg px-2 py-1 text-xs font-medium", MOVE_TONE[line.move])}>
          {MOVE_LABEL[line.move]}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Cell k="Your price" v={cad(line.quoteCadKg)} />
        <Cell k="Vancouver mid" v={cad(line.wholesale)} />
        <Cell k="Farm" v={cad(line.farm)} />
        <Cell
          k="Vs ask"
          v={
            line.vsWholesalePct == null
              ? "—"
              : `${line.vsWholesalePct > 0 ? "+" : ""}${line.vsWholesalePct.toFixed(0)}%`
          }
        />
        <Cell k="× farm" v={line.vsFarmX == null ? "—" : `${line.vsFarmX.toFixed(1)}×`} />
      </dl>
      <p className="mt-3 text-sm text-ink-soft">{scriptFor(line, cad)}</p>
      <button type="button" className="mt-3 min-h-11 rounded-xl border border-line bg-cream px-3 text-sm" onClick={onCopy}>
        {copied ? "Copied" : "Copy this counter"}
      </button>
    </li>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{k}</dt>
      <dd className="font-display text-lg tabular-nums leading-tight">{v}</dd>
    </div>
  );
}
