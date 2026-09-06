/**
 * Academic session naming: Fall-25 → Spring-26 → Fall-26 → Spring-27 → …
 * Fall of year N is followed by Spring of year N+1; Spring of year N by Fall of year N.
 */
export function nextSessionName(current: string): string {
  const m = current.trim().match(/^(fall|spring)[-\s]?(\d{2,4})$/i);
  if (!m) return current; // unrecognized format — leave unchanged

  const term = m[1].toLowerCase();
  const year = parseInt(m[2], 10);
  const yy = (y: number) => String(((y % 100) + 100) % 100).padStart(2, "0");

  return term === "fall" ? `Spring-${yy(year + 1)}` : `Fall-${yy(year)}`;
}
