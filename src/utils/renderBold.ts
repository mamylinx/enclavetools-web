/**
 * Convert **bold** markdown to <strong> tags.
 * HTML-escapes the input first to prevent XSS when used with v-html / set:html.
 */
export function renderBold(text: string | null | undefined): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Strip **bold** markers (for contexts where HTML is not wanted, e.g. truncated previews).
 */
export function stripBold(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\*\*(.+?)\*\*/g, '$1');
}
