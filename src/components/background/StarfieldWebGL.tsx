"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { StarfieldProps } from "./BackgroundLive";
import { createSkyScene, type SkyScene } from "./sky-scene";
import { startThrottledLoop } from "./star-utils";

/**
 * Desktop WebGL starfield (React Three Fiber). This module — and with it three
 * and R3F — is only ever reached through the dynamic import in
 * BackgroundLive.tsx, after window load + requestIdleCallback.
 *
 * Rendering is on demand: the canvas only draws when our own loop invalidates
 * it, which caps the sky at ~30fps and stops it while the tab is hidden.
 */
export default function StarfieldWebGL(props: StarfieldProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      resize={{ scroll: false }}
      camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 0, 0] }}
      gl={{
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Sky {...props} />
    </Canvas>
  );
}

function Sky({ onReady, onLost }: StarfieldProps) {
  const root = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  const skyRef = useRef<SkyScene | null>(null);
  const dtRef = useRef(0);
  const readyRef = useRef(false);
  const callbacks = useRef({ onReady, onLost });
  useEffect(() => {
    callbacks.current = { onReady, onLost };
  });

  useEffect(() => {
    const scene = createSkyScene();
    skyRef.current = scene;
    root.add(scene.group);

    const stopLoop = startThrottledLoop((dt) => {
      dtRef.current = dt;
      invalidate();
    });

    const canvas = gl.domElement;
    const onContextLost = () => callbacks.current.onLost?.();
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      stopLoop();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      root.remove(scene.group);
      scene.dispose();
      skyRef.current = null;
    };
  }, [root, gl, invalidate]);

  useFrame(({ size, viewport, camera }) => {
    const scene = skyRef.current;
    if (!scene) return;
    scene.update({
      dt: dtRef.current,
      width: size.width,
      height: size.height,
      dpr: viewport.dpr,
      camera,
    });
    dtRef.current = 0;
    if (!readyRef.current) {
      readyRef.current = true;
      // The frame is on screen after this render: start the fade-in next tick.
      requestAnimationFrame(() => callbacks.current.onReady());
    }
  });

  return null;
}
