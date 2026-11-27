import type { ReactNode } from "react";

export const ACTS = ["hero", "who", "skills", "experience", "lab", "contact"] as const;
export type ActName = (typeof ACTS)[number];

/**
 * One homepage "act". `id` / `data-act` (act-0 … act-5) are the hooks the
 * scroll choreography (ScrollTrigger, starfield store) attaches to later.
 */
export function Act({
  name,
  labelledBy,
  className = "",
  backdrop,
  contained = true,
  children,
}: {
  name: ActName;
  labelledBy: string;
  className?: string;
  /** Decorative layer behind the content, outside the container (hero particles). */
  backdrop?: ReactNode;
  /** false: children span the full width and bring their own containers (hero scene). */
  contained?: boolean;
  children: ReactNode;
}) {
  const id = `act-${ACTS.indexOf(name)}`;
  return (
    <section
      id={id}
      data-act={id}
      data-act-name={name}
      aria-labelledby={labelledBy}
      className={`relative ${className}`}
    >
      {backdrop}
      {contained ? <div className="container-site">{children}</div> : children}
    </section>
  );
}

/**
 * Eyebrow label. A leading number ("03 / experience") is wrapped in
 * `[data-count]` so <Counters /> can count it up; the markup holds the final value.
 */
export function Eyebrow({ text }: { text: string }) {
  const [, digits, rest] = /^(\d+)(.*)$/.exec(text) ?? [];
  return (
    <p className="t-eyebrow mb-2">
      {digits ? (
        <>
          <span data-count className="tabular-nums">
            {digits}
          </span>
          {rest}
        </>
      ) : (
        text
      )}
    </p>
  );
}

export function ActHeading({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <header className="mb-8 md:mb-12">
      <Eyebrow text={eyebrow} />
      <h2 id={id} data-heading-mask className="t-h1">
        {title}
      </h2>
    </header>
  );
}
