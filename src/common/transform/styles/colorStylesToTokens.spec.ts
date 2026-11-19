import { describe, expect, test } from 'vitest';

import { colorStylesToTokens } from './colorStylesToTokens';
import { IResolver } from '@common/resolver';

const variables = {
  'VariableID:1:1': {
    name: 'color/background/page/lvl-2',
    variableCollectionId: 'C:semantic',
  },
  'VariableID:1:2': {
    name: 'balance-card/gradient/default/start',
    variableCollectionId: 'C:component',
  },
  'VariableID:1:3': {
    name: 'balance-card/gradient/default/end',
    variableCollectionId: 'C:component',
  },
};

const collections = {
  'C:semantic': { name: 'semantic' },
  'C:component': { name: 'component' },
};

const alias = (id: string) => ({ color: { type: 'VARIABLE_ALIAS', id } });

const gradient = {
  type: 'GRADIENT_LINEAR',
  gradientTransform: [
    [1, 0, 0],
    [0, 1, 0],
  ],
  gradientStops: [
    {
      position: 0,
      color: { r: 0, g: 0, b: 0, a: 1 },
      boundVariables: alias('VariableID:1:2'),
    },
    {
      position: 1,
      color: { r: 0, g: 0, b: 0, a: 1 },
      boundVariables: alias('VariableID:1:3'),
    },
  ],
};

// Figma lists paints bottom to top: paints[0] is the layer under the rest.
const exportStyle = async (paints: unknown[]) => {
  const resolver = {
    getLocalPaintStyles: async () => [
      { id: 'S:abc123,', name: 'Gradient/Component/Balance/Default', paints },
    ],
    getVariableById: async (id: string) => variables[id] ?? null,
    getVariableCollectionById: async (id: string) => collections[id] ?? null,
  } as unknown as IResolver;

  const tokens = await colorStylesToTokens(
    'color-styles',
    'hex',
    true,
    false,
    resolver
  );

  return tokens['color-styles']?.Gradient?.Component?.Balance?.Default;
};

describe('colorStylesToTokens: gradient over a solid underlay', () => {
  test('exports the gradient and writes the bound underlay as backgroundColor', async () => {
    const token = await exportStyle([
      {
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        boundVariables: alias('VariableID:1:1'),
      },
      gradient,
    ]);

    expect(token.$type).toBe('gradient');
    expect(token.$value).toStrictEqual([
      {
        color: '{component.balance-card.gradient.default.start}',
        position: 0,
      },
      { color: '{component.balance-card.gradient.default.end}', position: 1 },
    ]);

    const ext = token.$extensions['tokens-to-json'];
    expect(ext.backgroundColor).toBe('{semantic.color.background.page.lvl-2}');
    expect(ext.gradient.figmaStyleId).toBe('S:abc123,');
    expect(ext.gradient.kind).toBe('linear');
  });

  test('an unbound underlay is written as a raw color with its opacity', async () => {
    const token = await exportStyle([
      { type: 'SOLID', color: { r: 1, g: 0, b: 0 }, opacity: 0.5 },
      gradient,
    ]);

    expect(token.$extensions['tokens-to-json'].backgroundColor).toBe(
      '#ff000080'
    );
  });

  test('a hidden underlay paints nothing, so no backgroundColor is written', async () => {
    const token = await exportStyle([
      { type: 'SOLID', color: { r: 1, g: 0, b: 0 }, visible: false },
      gradient,
    ]);

    expect(token.$type).toBe('gradient');
    expect(token.$extensions['tokens-to-json']).not.toHaveProperty(
      'backgroundColor'
    );
  });

  test('a single-layer gradient keeps its shape: no backgroundColor', async () => {
    const token = await exportStyle([gradient]);

    expect(Object.keys(token.$extensions['tokens-to-json'])).toStrictEqual([
      'gradient',
    ]);
  });
});
