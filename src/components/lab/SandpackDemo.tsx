"use client";

import {
  SandpackCodeEditor,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
  type SandpackTheme,
} from "@codesandbox/sandpack-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

const PREVIEW_MIN = 480;

/** Entry that renders App and reports the document height to the lab page. */
function previewIndex(demo: string) {
  return `import { StrictMode, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const DEMO = ${JSON.stringify(demo)};

function reportHeight() {
  const root = document.getElementById("root");
  if (!root) return;
  const bodyStyle = getComputedStyle(document.body);
  const pad = parseFloat(bodyStyle.paddingTop) + parseFloat(bodyStyle.paddingBottom);
  const height = Math.ceil(root.getBoundingClientRect().height + pad);
  const message = { type: "lab-demo-height", demo: DEMO, height };
  if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");
}

function Fitted() {
  useLayoutEffect(() => {
    const root = document.getElementById("root");
    reportHeight();
    const observer = new ResizeObserver(reportHeight);
    if (root) observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Fitted />
  </StrictMode>
);
`;
}

export default function SandpackDemo({
  demo,
  locale,
  showCode,
  mountEditor,
  sourceId,
  onMount,
}: {
  demo: DemoId;
  locale: string;
  /** Drives the open/closed height. */
  showCode: boolean;
  /** When false the CodeMirror editor is not mounted. */
  mountEditor: boolean;
  sourceId: string;
  onMount: () => void;
}) {
  const { core, files } = DEMOS[demo];
  const hostRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState(PREVIEW_MIN);

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

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; demo?: string; height?: number } | null;
      if (!data || data.type !== "lab-demo-height" || data.demo !== demo) return;
      if (typeof data.height !== "number" || !Number.isFinite(data.height)) return;
      setPreviewHeight(Math.max(PREVIEW_MIN, Math.ceil(data.height)));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [demo]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const lock = () => {
      host.querySelectorAll("iframe").forEach((frame) => {
        frame.setAttribute("scrolling", "no");
        frame.style.overflow = "hidden";
      });
    };
    lock();
    const observer = new MutationObserver(lock);
    observer.observe(host, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const sandpackFiles = useMemo<SandpackFiles>(
    () => ({
      ...files,
      "/index.js": { code: previewIndex(demo), hidden: true },
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
    [files, locale, compact, demo],
  );

  useEffect(() => {
    onMount();
  }, [onMount]);

  return (
    <SandpackProvider
      template="react"
      theme={theme}
      files={sandpackFiles}
      options={{
        activeFile: core,
        visibleFiles: Object.keys(files),
        initMode: "user-visible",
      }}
    >
      <SandpackLayout
        className="demo-pack"
        style={{ "--demo-preview-h": `${previewHeight}px` } as CSSProperties}
      >
        <div ref={hostRef} className="demo-preview-host">
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            showRestartButton={false}
          />
        </div>
        {mountEditor && (
          <div id={sourceId} className={showCode ? "demo-source-panel open" : "demo-source-panel"}>
            <SandpackCodeEditor showLineNumbers showTabs initMode="immediate" />
          </div>
        )}
      </SandpackLayout>
    </SandpackProvider>
  );
}
