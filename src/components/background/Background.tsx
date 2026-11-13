import { POSTER_STARS, POSTER_TILE } from "./poster-stars";

/**
 * Fixed layer behind all content.
 *
 * Phase 1 renders only the static poster: CSS radial gradients + a tiled
 * inline-SVG star pattern in dark mode, a dot grid in light mode. It is also
 * the permanent fallback for reduced-motion / effects-off / save-data.
 *
 * Later phases mount the WebGL / Canvas-2D starfield into the
 * `[data-starfield-slot]` element (client-only, loaded after first paint) and
 * fade it in above the poster, so there is never a black block.
 */
export function Background() {
  return (
    <div className="bg-root" aria-hidden="true" data-background>
      <div className="bg-poster" data-background-poster>
        <div className="bg-poster-gradients" />
        <svg className="bg-poster-stars" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="poster-stars"
              width={POSTER_TILE}
              height={POSTER_TILE}
              patternUnits="userSpaceOnUse"
            >
              {POSTER_STARS.map((s, i) => (
                <circle
                  key={i}
                  cx={s.x}
                  cy={s.y}
                  r={s.r}
                  fill={s.color}
                  opacity={s.o}
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#poster-stars)" />
        </svg>
        <div className="bg-poster-grid" />
      </div>
      {/* Slot for the animated starfield (later phase). */}
      <div className="absolute inset-0" data-starfield-slot />
    </div>
  );
}
