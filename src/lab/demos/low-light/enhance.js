// Low-light enhancement on raw RGBA pixels (ImageData.data).
// Every function takes a Uint8ClampedArray and returns a new one.

/** Rec. 601 luma of every pixel, 0-255. */
export function luminance(src) {
  const gray = new Uint8ClampedArray(src.length / 4);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    gray[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  }
  return gray;
}

/** 256-bin histogram of a gray image. */
export function histogram(gray) {
  const hist = new Uint32Array(256);
  for (let p = 0; p < gray.length; p++) hist[gray[p]]++;
  return hist;
}

export function grayscale(src) {
  const gray = luminance(src);
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    out[i] = out[i + 1] = out[i + 2] = gray[p];
    out[i + 3] = src[i + 3];
  }
  return out;
}

/** out = 255 * (in / 255) ^ gamma. gamma < 1 lifts the shadows. */
export function gammaCorrect(src, gamma) {
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = 255 * Math.pow(v / 255, gamma);
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    out[i] = lut[src[i]];
    out[i + 1] = lut[src[i + 1]];
    out[i + 2] = lut[src[i + 2]];
    out[i + 3] = src[i + 3];
  }
  return out;
}

/**
 * Turns a histogram into a lookup table through its cumulative distribution.
 * `limit` clips every bin first and spreads the excess evenly over all bins,
 * which caps the slope of the mapping (= how much contrast and noise can be
 * amplified). Infinity means plain histogram equalization.
 */
function equalizationLut(hist, total, limit = Infinity) {
  let excess = 0;
  for (let v = 0; v < 256; v++) {
    if (hist[v] > limit) excess += hist[v] - limit;
  }
  const bonus = excess / 256;
  const lut = new Uint8ClampedArray(256);
  let sum = 0;
  for (let v = 0; v < 256; v++) {
    sum += Math.min(hist[v], limit) + bonus;
    lut[v] = (255 * sum) / total;
  }
  return lut;
}

/** Writes a new luminance while keeping each pixel's colour ratios. */
function applyLuminance(src, gray, newGray) {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0, p = 0; i < src.length; i += 4, p++) {
    const y = gray[p];
    const target = newGray(p, y);
    if (y === 0) {
      out[i] = out[i + 1] = out[i + 2] = target;
    } else {
      const gain = target / y;
      out[i] = src[i] * gain;
      out[i + 1] = src[i + 1] * gain;
      out[i + 2] = src[i + 2] * gain;
    }
    out[i + 3] = src[i + 3];
  }
  return out;
}

/** Global histogram equalization of the luminance channel. */
export function equalize(src) {
  const gray = luminance(src);
  const lut = equalizationLut(histogram(gray), gray.length);
  return applyLuminance(src, gray, (p, y) => lut[y]);
}

/**
 * CLAHE-lite: contrast-limited adaptive histogram equalization.
 *  1. Split the image into tiles x tiles regions.
 *  2. Build a clipped-histogram LUT for every tile.
 *  3. Map each pixel through the LUTs of the 4 nearest tile centres and
 *     blend them bilinearly, so no tile borders show.
 * clipLimit is a multiple of the average bin height (1 = almost no change).
 */
export function clahe(src, width, height, tiles = 8, clipLimit = 3) {
  const gray = luminance(src);
  const tileW = width / tiles;
  const tileH = height / tiles;

  const luts = [];
  for (let ty = 0; ty < tiles; ty++) {
    const y0 = Math.floor(ty * tileH);
    const y1 = Math.floor((ty + 1) * tileH);
    for (let tx = 0; tx < tiles; tx++) {
      const x0 = Math.floor(tx * tileW);
      const x1 = Math.floor((tx + 1) * tileW);
      const hist = new Uint32Array(256);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) hist[gray[y * width + x]]++;
      }
      const total = Math.max(1, (x1 - x0) * (y1 - y0));
      const limit = Math.max(1, (clipLimit * total) / 256);
      luts.push(equalizationLut(hist, total, limit));
    }
  }

  const last = tiles - 1;
  return applyLuminance(src, gray, (p, y) => {
    // Pixel position measured in tiles, relative to the tile centres.
    const fx = ((p % width) + 0.5) / tileW - 0.5;
    const fy = (Math.floor(p / width) + 0.5) / tileH - 0.5;
    const tx = Math.floor(fx);
    const ty = Math.floor(fy);
    const wx = fx - tx;
    const wy = fy - ty;
    const xa = Math.max(0, tx);
    const xb = Math.min(last, tx + 1);
    const ya = Math.max(0, ty);
    const yb = Math.min(last, ty + 1);
    const top = luts[ya * tiles + xa][y] * (1 - wx) + luts[ya * tiles + xb][y] * wx;
    const bottom = luts[yb * tiles + xa][y] * (1 - wx) + luts[yb * tiles + xb][y] * wx;
    return top * (1 - wy) + bottom * wy;
  });
}
