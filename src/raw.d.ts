// `?raw` imports return the file contents as a string (see next.config.ts).
declare module "*?raw" {
  const source: string;
  export default source;
}
