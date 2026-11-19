import { describe, expect, test } from 'vitest';

import { mergeStylesIntoTokens } from './mergeStylesIntoTokens';

const styleTokens = [{ 'Color-styles': { accent: { $value: '#ff0000' } } }];

describe('mergeStylesIntoTokens', () => {
  test('puts styles inside the chosen variable collection', () => {
    const merged = mergeStylesIntoTokens(
      { semantic: { gap: { $value: 4 } } },
      styleTokens,
      'semantic'
    );

    expect(Object.keys(merged.semantic)).toStrictEqual(['gap', 'Color-styles']);
  });

  // The profile is shared by every file. Run in a file that has no such
  // collection, the export used to die with "Cannot convert undefined or null
  // to object" and nothing on screen.
  test('names the missing collection when the export has no such collection', () => {
    expect(() =>
      mergeStylesIntoTokens({ 'Collection 1': {} }, styleTokens, 'semantic')
    ).toThrow(/"Add styles to" is set to "semantic"/);
  });
});
