import { groupObjectNamesIntoCategories } from '@common/transform/groupObjectNamesIntoCategories';

import { getLineHeight } from '@common/transform/text/getLineHeight';
import { getLetterSpacing } from '@common/transform/text/getLetterSpacing';
import { getFontStyleAndWeight } from '@common/transform/text/getFontStyleAndWeight';
import { getTokenKeyName } from '@common/transform/getTokenKeyName';
import { getAliasVariableName } from '@common/transform/getAliasVariableName';
import { makeDimension } from '@common/transform/makeDimension';
import { PLUGIN_EXTENSION_NAMESPACE } from '@common/transform/extensionNamespace';
import { applyNameConvention } from './applyNameConvention';
import { IResolver } from '@common/resolver';

export const textStylesToTokens = async (
  customName: string,
  isDTCGForamt: boolean,
  includeValueStringKeyToAlias: boolean,
  resolver: IResolver,
  nameConvention: nameConventionType = 'none'
) => {
  const keyNames = getTokenKeyName(isDTCGForamt);
  const textStyles = await resolver.getLocalTextStyles();

  let textTokens = {};

  const allTextStyles = {};

  for (const style of textStyles) {
    let aliasVariables = {} as TextStyle['boundVariables'];
    const boundVariables = style.boundVariables;

    if (boundVariables) {
      for (const key of Object.keys(
        boundVariables
      ) as VariableBindableTextField[]) {
        aliasVariables = {
          ...aliasVariables,
          [key]: await getAliasVariableName(
            boundVariables[key].id,
            isDTCGForamt,
            includeValueStringKeyToAlias,
            resolver
          ),
        };
      }
    }

    const fontStyleWeight = getFontStyleAndWeight(style.fontName.style);

    // The DTCG typography composite is a closed set: fontFamily, fontSize,
    // fontWeight, letterSpacing, lineHeight. Everything else Figma exposes is
    // vendor data — it stays in $value only in the legacy (non-DTCG) format.
    const {
      fontStyle,
      paragraphSpacing,
      paragraphIndent,
      textDecoration,
      textCase,
      ...specValue
    } = {
      fontFamily: aliasVariables.fontFamily || style.fontName.family,
      fontWeight: aliasVariables.fontWeight || fontStyleWeight.weight,
      fontStyle: aliasVariables.fontStyle || fontStyleWeight.style,
      fontSize: aliasVariables.fontSize || makeDimension(style.fontSize, isDTCGForamt),
      lineHeight:
        aliasVariables.lineHeight ||
        getLineHeight(style.lineHeight, isDTCGForamt),
      letterSpacing:
        aliasVariables.letterSpacing ||
        getLetterSpacing(style.letterSpacing, isDTCGForamt),
      paragraphSpacing:
        aliasVariables.paragraphSpacing ||
        (isDTCGForamt
          ? makeDimension(style.paragraphSpacing, true)
          : `${style.paragraphSpacing}`),
      paragraphIndent:
        aliasVariables.paragraphIndent ||
        (isDTCGForamt
          ? makeDimension(style.paragraphIndent, true)
          : `${style.paragraphIndent}`),
      textDecoration: style.textDecoration,
      textCase: style.textCase,
    };

    const figmaOnlyValue = {
      fontStyle,
      paragraphSpacing,
      paragraphIndent,
      textDecoration,
      textCase,
    };

    const styleObject = {
      [keyNames.type]: 'typography',
      [keyNames.value]: isDTCGForamt
        ? specValue
        : { ...specValue, ...figmaOnlyValue },
      [keyNames.description]: style.description,
      $extensions: {
        [PLUGIN_EXTENSION_NAMESPACE]: {
          styleId: style.id,
          ...(isDTCGForamt ? figmaOnlyValue : {}),
        },
      },
    } as unknown as TypographyTokenI;

    allTextStyles[style.name] = styleObject;
  }

  textTokens[customName] = groupObjectNamesIntoCategories(
    applyNameConvention(allTextStyles, nameConvention)
  );

  return textTokens;
};
