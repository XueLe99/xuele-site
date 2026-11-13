"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { setFxOff, useFxOffStore } from "@/lib/prefs";

export interface FxState {
  /** True when the visitor turned effects off (localStorage "fx-off" = "1"). */
  fxOff: boolean;
  setFxOff: (off: boolean) => void;
  toggleFx: () => void;
}

const FxContext = createContext<FxState | null>(null);

/**
 * Exposes the "Effects off" preference. Later phases (starfield, scroll
 * animations, lab demos) read it with useFx() and render their static
 * fallback when fxOff is true. CSS can use `html[data-fx="off"]`.
 */
export function FxProvider({ children }: { children: ReactNode }) {
  const fxOff = useFxOffStore();
  const value = useMemo<FxState>(
    () => ({ fxOff, setFxOff, toggleFx: () => setFxOff(!fxOff) }),
    [fxOff],
  );
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

export function useFx(): FxState {
  const ctx = useContext(FxContext);
  if (!ctx) throw new Error("useFx must be used inside <FxProvider>");
  return ctx;
}
