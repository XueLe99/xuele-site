"use client";

import { Sandpack, type SandpackFiles, type SandpackTheme } from "@codesandbox/sandpack-react";
import { useEffect, useMemo, useState } from "react";
import { DEMOS } from "@/lab/demos";
import { CODE_COLORS as C, type DemoId } from "@/lab/demos/core";

const theme: SandpackTheme = {
  colors: {
    surface1: C.bg,
    surface2: C.surface,
    surface3: C.border,
    clickable: C.muted,
    base: C.text,
    disabled: C.comment,
    hover: C.text,
    accent: C.primary,
    error: "#FF8A8A",
    errorSurface: "#2A1418",
  },
  syntax: {
    plain: C.text,
    comment: { color: C.comment, fontStyle: "italic" },
    keyword: C.primary,
    tag: C.primary,
    punctuation: C.muted,
    definition: C.accent,
    property: C.property,
    static: C.accent,
    string: C.string,
  },
  font: {
    body: "var(--font-geist-sans), system-ui, sans-serif",
    mono: 'var(--font-geist-mono), ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    size: "13px",
    lineHeight: "20px",
  },
};

export default function SandpackDemo({
  demo,
  locale,
  onMount,
}: {
  demo: DemoId;
  locale: string;
  onMount: () => void;
}) {
  const { core, files } = DEMOS[demo];

  // The pathfinding preview iframe is about half the page, so a max-width
  // query inside it would hide Compare on a desktop monitor. COMPACT follows
  // the page viewport instead (the same 768px breakpoint as the lab layout).
  const [compact, setCompact] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const sandpackFiles = useMemo<SandpackFiles>(
    () => ({
      ...files,
      // The page locale, so the demo UI can be Chinese on /zh.
      "/locale.js": {
        code: `export const LOCALE = ${JSON.stringify(locale)};\n`,
        hidden: true,
      },
      "/env.js": {
        code: `export const COMPACT = ${compact};\n`,
        hidden: true,
      },
      // The bundler aborts any loop after 100k iterations; per-pixel loops
      // over an image legitimately run longer than that.
      "/sandbox.config.json": {
        code: JSON.stringify({ infiniteLoopProtection: false }),
        hidden: true,
      },
    }),
    [files, locale, compact],
  );

  useEffect(onMount, [onMount]);

  return (
    <Sandpack
      template="react"
      theme={theme}
      files={sandpackFiles}
      options={{
        activeFile: core,
        visibleFiles: Object.keys(files),
        showLineNumbers: true,
        showTabs: true,
        editorHeight: 520,
        editorWidthPercentage: 50,
        // Start bundling only when the preview is actually on screen.
        initMode: "user-visible",
      }}
    />
  );
}
