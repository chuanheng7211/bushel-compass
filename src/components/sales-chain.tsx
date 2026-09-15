import { Link } from "@tanstack/react-router";
import { DeltaLine } from "@/components/delta-line";
import { cropSubs, formById, freshLadder, futuresNote, printForForm } from "@/lib/substitutes";
import { processFile } from "@/lib/data";
import { useDeskMoney } from "@/lib/desk-money";
import { cn } from "@/lib/utils";
import type { SubForm } from "@/lib/types";

const KIND_TONE: Record<string, string> = {
  fresh: "border-ink bg-ink text-paper",
  frozen: "border-moss bg-moss-soft text-moss",
  dried: "border-warn bg-warn-soft text-warn",
  juice: "border-rust bg-rich-soft text-rich",
  canned: "border-rust bg-rich-soft text-rich",
  process: "border-rust bg-rich-soft text-rich",
};

export function SalesChain({
  cmd,
  formId,
  onForm,
}: {
  cmd: string;
  formId: string;
  onForm: (id: string) => void;
}) {
  const { cad, tag } = useDeskMoney();
  const pack = cropSubs(cmd);
  const form = formById(cmd, formId) || pack.forms[0];
  const print = form ? printForForm(cmd, form) : null;
  const ladder = freshLadder(cmd);
  const listed = futuresNote(form?.listed);
  const others = pack.forms.filter((f) => f.id !== form?.id);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {pack.forms.map((f) => {
          const on = f.id === form?.id;
          const has = printForForm(cmd, f);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onForm(f.id)}
              className={cn(
                "min-h-11 rounded-xl border px-3 py-2 text-left text-sm",
                on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
              )}
            >
              <span className="block font-medium">{f.label}</span>
              <span className={cn("block text-xs tabular-nums", on ? "opacity-70" : "text-ink-soft")}>
                {has ? cad(has.cadKg) : "no public print"}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 max-w-3xl text-sm text-ink-soft">{pack.read}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-xl border border-line bg-cream p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Current public print · {form?.label}</p>
          <p className="font-display text-4xl tabular-nums leading-tight sm:text-5xl">
            {print ? cad(print.cadKg) : "—"}
            {print ? <span className="ml-2 font-sans text-lg text-ink-soft">{tag}</span> : null}
          </p>
          {print ? <div className="mt-2"><DeltaLine cmd={cmd} currentCadKg={print.cadKg} layer={print.layer} /></div> : null}
          {print ? (
            <p className="mt-2 text-sm text-ink-soft">
              {print.source} · as of {print.asof} · {print.lag}
              {print.usdLb != null ? ` · $${print.usdLb.toFixed(3)}/lb USD native` : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{form?.honest || "This form does not print on a public tape."}</p>
          )}
          {form?.honest ? <p className="mt-3 text-sm">{form.honest}</p> : null}
          {listed.length ? (
            <ul className="mt-3 space-y-1 text-sm">
              {listed.map((n) => (
                <li key={n.symbol} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    {n.name} <span className="text-ink-soft">{n.symbol}</span>
                  </span>
                  <span className="tabular-nums">
                    {n.price != null ? n.price.toFixed(2) : "—"}
                    {n.chgPct != null ? ` · ${n.chgPct > 0 ? "+" : ""}${n.chgPct.toFixed(2)}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-xs text-ink-soft">{processFile.disclaimer}</p>
        </article>

        <article className="rounded-xl border border-line bg-cream p-5">
          <h3 className="font-display text-lg">Fresh sales chain</h3>
          <p className="mt-1 text-xs text-ink-soft">
            What a GTA buyer can see without a private PO book. FOB/landed are modeled unless AAFC implies FOB. {tag}.
          </p>
          <ol className="mt-3 space-y-2">
            {ladder.map((s) => (
              <li key={s.n} className="grid grid-cols-[28px_1fr_auto] items-baseline gap-2 border-t border-line pt-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-paper">{s.n}</span>
                <span>
                  <span className="block font-medium">{s.t}</span>
                  <span className="block text-xs text-ink-soft">
                    {s.note}
                    {s.asof ? ` · ${s.asof}` : ""}
                    {s.modeled ? " · modeled" : ""}
                  </span>
                </span>
                <span className="font-display text-xl tabular-nums">{cad(s.v)}</span>
              </li>
            ))}
          </ol>
        </article>
      </div>

      {others.length ? (
        <section className="mt-4">
          <h3 className="font-display text-lg">Other forms — frozen, dried, juice, paste</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((f) => (
              <FormCard key={f.id} cmd={cmd} form={f} onPick={() => onForm(f.id)} />
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-4 text-sm">
        <Link to="/markets" search={{ crop: cmd }} className="text-ink underline-offset-2 hover:underline">
          Listed weather around {cmd}
        </Link>
        <span className="text-ink-soft"> · equities and FCOJ are not the carton.</span>
      </p>
    </div>
  );
}

export function SubstituteStrip({ cmd }: { cmd: string }) {
  const { cad } = useDeskMoney();
  const pack = cropSubs(cmd);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">Fresh vs frozen, dried, juice</h2>
        <Link to="/board" className="text-xs text-ink underline-offset-2 hover:underline">
          Full sales chain
        </Link>
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {pack.forms.map((f) => {
          const print = printForForm(cmd, f);
          return (
            <li key={f.id} className="rounded-xl border border-line bg-cream px-3 py-3">
              <div className="text-xs uppercase tracking-wide text-ink-soft">{f.kind}</div>
              <div className="font-medium">{f.label}</div>
              <div className="font-display text-xl tabular-nums">{print ? cad(print.cadKg) : "—"}</div>
              {print ? <DeltaLine cmd={cmd} currentCadKg={print.cadKg} layer={print.layer} compact /> : null}
              <div className="text-xs text-ink-soft">{print ? print.lag : "no public tape"}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FormCard({ cmd, form, onPick }: { cmd: string; form: SubForm; onPick: () => void }) {
  const { cad } = useDeskMoney();
  const print = printForForm(cmd, form);
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="flex min-h-11 w-full flex-col items-start rounded-xl border border-line bg-cream px-3 py-3 text-left"
      >
        <span className="flex items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide", KIND_TONE[form.kind] || "border-line text-ink-soft")}>
            {form.kind}
          </span>
          <span className="font-medium">{form.label}</span>
        </span>
        <span className="mt-1 font-display text-2xl tabular-nums">{print ? cad(print.cadKg) : "—"}</span>
        {print ? <DeltaLine cmd={cmd} currentCadKg={print.cadKg} layer={print.layer} compact /> : null}
        <span className="text-xs text-ink-soft">{print ? `${print.source} · ${print.asof}` : form.honest}</span>
      </button>
    </li>
  );
}
