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
