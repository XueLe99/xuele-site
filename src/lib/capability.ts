"use client";

import { useSyncExternalStore } from "react";

/**
 * Device / preference capability, re-evaluated when a media query flips.
 * The server snapshot is always the most conservative value, so SSR and
 * hydration render the static fallback.
 */

/** Best background the device can run (before theme / effects-off are applied). */
export type Capability = "poster" | "lite" | "webgl";

const REDUCED = "(prefers-reduced-motion: reduce)";
const NARROW = "(max-width: 767.98px)";
const FINE = "(pointer: fine)";
const QUERIES = [REDUCED, NARROW, FINE];

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
}

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  const conn = connection();
  conn?.addEventListener("change", onChange);
  return () => {
    lists.forEach((l) => l.removeEventListener("change", onChange));
    conn?.removeEventListener("change", onChange);
  };
}

const matches = (query: string) => window.matchMedia(query).matches;

let webgl: boolean | undefined;
function hasWebGL(): boolean {
  if (webgl === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webgl = !!gl;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

function readCapability(): Capability {
  if (matches(REDUCED) || connection()?.saveData) return "poster";
  if (
    matches(NARROW) ||
    !matches(FINE) ||
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    !hasWebGL()
  ) {
    return "lite";
  }
  return "webgl";
}

export function useCapability(): Capability {
  return useSyncExternalStore(subscribe, readCapability, () => "poster");
}

/** True on the server and for visitors who prefer reduced motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => matches(REDUCED),
    () => true,
  );
}

/** ≥768px with a fine pointer (mouse / trackpad). False on the server. */
export function useDesktopPointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !matches(NARROW) && matches(FINE),
    () => false,
  );
}
