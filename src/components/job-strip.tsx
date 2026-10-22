import { Link } from "@tanstack/react-router";
import { JOBS, type JobId } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export function JobStrip({
  active,
  kicker = "Who this desk is for",
}: {
  active?: JobId;
  kicker?: string;
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-wide text-ink-soft">{kicker}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {JOBS.map((job) => {
          const on = job.id === active;
          return (
            <li key={job.id}>
              <Link
                to={job.to}
                search={job.to === "/grocery" ? job.search : undefined}
                hash={job.id === "poster" ? "post-desk" : job.id === "shopper" ? "shelf-ticket" : undefined}
                className={cn(
                  "flex min-h-11 h-full flex-col rounded-xl border p-4 no-underline transition-colors duration-150",
                  on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
                )}
              >
                <span className={cn("text-xs uppercase tracking-wide", on ? "opacity-70" : "text-ink-soft")}>
                  {job.who}
                </span>
                <span className="mt-2 font-display text-lg leading-tight">{job.want}</span>
                <span className={cn("mt-2 flex-1 text-sm", on ? "opacity-80" : "text-ink-soft")}>{job.so}</span>
                <span className="mt-3 text-sm font-medium">{job.cta} →</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
