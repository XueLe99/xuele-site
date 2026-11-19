import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { SkillGroup } from "@/lib/messages";
import { Act, ActHeading } from "./Act";
import { Constellation } from "./Constellation";

const SPAN: Record<string, string> = {
  programming: "lg:col-span-2",
  vision: "md:col-span-2 lg:col-span-4",
  tools: "lg:col-span-2",
  systems: "lg:col-span-2",
  interdisciplinary: "lg:col-span-2",
};

/** Act 2. Five skill groups, each a card with its own constellation. */
export async function Skills({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "skills" });
  const groups = t.raw("groups") as SkillGroup[];

  return (
    <Act name="skills" labelledBy="skills-title" className="py-24 md:py-32">
      <ActHeading id="skills-title" eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {groups.map((group) => (
          // The <li> is the scroll-story block; the surface inside it tilts.
          // Two effects never write transforms to the same element.
          <li
            key={group.id}
            data-skill-card={group.id}
            data-story-block
            className={`flex min-w-0 ${SPAN[group.id] ?? ""}`}
          >
            <div data-tilt className="surface flex w-full min-w-0 flex-col gap-4 p-6">
              <div className="flex flex-wrap-reverse items-start justify-between gap-x-4 gap-y-2">
                <h3 className="t-h3">{group.name}</h3>
                <Constellation
                  groupId={group.id}
                  count={group.items.length}
                  label={t("constellationLabel", { name: group.name })}
                />
              </div>
              <p className="t-small text-muted">{group.summary}</p>
              <ul className="mt-auto flex flex-wrap gap-2">
                {group.items.map((item, i) => (
                  <li key={item} data-star-chip={i} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </Act>
  );
}
