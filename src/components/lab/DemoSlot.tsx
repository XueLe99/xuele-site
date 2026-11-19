"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { DemoId } from "@/lab/demos/core";
import { GithubIcon } from "@/components/ui/icons";

// The only import of Sandpack in the site: a separate chunk, client-only,
// requested when a demo is scrolled into view (or on tap on touch devices).
const SandpackDemo = dynamic(() => import("./SandpackDemo"), { ssr: false });

/** Phones / touch devices: never load automatically. Mirrors `.demo-load` in globals.css. */
const MANUAL = "(max-width: 767.98px), (pointer: coarse)";

const SOURCE_ROOT = "https://github.com/XueLe99/xuele-site/blob/main/src/lab/demos";

export function DemoSlot({
  demo,
  locale,
  file,
  labels,
  children,
}: {
  demo: DemoId;
  locale: string;
  file: string;
  labels: {
    load: string;
    loading: string;
    preview: string;
    viewSource: string;
    hideSource: string;
    viewOnGitHub: string;
  };
  /** Server-rendered source, revealed only by “View source” before Sandpack mounts. */
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  // The editor stays mounted for the 240ms collapse, then unloads.
  const [editorMounted, setEditorMounted] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const sourceId = `${demo}-source`;
  const onSandpackMount = useCallback(() => setMounted(true), []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  function toggleCode() {
    window.clearTimeout(closeTimer.current);
    if (codeOpen) {
      setCodeOpen(false);
      closeTimer.current = window.setTimeout(() => setEditorMounted(false), 240);
      return;
    }
    setEditorMounted(true);
    setCodeOpen(true);
  }

  useEffect(() => {
    const el = ref.current;
    if (!el || requested || window.matchMedia(MANUAL).matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setRequested(true);
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [requested]);

  return (
    <div
      ref={ref}
      className="demo-slot mt-6"
      data-demo-slot={demo}
      data-demo-state={mounted ? "live" : requested ? "loading" : "static"}
      data-code={codeOpen ? "open" : "closed"}
    >
      <div className="demo-actions">
        <a
          className="demo-github"
          href={`${SOURCE_ROOT}/${demo}/${file}`}
          target="_blank"
          rel="noopener noreferrer"
          title={labels.viewOnGitHub}
          aria-label={labels.viewOnGitHub}
        >
          <GithubIcon />
        </a>
        <button
          type="button"
          className="demo-source"
          data-magnetic
          aria-expanded={codeOpen}
          aria-controls={sourceId}
          onClick={toggleCode}
        >
          {codeOpen ? labels.hideSource : `</> ${labels.viewSource}`}
        </button>
      </div>

      <div className="demo-stage">
        {!mounted && (
          <div className="demo-static">
            <span className="sr-only">{labels.preview}</span>
            {!requested && (
              <button type="button" className="demo-load" onClick={() => setRequested(true)}>
                {labels.load}
              </button>
            )}
            {requested && (
              <p className="demo-wait" aria-live="polite">
                {labels.loading}
              </p>
            )}
          </div>
        )}
        {requested && (
          <div hidden={!mounted}>
            <SandpackDemo
              demo={demo}
              locale={locale}
              showCode={codeOpen}
              mountEditor={editorMounted}
              sourceId={sourceId}
              onMount={onSandpackMount}
            />
          </div>
        )}
      </div>

      {!mounted && (
        <div id={requested ? undefined : sourceId} className="demo-source-panel" aria-hidden={!codeOpen}>
          <div className="demo-source-clip">{children}</div>
        </div>
      )}
    </div>
  );
}
