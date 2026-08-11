// Figma style names are free-form ("Adaptive Header/H1", "bodyLarge/Bold") and
// projects disagree on how token keys should read. So the convention is a
// setting, and 'none' — the default — keeps Figma's names exactly as authored.
//
// Only style names go through this. Variable names are left alone on purpose:
// they are referenced by alias strings ("{primitive.color.blue.500}") that
// would have to be rewritten in lockstep, and any miss turns into a dangling
// reference. Styles have no inbound aliases, so renaming them is safe.

// "Adaptive Header" -> ["Adaptive", "Header"], "bodyLarge" -> ["body", "Large"].
// Dots are left inside the word: a style called "v1.2" keeps its dot.
const splitWords = (segment: string): string[] =>
  segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s\-_]+/)
    .filter(Boolean);

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

const FORMATTERS: Record<
  Exclude<nameConventionType, 'none'>,
  (words: string[]) => string
> = {
  'kebab-case': (words) => words.map((w) => w.toLowerCase()).join('-'),
  snake_case: (words) => words.map((w) => w.toLowerCase()).join('_'),
  MACRO_CASE: (words) => words.map((w) => w.toUpperCase()).join('_'),
  camelCase: (words) =>
    words
      .map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w.toLowerCase())))
      .join(''),
  PascalCase: (words) => words.map((w) => capitalize(w.toLowerCase())).join(''),
};

// Applied per "/"-separated segment; slashes survive so the caller can still
// split on them to build the token groups.
export const applyNameConvention = <T>(
  styles: Record<string, T>,
  convention: nameConventionType = 'none'
): Record<string, T> => {
  if (convention === 'none') {
    return styles;
  }

  const format = FORMATTERS[convention];
  const result: Record<string, T> = {};

  for (const [name, style] of Object.entries(styles)) {
    const converted = name
      .split('/')
      .map((segment) => format(splitWords(segment)))
      .join('/');

    result[converted] = style;
  }

  return result;
};
