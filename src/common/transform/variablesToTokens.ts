import { normalizeValue } from './normalizeValue';
import { normalizeType, isNonSpecTokenType } from './normalizeType';
import { getTokenKeyName } from './getTokenKeyName';
import { PLUGIN_EXTENSION_NAMESPACE } from './extensionNamespace';
import { resolveTokenCategory } from './categories/resolveTokenCategory';
import { DEFAULT_CATEGORY_RULES } from './categories/defaultCategoryRules';

import { groupObjectNamesIntoCategories } from './groupObjectNamesIntoCategories';
import { IResolver } from '@common/resolver';

// console.clear();

export const variablesToTokens = async (
  variables: Variable[],
  collections: VariableCollection[],
  config: ExportSettingsI,
  resolver: IResolver
) => {
  const {
    colorMode,
    useDTCG,
    includeValueStringKeyToAlias,
    includeFigmaMetaData,
    opacityFormat,
    omitCollectionNames = false,
  } = config;
  const keyNames = getTokenKeyName(useDTCG);

  // Sort variables to match the order shown in Figma's Variables panel.
  // getLocalVariables() does not guarantee UI order; the authoritative
  // order is each collection's `variableIds` array.
  const variableOrder = new Map<string, number>();
  let orderIndex = 0;
  for (const collection of collections) {
    for (const variableId of collection.variableIds ?? []) {
      variableOrder.set(variableId, orderIndex++);
    }
  }
  const sortedVariables = [...variables].sort(
    (a, b) =>
      (variableOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (variableOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );

  // let mergedVariables = {};
  let emptyCollection = collections.map((collection) => {
    return {
      [collection.name]: {},
    };
  });

  // When omitting collection names, use a single flat object for all variables
  const flatVariables: Record<string, any> = {};
  const seenVariableNames = new Set<string>();

  // console.log("variables", variables);
  // console.log("collections", collections);

  for (const variable of sortedVariables) {
    // console.log("variable", variable);
    // get collection object
    const collectionId = variable.variableCollectionId;
    const collection = collections.find((item) => item.id === collectionId);
    const collectionName = collection.name;
    const collectionDefaultModeId = collection.defaultModeId;
    const collectionObject = {
      id: collectionId,
      name: collectionName,
      defaultModeId: collectionDefaultModeId,
    };

    // console.log("collectionObject", collectionObj
    // console.log("collection", collectionObject);

    const categoriesConfig = config.tokenCategories;
    const categoryMatch = categoriesConfig?.isEnabled
      ? resolveTokenCategory(
          variable.name,
          categoriesConfig.rules?.length
            ? categoriesConfig.rules
            : DEFAULT_CATEGORY_RULES
        )
      : null;

    // Name-based type refinement (opt-in). Only generic FLOAT is refined —
    // a precise scope (FONT_WEIGHT/OPACITY) already produced a better type
    // and the scope is more trustworthy than the name.
    const refinedType =
      categoriesConfig?.refineTypes &&
      categoryMatch?.refineType &&
      variable.resolvedType === 'FLOAT'
        ? categoryMatch.refineType
        : undefined;

    // get values by mode
    const modes = variable.valuesByMode;

    // Alias targets by mode. The string $value carries only the token path,
    // so a reference cannot be resolved without parsing names — which breaks
    // on the first token name containing a dot. The raw ids are unambiguous.
    const aliasTargetId = (modeId: string) => {
      const modeValue = modes[modeId] as VariableAlias | undefined;
      return modeValue?.type === 'VARIABLE_ALIAS' ? modeValue.id : undefined;
    };
    const defaultTargetVariableId = aliasTargetId(collectionDefaultModeId);
    const modeTargetIds: Record<string, string> = {};
    for (const modeId of Object.keys(modes)) {
      const modeName = collection.modes.find(
        (mode) => mode.modeId === modeId
      )?.name;
      const targetId = aliasTargetId(modeId);
      if (modeName && targetId) {
        modeTargetIds[modeName] = targetId;
      }
    }

    const getValue = async (modeIndex: number) =>
      await normalizeValue(
        {
          variableType: variable.resolvedType,
          variableValue: variable.valuesByMode[Object.keys(modes)[modeIndex]],
          variableScope: variable.scopes,
          colorMode,
          useDTCG,
          includeValueStringKeyToAlias,
          opacityFormat,
          omitCollectionNames,
          refinedType,
          refinedCategory: refinedType ? categoryMatch?.category : undefined,
        },
        resolver
      );

    const defaultValue = await getValue(
      Object.keys(modes).indexOf(collectionDefaultModeId)
    );

    // console.log("defaultValue", defaultValue);

    const modesValues = Object.fromEntries(
      (
        await Promise.all(
          Object.keys(modes).map(async (modeId, index) => {
            const modeName = collection.modes.find(
              (mode) => mode.modeId === modeId
            )?.name;

            if (modeName) {
              return [[modeName, await getValue(index)]];
            }
            console.warn(`ModeId ${modeId} not found in ${collectionId}`);
            return [];
          })
        )
      ).flat()
    );

    const filteredModesValues =
      Object.keys(modesValues).length === 1 ? {} : modesValues;

    let tokenType = normalizeType(
      variable.resolvedType,
      variable.scopes,
      opacityFormat
    );

    if (refinedType && tokenType === 'dimension') {
      // Percent-formatted opacity is a "50%" string, not a number
      tokenType =
        categoryMatch?.category === 'opacity' && opacityFormat === 'percent'
          ? 'string'
          : refinedType;
    }

    // Raw Figma scopes, untransformed (ALL_SCOPES included) — the semantic
    // interpretation already lives in $extensions["tokens-to-json"].category
    const rawScopes = variable.scopes;

    // DTCG 2025.10 defines a closed type set — `string`/`boolean` are not
    // valid `$type` values. In DTCG format, omit `$type` for those tokens
    // and preserve the original type under `$extensions`.
    const omitType = useDTCG && isNonSpecTokenType(tokenType);

    const variableObject = {
      ...(!omitType && { [keyNames.type]: tokenType }),
      [keyNames.value]: defaultValue,
      [keyNames.description]: variable.description,
      // add scopes if true
      ...(config.includeScopes &&
        rawScopes.length > 0 && {
          scopes: rawScopes,
        }),
      // add meta
      $extensions: {
        ...(categoryMatch && {
          [PLUGIN_EXTENSION_NAMESPACE]: { category: categoryMatch.category },
        }),
        mode: filteredModesValues,
        // Mirrors `mode`: only meaningful when a per-mode file is produced
        ...(includeFigmaMetaData &&
          Object.keys(filteredModesValues).length > 0 &&
          Object.keys(modeTargetIds).length > 0 && { modeTargetIds }),
        // Always present, not only where $type is omitted — the DTCG type is
        // lossy for numbers (dimension/number/fontWeight/duration all map back
        // to FLOAT) and consumers should not have to guess the Figma type.
        figmaType: variable.resolvedType,
        ...(includeFigmaMetaData && {
          figma: {
            codeSyntax: variable.codeSyntax,
            variableId: variable.id,
            // Stable across files, unlike `id` — the key is how a consuming
            // file addresses a published library variable
            key: variable.key,
            // A hidden variable cannot be imported by key, so consumers must
            // not offer it as a binding target
            hiddenFromPublishing: variable.hiddenFromPublishing,
            collection: collectionObject,
            ...(defaultTargetVariableId && {
              targetVariableId: defaultTargetVariableId,
            }),
          },
        }),
      },
    } as PluginTokenI;

    if (omitCollectionNames) {
      // Place variable into flat object; warn on collision
      if (seenVariableNames.has(variable.name)) {
        console.warn(
          `[tokens-bruecke] Collision: variable "${variable.name}" exists in multiple collections. Last value wins.`
        );
      }
      seenVariableNames.add(variable.name);
      flatVariables[variable.name] = variableObject;
    } else {
      // place variable into collection
      emptyCollection = emptyCollection.map((collection) => {
        if (Object.keys(collection)[0] === collectionName) {
          collection[collectionName][variable.name] = variableObject;
        }
        return collection;
      });
    }
  }

  if (omitCollectionNames) {
    return groupObjectNamesIntoCategories(flatVariables);
  }

  // console.log("emptyCollection", emptyCollection);

  const mergedVariables = emptyCollection.reduce((result, collection) => {
    return {
      ...result,
      ...collection,
    };
  }, {});

  return groupObjectNamesIntoCategories(mergedVariables);
};
