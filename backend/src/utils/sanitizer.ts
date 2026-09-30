export function sanitizeSearchInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x1F && code !== 0x7F;
    })
    .join('')
    .trim()
    .slice(0, 100);
}

export function sanitizeHtmlInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
