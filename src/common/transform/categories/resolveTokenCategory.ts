export interface CategoryMatchI {
  category: string;
  refineType?: TokenCategoryRefineTypeT;
}

// Matches token-name segments (split by "/") against the keyword dictionary.
// A keyword matches a whole segment or a hyphen/underscore-separated word
// inside it ("icon-size" matches "size"). The deepest matching segment wins —
// "color/gradient/x" resolves to "gradient", not "color". On a tie the rule
// that comes first in the list wins, so dictionary order sets priority.
export const resolveTokenCategory = (
  tokenName: string,
  rules: TokenCategoryRuleI[]
): CategoryMatchI | null => {
  const segments = tokenName
    .toLowerCase()
    .split('/')
    .map((segment) => segment.trim());

  let best: CategoryMatchI | null = null;
  let bestSegmentIndex = -1;

  for (const rule of rules) {
    const keywords = (rule.keywords || [])
      .map((keyword) => keyword.toLowerCase().trim())
      .filter(Boolean);

    if (!keywords.length || !rule.category) continue;

    for (let i = 0; i < segments.length; i++) {
      if (i <= bestSegmentIndex) continue;

      const words = segments[i].split(/[-_\s]+/);
      const isMatch = keywords.some(
        (keyword) => keyword === segments[i] || words.includes(keyword)
      );

      if (isMatch) {
        bestSegmentIndex = i;
        best = {
          category: rule.category,
          ...(rule.refineType && { refineType: rule.refineType }),
        };
      }
    }
  }

  return best;
};
