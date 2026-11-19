import type { ReactNode } from "react";

/** Common frame for the inner pages (about, lab, contact, blog, projects). */
export function PageShell({
  title,
  intro,
  displayFont = false,
  children,
}: {
  title: string;
  intro?: string;
  displayFont?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="container-site py-16 md:py-24">
      <header className="mb-12">
        <h1
          data-heading-mask
          className={`t-h1 md:text-[40px] ${displayFont ? "font-display" : ""}`}
        >
          {title}
        </h1>
        {intro && <p className="t-body prose-measure mt-4 text-muted">{intro}</p>}
      </header>
      {children}
    </div>
  );
}
