import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { ExperienceItem } from "@/lib/messages";
import { Act, ActHeading } from "./Act";

/**
 * Act 3. Reverse-chronological timeline ("star trail").
 * `[data-timeline-stroke]` (stroke-dashoffset scrub), `[data-timeline-node]`
 * (pop) and the `[data-story-block]` entries are animated by
 * motion/ScrollStory.tsx; statically everything is drawn and visible.
 */
export async function Experience({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "experience" });
  const items = t.raw("items") as ExperienceItem[];

  return (
    <Act name="experience" labelledBy="experience-title" className="py-24 md:py-32">
      <ActHeading
        id="experience-title"
        eyebrow={t("eyebrow")}
        title={t("title")}
      />
      <div className="relative max-w-3xl" data-timeline>
        <svg
          aria-hidden="true"
          className="absolute top-2 left-[7px] h-[calc(100%-16px)] w-px overflow-visible opacity-60"
        >
          <defs>
            {/* userSpaceOnUse: a straight line has no bounding box to map onto. */}
            <linearGradient
              id="timeline-stroke"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2="100%"
            >
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="0.5" stopColor="var(--primary)" />
              <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line
            data-timeline-stroke
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="100%"
            pathLength={1}
            stroke="url(#timeline-stroke)"
            strokeWidth="1"
          />
        </svg>
        <ol className="flex flex-col gap-12">
          {items.map((item) => (
            <li
              key={item.id}
              data-timeline-item={item.id}
              data-story-block
              className="relative pl-10"
            >
              <span
                aria-hidden="true"
                data-timeline-node
                className="absolute top-[7px] left-0 flex size-[15px] items-center justify-center rounded-full bg-accent/20"
              >
                <span className="size-[7px] rounded-full bg-accent" />
              </span>
              <p className="font-mono text-sm text-primary">{item.date}</p>
              <h3 className="t-h3 mt-1">
                {item.role}
                <span className="font-normal text-muted"> · {item.org}</span>
              </h3>
              <p className="t-body mt-2 text-muted">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </Act>
  );
}
