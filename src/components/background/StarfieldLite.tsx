"use client";

import { useEffect, useRef } from "react";
import type { StarfieldProps } from "./BackgroundLive";
import {
  STAR_COLORS,
  mulberry32,
  pickColorIndex,
  startThrottledLoop,
} from "./star-utils";
import { sky } from "@/lib/sky-store";

/**
 * Canvas-2D "lite" starfield for phones, coarse pointers, low-core CPUs and
 * browsers without WebGL: 150 stars in 2 layers, scroll-only parallax
 * (0.1x / 0.3x), a third of the stars twinkle, 30fps, paused while hidden.
 * No nebula, no meteors, no pointer tracking.
 */

interface Star {
  x: number; // 0..1 of the width
  y: number; // 0..1 of the height
  r: number; // radius, CSS px
  alpha: number;
  color: string;
  factor: number; // scroll parallax
  speed: number; // twinkle rad/s, 0 = steady
  seed: number;
  near: boolean; // near layer: steps aside under the hero particles
}

const LAYERS = [
  { count: 100, factor: 0.1, size: [0.5, 0.8], alpha: [0.35, 0.7] },
  { count: 50, factor: 0.3, size: [0.9, 1.3], alpha: [0.6, 1] },
] as const;

function makeStars(): Star[] {
  const rand = mulberry32(20260301);
  const lerp = (range: readonly [number, number]) =>
    range[0] + rand() * (range[1] - range[0]);
  return LAYERS.flatMap((layer) =>
    Array.from({ length: layer.count }, () => ({
      x: rand(),
      y: rand(),
      r: lerp(layer.size),
      alpha: lerp(layer.alpha),
      color: STAR_COLORS[pickColorIndex(rand())],
      factor: layer.factor,
      near: layer === LAYERS[LAYERS.length - 1],
      // 1/3 of the stars twinkle with a 2–5s period.
      speed: rand() < 1 / 3 ? (Math.PI * 2) / (2 + rand() * 3) : 0,
      seed: rand() * Math.PI * 2,
    })),
  );
}

export default function StarfieldLite({ onReady }: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const stars = makeStars();
    let width = 0;
    let height = 0;
    let time = 0;
    let ready = false;
    let near = 1 - sky.hero;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // The mobile URL bar resizes the viewport while scrolling: ignore height-only jitter.
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w === width && Math.abs(h - height) < 120) return;
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const stop = startThrottledLoop((dt) => {
      time += dt;
      const scroll = window.scrollY;
      ctx.clearRect(0, 0, width, height);
      // Hero: the near layer fades out under the Antigravity particles.
      near += (1 - sky.hero - near) * 0.2;
      for (const s of stars) {
        if (s.near && near < 0.01) continue;
        const span = height + 8;
        const y = ((((s.y * span - scroll * s.factor) % span) + span) % span) - 4;
        const twinkle = s.speed
          ? 0.8 + 0.2 * Math.sin(time * s.speed + s.seed) // 0.6–1.0
          : 1;
        ctx.globalAlpha = s.alpha * twinkle * (s.near ? near : 1);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x * width, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!ready) {
        ready = true;
        onReadyRef.current();
      }
    });

    return () => {
      stop();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" />;
}
