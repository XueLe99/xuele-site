"use client";

import { useSyncExternalStore } from "react";
import { STORAGE, THEME_COLOR } from "@/config";

/**
 * Client-side preference stores (theme + effects). The DOM (<html> class /
 * data-fx, written pre-paint by the no-flash script) is the source of truth;
 * localStorage only persists it. Components subscribe via useSyncExternalStore,
 * so the server render uses the defaults and hydration never mismatches.
 */

export type Theme = "dark" | "light";

const EVENT = "prefs:change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", syncFromStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", syncFromStorage);
  };
}

function emit() {
  window.dispatchEvent(new Event(EVENT));
}

function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / storage disabled: the choice lasts for this page only.
  }
}

/* ---------------------------------- theme --------------------------------- */

function readTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_COLOR[theme]);
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  store(STORAGE.theme, theme);
  emit();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}

/* --------------------------------- effects -------------------------------- */

function readFxOff(): boolean {
  return document.documentElement.dataset.fx === "off";
}

function applyFxOff(off: boolean) {
  if (off) document.documentElement.dataset.fx = "off";
  else delete document.documentElement.dataset.fx;
}

export function setFxOff(off: boolean) {
  applyFxOff(off);
  store(STORAGE.fxOff, off ? "1" : "0");
  emit();
}

export function useFxOffStore(): boolean {
  return useSyncExternalStore(subscribe, readFxOff, () => false);
}

/* ------------------------- cross-tab synchronisation ----------------------- */

function syncFromStorage(event: StorageEvent) {
  if (event.key === STORAGE.theme) {
    applyTheme(event.newValue === "light" ? "light" : "dark");
    emit();
  } else if (event.key === STORAGE.fxOff) {
    applyFxOff(event.newValue === "1");
    emit();
  }
}
