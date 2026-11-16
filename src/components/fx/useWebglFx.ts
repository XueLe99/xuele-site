"use client";

import { useEffect, useState } from "react";
import { useFx } from "@/components/fx/FxProvider";
import { afterLoadIdle } from "@/lib/after-load";
import { useCapability, useDesktopPointer, useWebGL2 } from "@/lib/capability";
import { useTheme } from "@/lib/prefs";

/**
 * Shared gate for the React Bits WebGL layers (hero Antigravity, Lab GridScan).
 *
 * `enabled` is false — the layer is not rendered and its chunk is never
 * requested — on the server, before window load + idle, with
 * prefers-reduced-motion or save-data, with the site's "Effects off" toggle,
 * in the light theme (static dot grid, like the starfield) and without WebGL2.
 * The page then keeps what it had: starfield or static poster.
 *
 * `desktop` is ≥768px with a fine pointer; phones get the lighter,
 * non-interactive settings.
 */
export function useWebglFx(): { enabled: boolean; desktop: boolean } {
  const { fxOff } = useFx();
  const theme = useTheme();
  const capability = useCapability();
  const webgl2 = useWebGL2();
  const desktop = useDesktopPointer();

  const [idle, setIdle] = useState(false);
  useEffect(() => afterLoadIdle(() => setIdle(true)), []);

  return {
    enabled: idle && !fxOff && theme === "dark" && capability !== "poster" && webgl2,
    desktop,
  };
}
