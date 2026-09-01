import { describe, expect, test } from 'vitest';

import { getTokens } from './export';
import { IResolver } from '@common/resolver';

const collections = [
  {
    id: 'c1',
    name: 'primitive',
    defaultModeId: 'm1',
    modes: [{ modeId: 'm1', name: 'default' }],
  },
  {
    id: 'c2',
    name: 'Specs',
    defaultModeId: 'm2',
    modes: [{ modeId: 'm2', name: 'Light' }],
  },
] as unknown as VariableCollection[];

const variables = [
  {
    id: 'v1',
    name: 'spacing/sm',
    resolvedType: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    variableCollectionId: 'c1',
    valuesByMode: { m1: 6 },
    description: '',
    codeSyntax: {},
  },
  {
    id: 'v2',
    name: 'Annotation/outline',
    resolvedType: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    variableCollectionId: 'c2',
    valuesByMode: { m2: 2 },
    description: '',
    codeSyntax: {},
  },
] as unknown as Variable[];

const resolver = {
  getLocalVariableCollections: async () => collections,
  getLocalVariables: async () => variables,
  getLocalTextStyles: async () => [],
  getLocalPaintStyles: async () => [],
  getLocalEffectStyles: async () => [],
  getLocalGridStyles: async () => [],
  getVariableById: async () => null,
  getVariableCollectionById: async () => null,
} as unknown as IResolver;

const baseConfig = {
  colorMode: 'hex',
  useDTCG: true,
  includeValueStringKeyToAlias: false,
  includeFigmaMetaData: false,
  opacityFormat: 'decimal',
  omitCollectionNames: false,
  includeScopes: false,
  splitByCollection: false,
  splitByMode: false,
  storeStyleInCollection: 'none',
  excludedCollections: [],
  includedStyles: {
    text: { isIncluded: false, customName: '' },
    effects: { isIncluded: false, customName: '' },
    grids: { isIncluded: false, customName: '' },
    colors: { isIncluded: false, customName: '' },
  },
} as unknown as ExportSettingsI;

describe('getTokens collection filter', () => {
  test('exports every collection when nothing is excluded', async () => {
    const tokens = await getTokens(resolver, baseConfig);

    expect(tokens['primitive']).toBeDefined();
    expect(tokens['Specs']).toBeDefined();
    expect(tokens['$extensions']['tokens-bruecke-meta'].variableCollections)
      .toStrictEqual(['primitive', 'Specs']);
  });

  test('excluded collection drops both its tokens and its meta entry', async () => {
    const tokens = await getTokens(resolver, {
      ...baseConfig,
      excludedCollections: ['Specs'],
    });

    expect(tokens['primitive']['spacing']['sm'].$value).toStrictEqual({
      value: 6,
      unit: 'px',
    });
    expect(tokens['Specs']).toBeUndefined();
    expect(tokens['$extensions']['tokens-bruecke-meta'].variableCollections)
      .toStrictEqual(['primitive']);
  });
});

// Figma metadata requested by consumers that re-link tokens to REST nodes:
// the mode a split file holds, and alias targets as ids rather than paths.
const modeCollections = [
  {
    id: 'c1',
    name: 'primitive',
    defaultModeId: 'm1',
    modes: [{ modeId: 'm1', name: 'default' }],
  },
  {
    id: 'c3',
    name: 'theme',
    defaultModeId: 'm3',
    modes: [
      { modeId: 'm3', name: 'light' },
      { modeId: 'm4', name: 'dark' },
    ],
  },
] as unknown as VariableCollection[];

const white = {
  id: 'v0',
  key: '8f3c1d0e5b7a24f9c6e1a8d3b2470f5e91c6a4d8',
  hiddenFromPublishing: false,
  name: 'color/white',
  resolvedType: 'COLOR',
  scopes: ['ALL_SCOPES'],
  variableCollectionId: 'c1',
  valuesByMode: { m1: { r: 1, g: 1, b: 1, a: 1 } },
  description: '',
  codeSyntax: {},
};

const modeVariables = [
  white,
  {
    id: 'v3',
    key: '4b91e7c2a5d0384f6c1b9e7a2d5f0c83b64e19a7',
    hiddenFromPublishing: true,
    name: 'color/bg',
    resolvedType: 'COLOR',
    scopes: ['ALL_SCOPES'],
    variableCollectionId: 'c3',
    // Aliases in the default mode, holds a raw value in the other
    valuesByMode: {
      m3: { type: 'VARIABLE_ALIAS', id: 'v0' },
      m4: { r: 0, g: 0, b: 0, a: 1 },
    },
    description: '',
    codeSyntax: {},
  },
] as unknown as Variable[];

const modeResolver = {
  ...resolver,
  getLocalVariableCollections: async () => modeCollections,
  getLocalVariables: async () => modeVariables,
  getVariableById: async (id: string) =>
    modeVariables.find((variable) => variable.id === id) ?? null,
  getVariableCollectionById: async (id: string) =>
    modeCollections.find((collection) => collection.id === id) ?? null,
} as unknown as IResolver;

const modeConfig = {
  ...baseConfig,
  splitByMode: true,
  includeFigmaMetaData: true,
} as unknown as ExportSettingsI;

describe('getTokens figma metadata', () => {
  test('stamps the mode a split file holds, single-mode collections included', async () => {
    const tokens = await getTokens(modeResolver, modeConfig);

    const themeMeta = tokens['theme/dark'].$extensions['tokens-bruecke-meta'];
    expect(themeMeta.mode).toStrictEqual({ id: 'm4', name: 'dark' });
    expect(themeMeta.collection).toStrictEqual({
      id: 'c3',
      name: 'theme',
      defaultModeId: 'm3',
    });

    // A one-mode collection is not a special case — it names its mode too
    expect(
      tokens['primitive'].$extensions['tokens-bruecke-meta'].mode
    ).toStrictEqual({ id: 'm1', name: 'default' });
  });

  test('alias target id follows the mode, not the collection default', async () => {
    const tokens = await getTokens(modeResolver, modeConfig);

    const light = tokens['theme/light'].color.bg;
    const dark = tokens['theme/dark'].color.bg;

    expect(light.$value).toBe('{primitive.color.white}');
    expect(light.$extensions.figma.targetVariableId).toBe('v0');
    // Raw value in this mode — the default mode's target must not leak in
    expect(dark.$value).toBe('#000000');
    expect(dark.$extensions.figma.targetVariableId).toBeUndefined();
    // The per-mode map is consumed by the split, not shipped
    expect(light.$extensions.modeTargetIds).toBeUndefined();
  });

  test('figmaType is written for every token, not only untyped ones', async () => {
    const tokens = await getTokens(modeResolver, modeConfig);

    expect(tokens['primitive'].color.white.$type).toBe('color');
    expect(tokens['primitive'].color.white.$extensions.figmaType).toBe('COLOR');
  });

  test('publishing identity survives the mode split', async () => {
    const tokens = await getTokens(modeResolver, modeConfig);

    const white = tokens['primitive'].color.white.$extensions.figma;
    expect(white.key).toBe('8f3c1d0e5b7a24f9c6e1a8d3b2470f5e91c6a4d8');
    expect(white.hiddenFromPublishing).toBe(false);

    // A hidden variable cannot be imported by key — the flag must reach every
    // per-mode file, not just the one holding the default mode
    for (const file of ['theme/light', 'theme/dark']) {
      const bg = tokens[file].color.bg.$extensions.figma;
      expect(bg.key).toBe('4b91e7c2a5d0384f6c1b9e7a2d5f0c83b64e19a7');
      expect(bg.hiddenFromPublishing).toBe(true);
    }
  });
});
