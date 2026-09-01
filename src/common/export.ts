import { stylesToTokens } from './transform/styles/stylesToTokens';

import { variablesToTokens } from './transform/variablesToTokens';
import { mergeStylesIntoTokens } from './transform/mergeStylesIntoTokens';
import { IResolver } from './resolver';

/**
 * Recursively collect all mode names found in $extensions.mode across a token tree.
 */
const collectModeNames = (tokens: Record<string, any>): Set<string> => {
  const modes = new Set<string>();
  for (const value of Object.values(tokens)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$value' in value) {
        const modeMap = value.$extensions?.mode;
        if (modeMap && typeof modeMap === 'object') {
          Object.keys(modeMap).forEach((m) => modes.add(m));
        }
      } else {
        for (const m of collectModeNames(value)) {
          modes.add(m);
        }
      }
    }
  }
  return modes;
};

/**
 * Recursively replace each token's $value with the value for the given mode.
 * Removes $extensions.mode and $extensions.modeTargetIds from the output —
 * both are per-mode maps that a single-mode file has no use for. The alias
 * target of the selected mode is folded into $extensions.figma instead.
 */
const applyModeToTokens = (
  tokens: Record<string, any>,
  modeName: string
): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$value' in value) {
        const modeValue = value.$extensions?.mode?.[modeName];
        const modeTargetId = value.$extensions?.modeTargetIds?.[modeName];
        const {
          mode: _mode,
          modeTargetIds: _modeTargetIds,
          ...restExtensions
        } = value.$extensions || {};
        if (restExtensions.figma) {
          // Drop the default-mode target before setting this mode's own —
          // a mode may alias where the default holds a raw value, or vice versa
          const { targetVariableId: _target, ...figma } = restExtensions.figma;
          restExtensions.figma = modeTargetId
            ? { ...figma, targetVariableId: modeTargetId }
            : figma;
        }
        const extensions =
          Object.keys(restExtensions).length > 0 ? restExtensions : undefined;
        result[key] = {
          ...value,
          $value: modeValue !== undefined ? modeValue : value.$value,
          ...(extensions
            ? { $extensions: extensions }
            : { $extensions: undefined }),
        };
        if (result[key].$extensions === undefined) {
          delete result[key].$extensions;
        }
      } else {
        result[key] = applyModeToTokens(value, modeName);
      }
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const DTCG_SPEC_URL = 'https://www.designtokens.org/tr/2025.10/format/';

const buildMeta = (
  config: ExportSettingsI,
  variableCollections: VariableCollection[]
): MetaPropsI => ({
  useDTCG: config.useDTCG,
  ...(config.useDTCG && { spec: DTCG_SPEC_URL }),
  colorMode: config.colorMode,
  variableCollections: variableCollections.map((collection) => collection.name),
  createdAt: new Date().toISOString(),
});

/**
 * Stamp the collection and mode a split-export file holds.
 * The file name is a sanitized mode name, which is not an identifier: mode
 * names are case-sensitive, may contain path characters, and a rename is
 * indistinguishable from a new mode without the id.
 */
const withCollectionMeta = (
  meta: MetaPropsI,
  collection: VariableCollection | undefined,
  modeName?: string
): MetaPropsI => {
  if (!collection) {
    // Styles stored under a pseudo-collection name have no Figma collection
    return meta;
  }
  const mode =
    collection.modes.find((item) => item.name === modeName) ??
    (collection.modes.length === 1 ? collection.modes[0] : undefined);
  return {
    ...meta,
    collection: {
      id: collection.id,
      name: collection.name,
      defaultModeId: collection.defaultModeId,
    },
    ...(mode && { mode: { id: mode.modeId, name: mode.name } }),
  };
};

export const getTokens = async (
  resolver: IResolver,
  config: ExportSettingsI,
  _state?: PluginStateI
) => {
  // Drop excluded collections and every variable that belongs to them.
  // ponytail: an alias pointing INTO an excluded collection is left dangling —
  // exclude leaf collections (Figma's built-in Specs/annotations), not ones
  // other collections reference.
  const excluded = new Set(config.excludedCollections ?? []);
  const variableCollection = (
    await resolver.getLocalVariableCollections()
  ).filter((collection) => !excluded.has(collection.name));
  const keptCollectionIds = new Set(
    variableCollection.map((collection) => collection.id)
  );
  const variables = (await resolver.getLocalVariables()).filter((variable) =>
    keptCollectionIds.has(variable.variableCollectionId)
  );

  // convert variables to tokens
  const variableTokens = await variablesToTokens(
    variables,
    variableCollection,
    config,
    resolver
  );

  // convert styles to tokens
  const styleTokens = await stylesToTokens(config, resolver);

  // merge variables and styles
  const mergedVariables = mergeStylesIntoTokens(
    variableTokens,
    styleTokens,
    config.storeStyleInCollection
  );

  const metaData = buildMeta(config, variableCollection);

  const collectionByName = new Map(
    variableCollection.map((collection) => [collection.name, collection])
  );

  if (config.splitByMode) {
    // Return a map of { "collectionName/modeName": modeTokens } for each mode in each collection
    const result: Record<string, any> = {};
    for (const collectionName of Object.keys(mergedVariables)) {
      const collectionTokens = mergedVariables[collectionName];
      const collection = collectionByName.get(collectionName);
      const modeNames = collectModeNames(collectionTokens);
      if (modeNames.size === 0) {
        // No multi-mode data — treat as single file for this collection.
        // Its single mode is still named and identified, same as any other.
        result[collectionName] = {
          ...collectionTokens,
          $extensions: {
            'tokens-bruecke-meta': withCollectionMeta(metaData, collection),
          },
        };
      } else {
        for (const modeName of modeNames) {
          const modeTokens = applyModeToTokens(collectionTokens, modeName);
          result[`${collectionName}/${modeName}`] = {
            ...modeTokens,
            $extensions: {
              'tokens-bruecke-meta': withCollectionMeta(
                metaData,
                collection,
                modeName
              ),
            },
          };
        }
      }
    }
    return result;
  }

  if (config.splitByCollection) {
    // Return a map of { collectionName: tokens } where each entry gets its own meta
    const result: Record<string, any> = {};
    for (const key of Object.keys(mergedVariables)) {
      result[key] = {
        ...mergedVariables[key],
        $extensions: {
          'tokens-bruecke-meta': withCollectionMeta(
            metaData,
            collectionByName.get(key)
          ),
        },
      };
    }
    return result;
  }

  // add meta to mergedVariables
  mergedVariables['$extensions'] = {
    'tokens-bruecke-meta': metaData,
  };

  // console.log("mergedVariables", mergedVariables);

  return mergedVariables;
};
