/** Format a memory value in GB (or TB when >= 1000) for display. */
export function fmt(gb: number | null | undefined): string {
  if (gb === null || gb === undefined) return '—';
  if (gb >= 1000) return (gb / 1000).toFixed(2) + ' TB';
  return gb.toFixed(1) + ' GB';
}

/** Format a byte count as GB. */
export function fmtBytes(b: number): string {
  return fmt(b / 1e9);
}
