/** Deterministic star tile for the static poster (no assets, same on server and client). */

export interface PosterStar {
  x: number;
  y: number;
  r: number;
  o: number;
  color: string;
}

export const POSTER_TILE = 480;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, p = 10) => Math.round(n * p) / p;

function generate(count: number): PosterStar[] {
  const rand = mulberry32(20260214);
  return Array.from({ length: count }, () => {
    const tint = rand();
    const size = rand();
    return {
      x: round(rand() * POSTER_TILE),
      y: round(rand() * POSTER_TILE),
      // Mostly far stars, a few mid and near ones.
      r: size < 0.75 ? 0.5 : size < 0.95 ? 0.8 : 1.2,
      o: round(0.35 + rand() * 0.55, 100),
      // 70% white, 20% cool, 10% warm — same palette as the WebGL starfield.
      color: tint < 0.7 ? "#FFFFFF" : tint < 0.9 ? "#CFE8FF" : "#FFE9C4",
    };
  });
}

export const POSTER_STARS = generate(56);
