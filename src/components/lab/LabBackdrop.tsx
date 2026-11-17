"use client";

import dynamic from "next/dynamic";
import { useWebglFx } from "@/components/fx/useWebglFx";

// React Bits GridScan (src/components/GridScan.tsx): its own chunk,
// client-only, requested after window load + idle on the Lab page only.
const GridScan = dynamic(() => import("@/components/GridScan"), { ssr: false });

/**
 * Lab page background: the grid scan is the only effect here (the starfield
 * already stays on its static poster outside the homepage, and this layer's
 * solid base covers that poster).
 *
 * Privacy: `enableWebcam` and `enableGyro` are hard-coded to false. In
 * GridScan.tsx the face-api.js script, its model weights and getUserMedia are
 * only reached inside the `enableWebcam` effect, and the device-orientation
 * permission prompt only behind `enableGyro` — so no camera, no motion sensor
 * and no request to the jsDelivr CDN ever happens.
 *
 * Not rendered when useWebglFx() says no; the page keeps the static poster.
 */
export function LabBackdrop() {
  const { enabled, desktop } = useWebglFx();
  if (!enabled) return null;

  return (
    <div className="lab-fx" aria-hidden="true" data-lab-fx>
      <div className="lab-fx-canvas">
        <GridScan
          linesColor="#2A3145"
          scanColor="#6EE7F2"
          cells={desktop ? 10 : 6}
          // Slow sweep: 6s across, 4s rest (component defaults are 2.4s / 1.6s).
          scanDuration={6}
          scanDelay={4}
          glow={0.5}
          enableWebcam={false}
          enableGyro={false}
          interactive={desktop}
          // The click ping is not gated by `interactive` in the component.
          clickEffect={desktop ? "ping" : "none"}
          dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
        />
      </div>
      <div className="lab-fx-veil" />
    </div>
  );
}
