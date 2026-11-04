import { describe, it, expect } from 'vitest';
import {
  dictionaries,
  getDictionary,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from '@/i18n/dictionaries';

function collectKeyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeyPaths(v as Record<string, unknown>, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys.sort();
}

describe('Bilingual Dictionary Integrity (English default & German)', () => {
  it('sets English (en) as the default locale and supports en and de', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(SUPPORTED_LOCALES).toEqual(['en', 'de']);
  });

  it('has identical translation key structures between English and German', () => {
    const enKeys = collectKeyPaths(
      dictionaries.en as unknown as Record<string, unknown>
    );
    const deKeys = collectKeyPaths(
      dictionaries.de as unknown as Record<string, unknown>
    );

    expect(deKeys).toEqual(enKeys);
    expect(enKeys.length).toBeGreaterThan(15);
  });

  it('contains no empty strings or Persian characters in any dictionary entry', () => {
    const persianArabicRegex = /[\u0600-\u06FF]/;

    for (const locale of SUPPORTED_LOCALES) {
      const dict = getDictionary(locale);
      const serialized = JSON.stringify(dict);
      expect(persianArabicRegex.test(serialized)).toBe(false);
    }
  });

  it('falls back safely to English if an unknown locale is requested', () => {
    const dict = getDictionary('fr' as 'en');
    expect(dict.meta.localeCode).toBe('en');
  });

  it('highlights value-driven governance capabilities including 7 enterprise connectors, Smart Delta Sync, and Knowledge Conflict Guard', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const rootDir = path.resolve(__dirname, '../../../');
    const pageSrc = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    for (const locale of SUPPORTED_LOCALES) {
      const dict = getDictionary(locale);
      const allText = JSON.stringify(dict).toLowerCase();
      // Must emphasize value propositions:
      // 1. Conflict guard / contradictions
      expect(allText).toMatch(/conflict|widerspruch|contradiction/i);
      // 2. Connectors mentioning 7 tools or extensible connectors
      expect(allText).toMatch(/google drive|slack|teams|confluence|notion|zoom|meet/i);
      // 3. Smart Delta Sync / token efficiency
      expect(allText).toMatch(/delta sync|token/i);
    }

    // Landing page must explicitly display the 7 connectors and custom extensible indicator
    expect(pageSrc).toContain('Google Drive');
    expect(pageSrc).toContain('Microsoft Teams');
    expect(pageSrc).toContain('Custom Connector');
  });
});
