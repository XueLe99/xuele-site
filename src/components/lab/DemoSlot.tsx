"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DemoId } from "@/lab/demos/core";

// The only import of Sandpack in the site: a separate chunk, client-only,
// requested when a demo is scrolled into view (or on tap on touch devices).
const SandpackDemo = dynamic(() => import("./SandpackDemo"), { ssr: false });

/** Phones / touch devices: never load automatically. Mirrors `.demo-load` in globals.css. */
const MANUAL = "(max-width: 767.98px), (pointer: coarse)";

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
  labels: { load: string; loading: string; preview: string };
  /** Server-rendered highlighted code, shown until Sandpack has mounted. */
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    >
      {!mounted && (
        <div className="demo-static">
          <div className="demo-bar">
            <span className="demo-tab">{file}</span>
            <span className="demo-status" aria-live="polite">
              {requested ? labels.loading : labels.preview}
            </span>
            {!requested && (
              <button type="button" className="demo-load" onClick={() => setRequested(true)}>
                {labels.load}
              </button>
            )}
          </div>
          {children}
        </div>
      )}
      {requested && (
        <div hidden={!mounted}>
          <SandpackDemo demo={demo} locale={locale} onMount={() => setMounted(true)} />
        </div>
      )}
    </div>
  );
}
