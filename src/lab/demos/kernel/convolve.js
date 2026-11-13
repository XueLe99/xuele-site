// 3x3 convolution on RGBA pixels (ImageData.data).

/**
 * Slides a 3x3 kernel over the image. For every pixel and colour channel:
 *   out = sum(kernel[k] * neighbour[k]) / divisor
 * Pixels outside the image repeat the nearest edge pixel.
 * Returns a Float32Array (r, g, b per pixel) so negative results survive
 * until the caller decides how to display them.
 */
export function convolve(src, width, height, kernel, divisor = 1) {
  const out = new Float32Array(width * height * 3);
  const div = divisor || 1;
  for (let y = 0; y < height; y++) {
    const rows = [Math.max(0, y - 1), y, Math.min(height - 1, y + 1)];
    for (let x = 0; x < width; x++) {
      const cols = [Math.max(0, x - 1), x, Math.min(width - 1, x + 1)];
      let r = 0;
      let g = 0;
      let b = 0;
      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const weight = kernel[ky * 3 + kx];
          if (weight === 0) continue;
          const i = (rows[ky] * width + cols[kx]) * 4;
          r += src[i] * weight;
          g += src[i + 1] * weight;
          b += src[i + 2] * weight;
        }
      }
      const o = (y * width + x) * 3;
      out[o] = r / div;
      out[o + 1] = g / div;
      out[o + 2] = b / div;
    }
  }
  return out;
}

/** Float result -> displayable RGBA. `absolute` shows negative edges too. */
export function toPixels(values, absolute = false) {
  const out = new Uint8ClampedArray((values.length / 3) * 4);
  for (let i = 0, o = 0; i < values.length; i += 3, o += 4) {
    out[o] = absolute ? Math.abs(values[i]) : values[i];
    out[o + 1] = absolute ? Math.abs(values[i + 1]) : values[i + 1];
    out[o + 2] = absolute ? Math.abs(values[i + 2]) : values[i + 2];
    out[o + 3] = 255;
  }
  return out;
}

export const SOBEL_X = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
export const SOBEL_Y = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

/** Gradient magnitude sqrt(Gx^2 + Gy^2): edges in every direction. */
export function sobelMagnitude(src, width, height) {
  const gx = convolve(src, width, height, SOBEL_X);
  const gy = convolve(src, width, height, SOBEL_Y);
  const out = new Float32Array(gx.length);
  for (let i = 0; i < gx.length; i++) out[i] = Math.hypot(gx[i], gy[i]);
  return out;
}

export function toGray(src) {
  const out = new Uint8ClampedArray(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const y = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    out[i] = out[i + 1] = out[i + 2] = y;
    out[i + 3] = src[i + 3];
  }
  return out;
}

export const PRESETS = {
  identity: { kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0], divisor: 1 },
  sobelX: { kernel: SOBEL_X, divisor: 1, absolute: true },
  sobelY: { kernel: SOBEL_Y, divisor: 1, absolute: true },
  sobelMag: { kernel: SOBEL_X, divisor: 1, magnitude: true },
  sharpen: { kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0], divisor: 1 },
  boxBlur: { kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1], divisor: 9 },
  emboss: { kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2], divisor: 1 },
};
