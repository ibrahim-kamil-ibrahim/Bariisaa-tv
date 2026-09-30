import { sanitizeSearchInput, sanitizeHtmlInput } from './sanitizer';

describe('sanitizeSearchInput', () => {
  it('removes angle brackets (XSS)', () => {
    expect(sanitizeSearchInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  it('removes control characters', () => {
    expect(sanitizeSearchInput('hel\x00lo\x1F world')).toBe('hello world');
  });

  it('trims whitespace', () => {
    expect(sanitizeSearchInput('   tolrqaa   ')).toBe('tolrqaa');
  });

  it('limits input to 100 characters', () => {
    const long = 'a'.repeat(250);
    expect(sanitizeSearchInput(long)).toHaveLength(100);
  });

  it('keeps normal text intact', () => {
    expect(sanitizeSearchInput('Bariisaa Tv audio books')).toBe('Bariisaa Tv audio books');
  });
});

describe('sanitizeHtmlInput', () => {
  it('escapes HTML special characters', () => {
    expect(sanitizeHtmlInput('<b>"bold" & \'text\'</b>')).toBe(
      '&lt;b&gt;&quot;bold&quot; &amp; &#x27;text&#x27;&lt;/b&gt;'
    );
  });

  it('escapes a script injection payload', () => {
    expect(sanitizeHtmlInput("'><script>alert(1)</script>")).toBe(
      '&#x27;&gt;&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });

  it('keeps plain text untouched', () => {
    expect(sanitizeHtmlInput('plain text')).toBe('plain text');
  });
});
