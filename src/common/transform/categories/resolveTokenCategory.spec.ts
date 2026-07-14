import { describe, expect, test } from 'vitest';
import { resolveTokenCategory } from './resolveTokenCategory';
import { DEFAULT_CATEGORY_RULES } from './defaultCategoryRules';

const resolve = (name: string) =>
  resolveTokenCategory(name, DEFAULT_CATEGORY_RULES);

describe('resolveTokenCategory', () => {
  test('gap resolves to spacing', () => {
    expect(resolve('spacing/gap/md')).toEqual({ category: 'spacing' });
  });

  test('padding resolves to spacing', () => {
    expect(resolve('component/card/padding')).toEqual({ category: 'spacing' });
  });

  test('deepest segment wins: gradient stop is gradient, not color', () => {
    expect(resolve('color/gradient/action/primary/start')).toEqual({
      category: 'gradient',
    });
  });

  test('case insensitive', () => {
    expect(resolve('SPACING/MD')).toEqual({ category: 'spacing' });
  });

  test('matches words inside hyphenated segments', () => {
    expect(resolve('component/icon-size/lg')).toEqual({ category: 'size' });
    expect(resolve('corner_radius/sm')).toEqual({ category: 'radius' });
  });

  test('opacity carries a refine type', () => {
    expect(resolve('opacity/disabled')).toEqual({
      category: 'opacity',
      refineType: 'number',
    });
  });

  test('font weight refines to fontWeight and beats plain font', () => {
    expect(resolve('font/weight/bold')).toEqual({
      category: 'font',
      refineType: 'fontWeight',
    });
  });

  test('motion duration refines to duration', () => {
    expect(resolve('motion/duration/fast')).toEqual({
      category: 'motion',
      refineType: 'duration',
    });
  });

  test('no match returns null', () => {
    expect(resolve('brand/primary')).toBeNull();
  });

  test('custom rules override', () => {
    expect(
      resolveTokenCategory('tw/leading/6', [
        { category: 'spacing', keywords: ['leading'] },
      ])
    ).toEqual({ category: 'spacing' });
  });

  test('empty keywords are ignored', () => {
    expect(
      resolveTokenCategory('spacing/md', [
        { category: 'broken', keywords: ['', '  '] },
      ])
    ).toBeNull();
  });
});
