"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useFx } from "@/components/fx/FxProvider";
import { usePathname } from "@/i18n/navigation";
import { afterLoadIdle } from "@/lib/after-load";
import { useCapability } from "@/lib/capability";
import { useTheme } from "@/lib/prefs";

export type BackgroundTier = "poster" | "lite" | "webgl";

export interface StarfieldProps {
  /** Called after the first frame is drawn; starts the 600ms fade-in. */
  onReady: () => void;
  /** Called when the renderer can no longer draw (WebGL context lost). */
  onLost?: () => void;
}

type LiveTier = Exclude<BackgroundTier, "poster">;
type Starfield = ComponentType<StarfieldProps>;

// Separate chunks: neither three/R3F nor the 2D canvas is in the first-load JS.
const LOADERS: Record<LiveTier, () => Promise<{ default: Starfield }>> = {
  lite: () => import("./StarfieldLite"),
  webgl: () => import("./StarfieldWebGL"),
};

/**
 * Picks the background tier on the client and mounts it above the poster:
 *
 *   poster  SSR default; reduced motion, effects off, save-data, light theme
 *           (dot grid), and every page except the homepage
 *   lite    Canvas 2D — <768px, coarse pointer, no WebGL, ≤4 logical cores
 *   webgl   R3F starfield — desktop
 *
 * Re-evaluated whenever the effects toggle, the theme or a media query changes.
 * The live tier is only imported after window load + requestIdleCallback.
 */
export function BackgroundLive() {
  const { fxOff } = useFx();
  const theme = useTheme();
  const capability = useCapability();
  const isHome = usePathname() === "/";

  const [idle, setIdle] = useState(false);
  const [webglLost, setWebglLost] = useState(false);
  const [loaded, setLoaded] = useState<Partial<Record<LiveTier, Starfield>>>({});

  const tier: BackgroundTier =
    fxOff || theme === "light" || !isHome
      ? "poster"
      : capability === "webgl" && webglLost
        ? "lite"
        : capability;

  useEffect(() => afterLoadIdle(() => setIdle(true)), []);

  useEffect(() => {
    if (!idle || tier === "poster" || loaded[tier]) return;
    let cancelled = false;
    LOADERS[tier]().then(
      (mod) => {
        if (!cancelled) setLoaded((prev) => ({ ...prev, [tier]: mod.default }));
      },
      () => {
        // Chunk failed to load: the poster simply stays.
      },
    );
    return () => {
      cancelled = true;
    };
  }, [idle, tier, loaded]);

  const Live = tier === "poster" ? undefined : loaded[tier];

  return (
    <div className="bg-live" data-starfield-slot data-tier={tier}>
      {Live && (
        <LiveLayer
          key={tier}
          Starfield={Live}
          onLost={tier === "webgl" ? () => setWebglLost(true) : undefined}
        />
      )}
    </div>
  );
}

function LiveLayer({
  Starfield,
  onLost,
}: {
  Starfield: Starfield;
  onLost?: () => void;
}) {
  const [on, setOn] = useState(false);
  return (
    <div className="bg-live-layer" data-on={on ? "" : undefined}>
      <Starfield onReady={() => setOn(true)} onLost={onLost} />
      {/* Readability: dark radial vignette under the text column. */}
      <div className="bg-vignette" />
    </div>
  );
}
