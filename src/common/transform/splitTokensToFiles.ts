const sanitize = (name: string) => name.replace(/[/\\?%*:|"<>]/g, '-');

export interface TokenFileI {
  path: string; // relative path, e.g. "Collection/Mode.tokens.json"
  json: string;
}

/**
 * Split a tokens object into separate files.
 * - splitByMode: keys are "CollectionName/ModeName" → {Collection}/{Mode}.tokens.json
 * - splitByCollection: keys are collection names → {Collection}.tokens.json
 * Callers handle the no-split (single file) case themselves.
 */
export const splitTokensToFiles = (
  tokens: Record<string, any>,
  splitByCollection = false,
  splitByMode = false
): TokenFileI[] => {
  const files: TokenFileI[] = [];

  if (splitByMode) {
    for (const key of Object.keys(tokens)) {
      const slashIndex = key.indexOf('/');
      if (slashIndex !== -1) {
        const collectionName = key.slice(0, slashIndex);
        const modeName = key.slice(slashIndex + 1);
        files.push({
          path: `${sanitize(collectionName)}/${sanitize(modeName)}.tokens.json`,
          json: JSON.stringify({ [collectionName]: tokens[key] }, null, 2),
        });
      } else {
        // No multi-mode data — single file for this collection
        files.push({
          path: `${sanitize(key)}.tokens.json`,
          json: JSON.stringify({ [key]: tokens[key] }, null, 2),
        });
      }
    }
  } else if (splitByCollection) {
    for (const collectionName of Object.keys(tokens)) {
      files.push({
        path: `${sanitize(collectionName)}.tokens.json`,
        json: JSON.stringify(
          { [collectionName]: tokens[collectionName] },
          null,
          2
        ),
      });
    }
  }

  return files;
};
