// Procedural test scene: a night street drawn with Canvas 2D, then
// under-exposed and given sensor noise. No image files involved.

// Small seeded PRNG (mulberry32) so the scene is identical on every run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Draws the scene on `canvas` and returns its ImageData.
 * exposure: 1 = dusk, ~0.25 = badly under-exposed night shot.
 * noise:    amplitude of the per-pixel sensor noise (0-255 scale).
 */
export function drawNightScene(canvas, { exposure = 0.25, noise = 5, seed = 7 } = {}) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rand = mulberry32(seed);
  const horizon = Math.round(h * 0.68);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#1b2140");
  sky.addColorStop(0.7, "#3c466e");
  sky.addColorStop(1, "#7a6a78");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);

  // Stars
  for (let i = 0; i < 70; i++) {
    const x = rand() * w;
    const y = rand() * horizon * 0.7;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.65})`;
    ctx.fillRect(x, y, rand() < 0.2 ? 2 : 1, 1);
  }

  // Moon with a soft halo
  const mx = w * 0.8;
  const my = h * 0.17;
  const halo = ctx.createRadialGradient(mx, my, 2, mx, my, h * 0.22);
  halo.addColorStop(0, "rgba(255,244,214,0.55)");
  halo.addColorStop(1, "rgba(255,244,214,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, horizon);
  ctx.fillStyle = "#fff4d6";
  ctx.beginPath();
  ctx.arc(mx, my, h * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // Far skyline, then nearer buildings with windows
  let x = 0;
  while (x < w) {
    const bw = 14 + rand() * 26;
    const bh = h * (0.1 + rand() * 0.16);
    ctx.fillStyle = "#39405e";
    ctx.fillRect(x, horizon - bh, bw + 1, bh);
    x += bw;
  }
  x = -6;
  while (x < w) {
    const bw = 30 + rand() * 38;
    const bh = h * (0.2 + rand() * 0.3);
    const top = horizon - bh;
    const shade = 34 + Math.floor(rand() * 30);
    ctx.fillStyle = `rgb(${shade},${shade + 6},${shade + 24})`;
    ctx.fillRect(x, top, bw, bh);
    for (let wy = top + 6; wy < horizon - 8; wy += 9) {
      for (let wx = x + 5; wx < x + bw - 6; wx += 8) {
        const lit = rand() < 0.22;
        ctx.fillStyle = lit ? "#ffd98a" : `rgb(${shade + 22},${shade + 30},${shade + 52})`;
        ctx.fillRect(wx, wy, 4, 5);
      }
    }
    x += bw + 2 + rand() * 6;
  }

  // Road with perspective lane marks
  const road = ctx.createLinearGradient(0, horizon, 0, h);
  road.addColorStop(0, "#4a4c58");
  road.addColorStop(1, "#2a2b33");
  ctx.fillStyle = road;
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.fillStyle = "#c9c9c0";
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    const y = horizon + 10 + t * t * (h - horizon);
    const len = 8 + t * 26;
    ctx.fillRect(w * 0.5 - len / 2 - t * 40, y, len, 1.5 + t * 2.5);
  }
  ctx.fillStyle = "#6b6d78";
  ctx.fillRect(0, horizon, w, 3); // kerb

  // Street lamp: pole, head and a light cone on the road
  const lx = w * 0.27;
  const cone = ctx.createRadialGradient(lx + 12, horizon + 12, 2, lx + 12, horizon + 12, w * 0.24);
  cone.addColorStop(0, "rgba(255,214,140,0.6)");
  cone.addColorStop(1, "rgba(255,214,140,0)");
  ctx.fillStyle = cone;
  ctx.fillRect(0, horizon - h * 0.25, w, h);
  ctx.fillStyle = "#23252e";
  ctx.fillRect(lx, horizon - h * 0.36, 3, h * 0.36);
  ctx.fillRect(lx, horizon - h * 0.36, 16, 3);
  ctx.fillStyle = "#ffe9b8";
  ctx.fillRect(lx + 10, horizon - h * 0.36 + 3, 8, 3);

  // A parked car and a pedestrian: mid-contrast shapes that vanish in the dark
  const cx = w * 0.58;
  const cy = horizon + 6;
  ctx.fillStyle = "#7c3340";
  ctx.fillRect(cx, cy - 12, 54, 13);
  ctx.fillRect(cx + 10, cy - 21, 30, 10);
  ctx.fillStyle = "#9fb4c8";
  ctx.fillRect(cx + 13, cy - 19, 11, 7);
  ctx.fillRect(cx + 27, cy - 19, 11, 7);
  ctx.fillStyle = "#15161b";
  ctx.beginPath();
  ctx.arc(cx + 12, cy + 1, 5, 0, Math.PI * 2);
  ctx.arc(cx + 42, cy + 1, 5, 0, Math.PI * 2);
  ctx.fill();
  const px = w * 0.42;
  ctx.fillStyle = "#3f6b62";
  ctx.fillRect(px, horizon - 14, 7, 16);
  ctx.fillStyle = "#c9a58c";
  ctx.beginPath();
  ctx.arc(px + 3.5, horizon - 18, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2c2f3d";
  ctx.fillRect(px, horizon + 2, 3, 11);
  ctx.fillRect(px + 4, horizon + 2, 3, 11);

  // Under-expose and add noise, like a short exposure on a small sensor.
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * 2 * noise;
    d[i] = d[i] * exposure + n;
    d[i + 1] = d[i + 1] * exposure + n;
    d[i + 2] = d[i + 2] * exposure + n;
  }
  ctx.putImageData(image, 0, 0);
  return image;
}
