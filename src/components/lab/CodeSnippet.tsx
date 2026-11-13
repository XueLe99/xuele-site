import { createHighlighter, type ThemeRegistration } from "shiki";
import { CODE_COLORS as C } from "@/lab/demos/core";

/** Mirrors the Sandpack theme so the swap to the live editor is not a jump. */
const theme: ThemeRegistration = {
  name: "xuele-night",
  type: "dark",
  colors: { "editor.background": C.bg, "editor.foreground": C.text },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: C.comment, fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.operator.new"], settings: { foreground: C.primary } },
    { scope: ["keyword.operator", "punctuation"], settings: { foreground: C.muted } },
    { scope: ["string", "string.template"], settings: { foreground: C.string } },
    { scope: ["constant.numeric", "constant.language", "variable.other.constant"], settings: { foreground: C.accent } },
    { scope: ["entity.name.function", "support.function", "entity.name.class", "entity.name.type"], settings: { foreground: C.accent } },
    { scope: ["variable.other.property", "meta.object-literal.key", "support.type.property-name"], settings: { foreground: C.property } },
  ],
};

// One highlighter per build / server process. Server-only: shiki never
// reaches the browser, the page ships plain <span style="color:…"> HTML.
let highlighter: ReturnType<typeof createHighlighter> | undefined;

/** Server component: static, syntax-highlighted code. */
export async function CodeSnippet({ code, lang = "javascript" }: { code: string; lang?: "javascript" | "css" }) {
  highlighter ??= createHighlighter({ themes: [theme], langs: ["javascript", "css"] });
  const html = (await highlighter).codeToHtml(code.trimEnd(), { lang, theme: "xuele-night" });
  return <div className="demo-code" dangerouslySetInnerHTML={{ __html: html }} />;
}
