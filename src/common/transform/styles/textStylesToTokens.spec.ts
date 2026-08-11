import { describe, expect, test } from 'vitest';

import { textStylesToTokens } from './textStylesToTokens';
import { applyNameConvention } from './applyNameConvention';
import { IResolver } from '@common/resolver';

const textStyle = {
  id: 'S:abc123,',
  name: 'Adaptive Header/H1',
  description: '',
  fontName: { family: 'Inter', style: 'Semi Bold' },
  fontSize: 32,
  lineHeight: { unit: 'PIXELS', value: 40 },
  letterSpacing: { unit: 'PIXELS', value: 0 },
  paragraphSpacing: 0,
  paragraphIndent: 0,
  textDecoration: 'NONE',
  textCase: 'ORIGINAL',
  boundVariables: undefined,
} as unknown as TextStyle;

const resolver = {
  getLocalTextStyles: async () => [textStyle],
} as unknown as IResolver;

const FIGMA_ONLY = [
  'fontStyle',
  'paragraphSpacing',
  'paragraphIndent',
  'textDecoration',
  'textCase',
];

describe('textStylesToTokens', () => {
  test('DTCG $value holds only the spec members; Figma extras move to $extensions', async () => {
    const tokens = await textStylesToTokens(
      'typography-styles',
      true,
      false,
      resolver
    );
    // default convention is 'none': the Figma name is kept verbatim
    const token = tokens['typography-styles']['Adaptive Header']['H1'];

    expect(Object.keys(token.$value).sort()).toStrictEqual([
      'fontFamily',
      'fontSize',
      'fontWeight',
      'letterSpacing',
      'lineHeight',
    ]);

    const ext = token.$extensions['tokens-to-json'];
    expect(ext.styleId).toBe('S:abc123,');
    expect(ext.textCase).toBe('ORIGINAL');
    expect(ext.textDecoration).toBe('NONE');
    // nothing is left directly under $extensions outside the namespace
    expect(Object.keys(token.$extensions)).toStrictEqual(['tokens-to-json']);
  });

  test('legacy (non-DTCG) format keeps the Figma members in the value', async () => {
    const tokens = await textStylesToTokens(
      'typography-styles',
      false,
      false,
      resolver
    );
    const token = tokens['typography-styles']['Adaptive Header']['H1'];

    for (const key of FIGMA_ONLY) {
      expect(token.value).toHaveProperty(key);
    }
    expect(token.$extensions['tokens-to-json'].styleId).toBe('S:abc123,');
  });

  test('a chosen convention rewrites the style key', async () => {
    const tokens = await textStylesToTokens(
      'typography-styles',
      true,
      false,
      resolver,
      'kebab-case'
    );

    expect(tokens['typography-styles']['adaptive-header']['h1']).toBeDefined();
  });
});

describe('applyNameConvention', () => {
  const names = {
    'Adaptive Header/H1': 1,
    'Body/bodyLarge': 1,
    'Header/8xl': 1,
    'already-kebab/sm': 1,
    'Snake_case  name/X': 1,
  };

  test('"none" is a no-op — the default must not rename anything', () => {
    expect(applyNameConvention(names)).toBe(names);
    expect(applyNameConvention(names, 'none')).toBe(names);
  });

  test('kebab-case', () => {
    expect(Object.keys(applyNameConvention(names, 'kebab-case'))).toStrictEqual([
      'adaptive-header/h1',
      'body/body-large',
      'header/8xl',
      'already-kebab/sm',
      'snake-case-name/x',
    ]);
  });

  test('camelCase', () => {
    expect(Object.keys(applyNameConvention(names, 'camelCase'))).toStrictEqual([
      'adaptiveHeader/h1',
      'body/bodyLarge',
      'header/8xl',
      'alreadyKebab/sm',
      'snakeCaseName/x',
    ]);
  });

  test('PascalCase', () => {
    expect(Object.keys(applyNameConvention(names, 'PascalCase'))).toStrictEqual([
      'AdaptiveHeader/H1',
      'Body/BodyLarge',
      'Header/8xl',
      'AlreadyKebab/Sm',
      'SnakeCaseName/X',
    ]);
  });

  test('snake_case and MACRO_CASE', () => {
    expect(Object.keys(applyNameConvention(names, 'snake_case'))).toStrictEqual([
      'adaptive_header/h1',
      'body/body_large',
      'header/8xl',
      'already_kebab/sm',
      'snake_case_name/x',
    ]);
    expect(Object.keys(applyNameConvention(names, 'MACRO_CASE'))).toStrictEqual([
      'ADAPTIVE_HEADER/H1',
      'BODY/BODY_LARGE',
      'HEADER/8XL',
      'ALREADY_KEBAB/SM',
      'SNAKE_CASE_NAME/X',
    ]);
  });

  test('dots inside a segment survive', () => {
    expect(
      Object.keys(applyNameConvention({ 'Icon/v1.2': 1 }, 'kebab-case'))
    ).toStrictEqual(['icon/v1.2']);
  });
});
