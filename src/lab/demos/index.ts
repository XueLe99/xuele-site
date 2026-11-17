/**
 * The lab demos. Each demo is plain, readable source in ./<name>/ (plus the
 * shared scene and stylesheet); the files are imported as strings and handed
 * to Sandpack, where they run in the React template.
 *
 * Client-only (imported by the lazy Sandpack chunk). Server components use
 * ./core, which has the ids, the colours and the core algorithm sources.
 */
import kernelApp from "./kernel/App.js?raw";
import convolve from "./kernel/convolve.js?raw";
import lowLightApp from "./low-light/App.js?raw";
import enhance from "./low-light/enhance.js?raw";
import pathfindingApp from "./pathfinding/App.js?raw";
import dstar from "./pathfinding/dstar.js?raw";
import grid from "./pathfinding/grid.js?raw";
import search from "./pathfinding/search.js?raw";
import scene from "./shared/scene.js?raw";
import styles from "./shared/styles.css?raw";

import type { DemoId } from "./core";

export interface DemoSource {
  /** Core algorithm file: active editor tab and the static placeholder. */
  core: string;
  /** Sandpack files, in tab order. */
  files: Record<string, string>;
}

export const DEMOS: Record<DemoId, DemoSource> = {
  "low-light": {
    core: "/enhance.js",
    files: {
      "/enhance.js": enhance,
      "/App.js": lowLightApp,
      "/scene.js": scene,
      "/styles.css": styles,
    },
  },
  kernel: {
    core: "/convolve.js",
    files: {
      "/convolve.js": convolve,
      "/App.js": kernelApp,
      "/scene.js": scene,
      "/styles.css": styles,
    },
  },
  pathfinding: {
    core: "/search.js",
    files: {
      "/search.js": search,
      "/grid.js": grid,
      "/dstar.js": dstar,
      "/App.js": pathfindingApp,
      "/styles.css": styles,
    },
  },
};
