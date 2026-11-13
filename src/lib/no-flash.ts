import { STORAGE, THEME_COLOR } from "@/config";

/**
 * Blocking inline script for <head>. Runs before first paint:
 * - applies the stored theme (default: dark) as a class on <html> and syncs theme-color
 * - sets <html data-fx="off"> when effects were disabled
 * Keep in sync with src/lib/prefs.ts.
 */
export const noFlashScript = `(function(){try{var d=document.documentElement,s=localStorage;if(s.getItem(${JSON.stringify(
  STORAGE.theme,
)})==="light"){d.classList.remove("dark");d.classList.add("light");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",${JSON.stringify(
  THEME_COLOR.light,
)})}if(s.getItem(${JSON.stringify(
  STORAGE.fxOff,
)})==="1")d.setAttribute("data-fx","off")}catch(e){}})()`;
