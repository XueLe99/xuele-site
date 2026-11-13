import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { ExperienceItem } from "@/lib/messages";
import { Act, ActHeading } from "./Act";

/**
 * Act 3. Reverse-chronological timeline ("star trail").
 * `[data-timeline-line]` (scaleY scrub) and `[data-timeline-node]` (light up)
 * are animated by HomeFx.tsx; statically everything is drawn and lit.
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
        <div
          aria-hidden="true"
          data-timeline-line
          className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-gradient-to-b from-accent via-primary to-transparent opacity-60"
        />
        <ol className="flex flex-col gap-12">
          {items.map((item) => (
            <li
              key={item.id}
              data-timeline-item={item.id}
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
