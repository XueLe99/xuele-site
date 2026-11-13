import { BackgroundLive } from "./BackgroundLive";
import { POSTER_STARS, POSTER_TILE } from "./poster-stars";

/**
 * Fixed layer behind all content.
 *
 * The static poster (CSS radial gradients + a tiled inline-SVG star pattern in
 * dark mode, a dot grid in light mode) is server-rendered and always stays in
 * the DOM. It is the permanent background for reduced-motion / effects-off /
 * save-data / light theme, and sits underneath the animated tiers, which
 * <BackgroundLive /> picks on the client and fades in above it — so there is
 * never a black block.
 *
 * `live={false}` renders the poster only (global-not-found, which has no
 * providers).
 */
export function Background({ live = true }: { live?: boolean }) {
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
      {live && <BackgroundLive />}
    </div>
  );
}
