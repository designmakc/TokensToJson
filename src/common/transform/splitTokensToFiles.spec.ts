import { describe, expect, test } from 'vitest';

import { splitTokensToFiles } from './splitTokensToFiles';

describe('splitTokensToFiles', () => {
  test('splitByCollection: one file per collection', () => {
    const files = splitTokensToFiles(
      { Colors: { red: { $value: '#f00' } }, Sizes: { sm: { $value: '4px' } } },
      true,
      false
    );
    expect(files.map((f) => f.path)).toEqual([
      'Colors.tokens.json',
      'Sizes.tokens.json',
    ]);
    expect(JSON.parse(files[0].json)).toEqual({
      Colors: { red: { $value: '#f00' } },
    });
  });

  test('splitByMode: "Collection/Mode" keys become nested paths', () => {
    const files = splitTokensToFiles(
      { 'Colors/light': { red: { $value: '#f00' } } },
      false,
      true
    );
    expect(files[0].path).toBe('Colors/light.tokens.json');
    expect(JSON.parse(files[0].json)).toEqual({
      Colors: { red: { $value: '#f00' } },
    });
  });

  test('splitByMode: key without mode stays flat', () => {
    const files = splitTokensToFiles(
      { Colors: { red: { $value: '#f00' } } },
      false,
      true
    );
    expect(files[0].path).toBe('Colors.tokens.json');
  });

  test('unsafe characters are sanitized in paths', () => {
    const files = splitTokensToFiles({ 'A:B': {} }, true, false);
    expect(files[0].path).toBe('A-B.tokens.json');
  });

  test('no split flags: empty list (caller handles single file)', () => {
    expect(splitTokensToFiles({ Colors: {} })).toEqual([]);
  });
});
