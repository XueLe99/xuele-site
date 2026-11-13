import type { ReactNode } from "react";

export interface Terminal404Text {
  title: string;
  windowTitle: string;
  command: string;
  error: string;
  status: string;
  hint: string;
}

/** Terminal-style 404 block. `home` is the `cd ~` link back to the homepage. */
export function Terminal404({
  text,
  home,
  headingLevel: Heading = "h1",
  lang,
}: {
  text: Terminal404Text;
  home: ReactNode;
  headingLevel?: "h1" | "h2";
  lang?: string;
}) {
  return (
    <section lang={lang} className="surface w-full max-w-2xl overflow-hidden">
      <div className="term-bar" aria-hidden="true">
        <span className="term-dots">
          <span />
          <span />
          <span />
        </span>
        <span className="term-tab">{text.windowTitle}</span>
      </div>
      <div className="flex flex-col gap-2 p-6 font-mono text-sm md:p-8 md:text-base">
        <Heading className="sr-only">{text.title}</Heading>
        <p>
          <span aria-hidden="true" className="text-primary">
            ${" "}
          </span>
          {text.command}
        </p>
        <p className="text-muted">{text.error}</p>
        <p className="text-accent">{text.status}</p>
        <p className="mt-4 font-sans text-muted">{text.hint}</p>
        <p className="mt-2 flex items-center">
          <span aria-hidden="true" className="text-primary">
            $&nbsp;
          </span>
          {home}
          <span
            aria-hidden="true"
            className="ml-1 inline-block h-5 w-2 animate-pulse bg-primary"
          />
        </p>
      </div>
    </section>
  );
}

export const cdHomeClass =
  "inline-flex h-11 items-center px-1 text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary";
