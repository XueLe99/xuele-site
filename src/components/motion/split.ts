/**
 * Class names for SplitText wrappers. motion.css makes them inherit the
 * line-height of the element they split (the site's `:lang(en)` rule would
 * otherwise hit every wrapper <div> and change the height of the text).
 */
export const SPLIT_CLASSES = {
  charsClass: "split-char",
  wordsClass: "split-word",
  linesClass: "split-line",
} as const;

/**
 * Left edge of every non-whitespace character of `el`, measured on the
 * unsplit text. SplitText's per-character boxes lose kerning; shifting each box
 * back onto these positions keeps the split and unsplit renderings identical,
 * so reverting the split does not move a single glyph.
 */
export function charLefts(el: Element): number[] {
  const lefts: number[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    let offset = 0;
    for (const char of text) {
      if (char.trim()) {
        range.setStart(node, offset);
        range.setEnd(node, offset + char.length);
        lefts.push(range.getBoundingClientRect().left);
      }
      offset += char.length;
    }
  }
  return lefts;
}
