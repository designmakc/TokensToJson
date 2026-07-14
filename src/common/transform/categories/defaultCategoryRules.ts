// Default keyword dictionary: token-name segments -> semantic category.
// Categories describe the token's ROLE and are written to
// $extensions["tokens-to-json"].category — they are NOT DTCG $type values.
// refineType (optional) upgrades a generic FLOAT "dimension" to a more
// precise SPEC type when the "Refine types" setting is on.
export const DEFAULT_CATEGORY_RULES: TokenCategoryRuleI[] = [
  { category: 'color', keywords: ['color', 'colors', 'colour', 'palette'] },
  { category: 'gradient', keywords: ['gradient', 'gradients'] },
  { category: 'typography', keywords: ['typography', 'text'] },
  { category: 'font', keywords: ['font', 'fonts'] },
  {
    category: 'font',
    keywords: ['weight', 'font-weight'],
    refineType: 'fontWeight',
  },
  {
    category: 'effect',
    keywords: ['effect', 'effects', 'shadow', 'shadows', 'elevation'],
  },
  { category: 'border', keywords: ['border', 'borders', 'stroke', 'strokes'] },
  { category: 'radius', keywords: ['radius', 'radii', 'corner', 'rounding'] },
  {
    category: 'spacing',
    keywords: ['spacing', 'space', 'gap', 'inset', 'padding', 'margin'],
  },
  {
    category: 'size',
    keywords: ['size', 'sizes', 'sizing', 'width', 'height'],
  },
  {
    category: 'breakpoint',
    keywords: ['breakpoint', 'breakpoints', 'screen'],
  },
  { category: 'grid', keywords: ['grid', 'grids', 'layout'] },
  {
    category: 'motion',
    keywords: ['motion', 'duration', 'transition', 'animation'],
    refineType: 'duration',
  },
  { category: 'motion', keywords: ['easing', 'ease'], refineType: 'number' },
  {
    category: 'opacity',
    keywords: ['opacity', 'opacities', 'alpha'],
    refineType: 'number',
  },
  {
    category: 'z-index',
    keywords: ['z', 'zindex', 'z-index', 'layer'],
    refineType: 'number',
  },
];
