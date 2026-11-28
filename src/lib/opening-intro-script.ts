/** sessionStorage key: set when the opening intro starts (once per session). */
export const INTRO_SEEN_KEY = "xl-intro";

/**
 * Blocking inline script for <head>, after the no-flash script (it reads
 * `data-fx`). Before first paint it marks `<html data-intro="skip">` when the
 * opening intro must not show: already seen this session, effects off or
 * reduced motion. motion.css then never paints the overlay.
 */
export const introGateScript = `(function(){var d=document.documentElement;try{if(sessionStorage.getItem(${JSON.stringify(
  INTRO_SEEN_KEY,
)})||d.getAttribute("data-fx")==="off"||matchMedia("(prefers-reduced-motion: reduce)").matches)d.setAttribute("data-intro","skip")}catch(e){d.setAttribute("data-intro","skip")}})()`;
