/**
 * How many lines a row of items `widths` wide breaks into in `width`, `gap` apart, as
 * `flex-wrap` breaks them: each line takes items until the next would overflow it. An item wider
 * than the row still takes a line of its own.
 */
export function wrapLines(widths: readonly number[], width: number, gap: number) {
  let lines = 0
  let used = 0
  for (const itemWidth of widths) {
    if (lines === 0 || used + gap + itemWidth > width) {
      lines += 1
      used = itemWidth
    } else {
      used += gap + itemWidth
    }
  }
  return Math.max(1, lines)
}
