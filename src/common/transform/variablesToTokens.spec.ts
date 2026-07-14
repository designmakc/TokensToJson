import { describe, expect, test } from 'vitest';

import { variablesToTokens } from './variablesToTokens';
import { IResolver } from '@common/resolver';

const collections = [
  {
    id: 'c1',
    name: 'core',
    defaultModeId: 'm1',
    modes: [{ modeId: 'm1', name: 'default' }],
  },
] as unknown as VariableCollection[];

const variables = [
  {
    name: 'spacing/sm',
    resolvedType: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    variableCollectionId: 'c1',
    valuesByMode: { m1: 6 },
    description: '',
    codeSyntax: {},
    id: 'v1',
  },
  {
    name: 'flags/isCompact',
    resolvedType: 'BOOLEAN',
    scopes: [],
    variableCollectionId: 'c1',
    valuesByMode: { m1: true },
    description: '',
    codeSyntax: {},
    id: 'v2',
  },
  {
    name: 'content/brand',
    resolvedType: 'STRING',
    scopes: [],
    variableCollectionId: 'c1',
    valuesByMode: { m1: 'Acme' },
    description: '',
    codeSyntax: {},
    id: 'v3',
  },
] as unknown as Variable[];

const resolver = {} as IResolver;

const baseConfig = {
  colorMode: 'hex',
  includeValueStringKeyToAlias: false,
  includeFigmaMetaData: false,
  usePercentageOpacity: false,
  omitCollectionNames: false,
  includeScopes: false,
} as ExportSettingsI;

describe('variablesToTokens DTCG 2025.10 format', () => {
  test('DTCG on: dimension objects, no string/boolean $type', async () => {
    const tokens = await variablesToTokens(
      variables,
      collections,
      { ...baseConfig, useDTCG: true },
      resolver
    );
    const spacing = tokens['core']['spacing']['sm'];
    expect(spacing.$type).toBe('dimension');
    expect(spacing.$value).toStrictEqual({ value: 6, unit: 'px' });

    const flag = tokens['core']['flags']['isCompact'];
    expect(flag.$type).toBeUndefined();
    expect(flag.$value).toBe(true);
    expect(flag.$extensions.figmaType).toBe('BOOLEAN');

    const brand = tokens['core']['content']['brand'];
    expect(brand.$type).toBeUndefined();
    expect(brand.$value).toBe('Acme');
    expect(brand.$extensions.figmaType).toBe('STRING');
  });

  test('DTCG off: legacy strings and native types', async () => {
    const tokens = await variablesToTokens(
      variables,
      collections,
      { ...baseConfig, useDTCG: false },
      resolver
    );
    const spacing = tokens['core']['spacing']['sm'];
    expect(spacing.type).toBe('dimension');
    expect(spacing.value).toBe('6px');

    const flag = tokens['core']['flags']['isCompact'];
    expect(flag.type).toBe('boolean');
    expect(flag.value).toBe(true);

    const brand = tokens['core']['content']['brand'];
    expect(brand.type).toBe('string');
    expect(brand.value).toBe('Acme');
  });
});

describe('variablesToTokens token categories', () => {
  const categoriesOn = {
    ...baseConfig,
    useDTCG: true,
    tokenCategories: { isEnabled: true, refineTypes: false, rules: [] },
  } as ExportSettingsI;

  test('writes resolved category into the plugin $extensions namespace', async () => {
    const tokens = await variablesToTokens(
      variables,
      collections,
      categoriesOn,
      resolver
    );
    const spacing = tokens['core']['spacing']['sm'];
    expect(spacing.$extensions['tokens-to-json']).toStrictEqual({
      category: 'spacing',
    });

    // no keyword match — no namespace entry at all
    const brand = tokens['core']['content']['brand'];
    expect(brand.$extensions['tokens-to-json']).toBeUndefined();
  });

  test('never exports ALL_SCOPES even with includeScopes on', async () => {
    const tokens = await variablesToTokens(
      variables,
      collections,
      { ...categoriesOn, includeScopes: true },
      resolver
    );
    expect(tokens['core']['spacing']['sm'].scopes).toBeUndefined();
  });

  test('keeps meaningful scopes with includeScopes on', async () => {
    const scoped = [
      {
        ...(variables[0] as object),
        name: 'radius/md',
        scopes: ['CORNER_RADIUS', 'ALL_SCOPES'],
        id: 'v9',
      },
    ] as unknown as Variable[];
    const tokens = await variablesToTokens(
      scoped,
      collections,
      { ...categoriesOn, includeScopes: true },
      resolver
    );
    expect(tokens['core']['radius']['md'].scopes).toStrictEqual([
      'CORNER_RADIUS',
    ]);
  });

  test('refines generic FLOAT dimension by name when refineTypes is on', async () => {
    const opacityVar = [
      {
        ...(variables[0] as object),
        name: 'opacity/disabled',
        valuesByMode: { m1: 0.4 },
        id: 'v10',
      },
    ] as unknown as Variable[];

    const off = await variablesToTokens(
      opacityVar,
      collections,
      categoriesOn,
      resolver
    );
    expect(off['core']['opacity']['disabled'].$type).toBe('dimension');

    const on = await variablesToTokens(
      opacityVar,
      collections,
      {
        ...categoriesOn,
        tokenCategories: { isEnabled: true, refineTypes: true, rules: [] },
      } as ExportSettingsI,
      resolver
    );
    const refined = on['core']['opacity']['disabled'];
    expect(refined.$type).toBe('number');
    // refined value must be a bare number, not a {value, unit} dimension
    expect(refined.$value).toBe(0.4);
  });

  test('refined duration gets a ms duration object, not px', async () => {
    const durationVar = [
      {
        ...(variables[0] as object),
        name: 'motion/duration/fast',
        valuesByMode: { m1: 150 },
        id: 'v11',
      },
    ] as unknown as Variable[];

    const tokens = await variablesToTokens(
      durationVar,
      collections,
      {
        ...categoriesOn,
        tokenCategories: { isEnabled: true, refineTypes: true, rules: [] },
      } as ExportSettingsI,
      resolver
    );
    const fast = tokens['core']['motion']['duration']['fast'];
    expect(fast.$type).toBe('duration');
    expect(fast.$value).toStrictEqual({ value: 150, unit: 'ms' });
  });

  test('disabled feature leaves tokens untouched', async () => {
    const tokens = await variablesToTokens(
      variables,
      collections,
      {
        ...baseConfig,
        useDTCG: true,
        tokenCategories: { isEnabled: false, refineTypes: true, rules: [] },
      } as ExportSettingsI,
      resolver
    );
    expect(
      tokens['core']['spacing']['sm'].$extensions['tokens-to-json']
    ).toBeUndefined();
  });
});

describe('variablesToTokens ordering', () => {
  test('tokens follow the collection variableIds order (Figma UI order)', async () => {
    const orderedCollections = [
      {
        id: 'c1',
        name: 'core',
        defaultModeId: 'm1',
        modes: [{ modeId: 'm1', name: 'default' }],
        variableIds: ['v-xs', 'v-sm', 'v-xl10'],
      },
    ] as unknown as VariableCollection[];

    const makeVar = (id: string, name: string, value: number) =>
      ({
        name,
        resolvedType: 'FLOAT',
        scopes: ['ALL_SCOPES'],
        variableCollectionId: 'c1',
        valuesByMode: { m1: value },
        description: '',
        codeSyntax: {},
        id,
      }) as unknown as Variable;

    // Variables arrive in a different order than defined in the collection
    const unorderedVariables = [
      makeVar('v-xl10', 'spacing/xl10', 128),
      makeVar('v-xs', 'spacing/xs', 2),
      makeVar('v-sm', 'spacing/sm', 6),
    ];

    const tokens = await variablesToTokens(
      unorderedVariables,
      orderedCollections,
      { ...baseConfig, useDTCG: false },
      resolver
    );

    expect(Object.keys(tokens['core']['spacing'])).toStrictEqual([
      'xs',
      'sm',
      'xl10',
    ]);
  });
});
