/**
 * Server-safe part of the lab demos: ids, editor colours and the core
 * algorithm file of each demo (rendered as the static placeholder).
 * The full Sandpack file sets are in ./index (client-only chunk).
 */
import convolve from "./kernel/convolve.js?raw";
import enhance from "./low-light/enhance.js?raw";
import search from "./pathfinding/search.js?raw";

export type DemoId = "low-light" | "kernel" | "pathfinding";

export const CORE_SOURCE: Record<DemoId, string> = {
  "low-light": enhance,
  kernel: convolve,
  pathfinding: search,
};

export const isDemoId = (id: string): id is DemoId => id in CORE_SOURCE;

/** Editor colours, shared by the Sandpack theme and the static placeholder. */
export const CODE_COLORS = {
  bg: "#070A12",
  surface: "#11151F",
  border: "#1E2433",
  text: "#F3F3F6",
  muted: "#9AA0B4",
  comment: "#6F7690",
  primary: "#6EE7F2",
  accent: "#E8C56B",
  string: "#A5E8B4",
  property: "#B9C4F5",
} as const;
