import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { ANGLES, captionWithTags, storyFor, type AngleId } from "@/lib/stories";
import type { BannerId } from "@/lib/grocery";
import { cn } from "@/lib/utils";

export function StoryDesk({
  cmd,
  ticketCadKg,
  store,
  banner,
  angle,
  onAngle,
}: {
  cmd: string;
  ticketCadKg: number | null;
  store: string;
  banner: BannerId;
  angle: AngleId;
  onAngle: (id: AngleId) => void;
}) {
  const story = storyFor(cmd, angle, { ticketCadKg, store, banner });
  const [copied, setCopied] = useState<"en" | "zh" | null>(null);
  const en = captionWithTags(story.en, story.tagsEn);
  const zh = captionWithTags(story.zh, story.tagsZh);

  async function copy(which: "en" | "zh") {
    const text = which === "en" ? en : zh;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      const el = document.getElementById(which === "en" ? "story-en" : "story-zh") as HTMLTextAreaElement | null;
      el?.select();
    }
  }

  async function download() {
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = document.createElement("canvas");
    drawStoryCard(canvas, story);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `bushel-${cmd.toLowerCase().replace(/\s+/g, "-")}-${angle}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl">Post this</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Instagram in English. 小红书 in Chinese. Download the 4:5 card, paste the caption, add the hashtags. We do not post for you.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {ANGLES.map((a) => {
          const on = a.id === angle;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onAngle(a.id)}
              className={cn(
                "min-h-11 rounded-xl border px-3 py-2 text-left text-sm",
                on ? "border-ink bg-ink text-paper" : "border-line bg-cream text-ink",
              )}
            >
              <span className="block font-medium">{a.label}</span>
              <span className={cn("block text-xs", on ? "opacity-70" : "text-ink-soft")}>{a.job}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ink-soft">{ANGLES.find((a) => a.id === angle)?.play}</p>

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <div className="mx-auto w-full max-w-56">
          <article className="relative overflow-hidden rounded-xl border border-line bg-paper">
            <span className="absolute inset-y-0 left-0 w-1.5 bg-rust" aria-hidden />
            <div className="flex min-h-72 flex-col px-4 py-5 pl-5">
              <p className="text-xs font-medium tracking-wide text-ink-soft">BUSHEL COMPASS</p>
              <p className="text-xs uppercase tracking-wide text-ink-soft">{story.kicker}</p>
              <h3 className="mt-4 font-display text-3xl leading-tight">{story.headline}</h3>
              <span className="mt-3 block h-1 w-12 bg-rust" aria-hidden />
              <dl className="mt-5 space-y-3">
                {story.lines.map((line) => (
                  <div key={line.k}>
                    <dt className="text-xs uppercase tracking-wide text-ink-soft">{line.k}</dt>
                    <dd className="font-display text-lg leading-snug">{line.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-auto pt-6 text-xs text-ink-soft">{story.foot}</p>
            </div>
          </article>
          <button
            type="button"
            onClick={download}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 text-sm font-medium text-paper"
          >
            <Download className="size-4" aria-hidden />
            Download 4:5 card
          </button>
        </div>

        <div className="grid gap-4">
          <CaptionBox
            id="story-en"
            label="Instagram · English"
            value={en}
            copied={copied === "en"}
            onCopy={() => copy("en")}
          />
          <CaptionBox
            id="story-zh"
            label="小红书 · 中文"
            value={zh}
            copied={copied === "zh"}
            onCopy={() => copy("zh")}
          />
        </div>
      </div>

      <ol className="grid gap-2 text-sm sm:grid-cols-2">
        <li className="rounded-xl border border-line bg-cream p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Instagram</p>
          <p className="mt-1">
            Feed is 4:5. First line is the hook. One card, one crop, one number. Stories can reuse the same card. Do not tag a grocer you did not name in the ticket.
          </p>
        </li>
        <li className="rounded-xl border border-line bg-cream p-4">
          <p className="text-xs uppercase tracking-wide text-ink-soft">小红书</p>
          <p className="mt-1">
            封面用下载的卡片。标题取第一句（地头到货架 / 原产地换班）。正文贴中文。话题 5 个以内。数字先行，不写表情。
          </p>
        </li>
      </ol>
    </div>
  );
}

function CaptionBox({
  id,
  label,
  value,
  copied,
  onCopy,
}: {
  id: string;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          className="flex min-h-11 items-center gap-1 rounded-xl border border-line bg-paper px-3 text-sm"
        >
          <Copy className="size-4" aria-hidden />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <textarea
        id={id}
        readOnly
        value={value}
        className="mt-2 min-h-44 w-full rounded-xl border border-line bg-paper p-3 text-sm leading-relaxed text-ink"
      />
    </div>
  );
}

type CardStory = ReturnType<typeof storyFor>;

function drawStoryCard(canvas: HTMLCanvasElement, story: CardStory) {
  const w = 1080;
  const h = 1350;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#f3efe4";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#c45c26";
  ctx.fillRect(0, 0, 22, h);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(22, 0, 18, h);

  ctx.fillStyle = "#5c655e";
  ctx.font = "500 28px Outfit, system-ui, sans-serif";
  ctx.fillText("BUSHEL COMPASS", 80, 92);
  ctx.font = "500 22px Outfit, system-ui, sans-serif";
  ctx.fillText(story.kicker, 80, 132);

  ctx.fillStyle = "#14201a";
  ctx.font = "600 92px Fraunces, Georgia, serif";
  const afterHead = wrap(ctx, story.headline, 80, 240, 920, 102);

  ctx.fillStyle = "#c45c26";
  ctx.fillRect(80, afterHead + 12, 120, 8);

  let y = afterHead + 90;
  for (const line of story.lines) {
    ctx.fillStyle = "#5c655e";
    ctx.font = "500 26px Outfit, system-ui, sans-serif";
    ctx.fillText(line.k.toUpperCase(), 80, y);
    ctx.fillStyle = "#14201a";
    ctx.font = "600 48px Fraunces, Georgia, serif";
    y = wrap(ctx, line.v, 80, y + 52, 920, 56) + 36;
  }

  ctx.fillStyle = "#5c655e";
  ctx.font = "400 22px Outfit, system-ui, sans-serif";
  wrap(ctx, story.foot, 80, 1288, 920, 30);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineH;
  }
  return yy;
}
