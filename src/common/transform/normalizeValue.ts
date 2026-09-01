import Decimal from 'decimal.js';
import { IResolver } from '@common/resolver';
import { convertRGBA } from './color/convertRGBA';
import { getAliasVariableName } from './getAliasVariableName';
import { makeDimension } from './makeDimension';

interface PropsI {
  variableValue: any;
  variableType: VariableResolvedDataType;
  variableScope: VariableScope[];
  colorMode: colorModeType;
  useDTCG: boolean;
  includeValueStringKeyToAlias: boolean;
  opacityFormat: opacityFormatType;
  omitCollectionNames?: boolean;
  // Name-based category refinement ("Refine types" setting) — the value
  // must be formatted to match the refined $type, not as a dimension
  refinedType?: TokenCategoryRefineTypeT;
  // Category behind the refinement — 'opacity' additionally applies opacityFormat
  refinedCategory?: string;
}

export const normalizeValue = async (props: PropsI, resolver: IResolver) => {
  const {
    variableValue,
    variableType,
    variableScope,
    colorMode,
    useDTCG,
    includeValueStringKeyToAlias,
    opacityFormat,
    omitCollectionNames = false,
    refinedType,
    refinedCategory,
  } = props;

  // console.log("variableValue", variableValue);

  if (variableValue?.type === 'VARIABLE_ALIAS') {
    // console.log("VARIABLE_ALIAS", variableValue);

    const aliasVariableName = await getAliasVariableName(
      variableValue.id,
      useDTCG,
      includeValueStringKeyToAlias,
      resolver,
      omitCollectionNames
    );

    return aliasVariableName;
  }

  if (variableType === 'COLOR') {
    return convertRGBA(variableValue, colorMode);
  }

  if (variableType === 'FLOAT') {
    if (variableScope.length === 1 && variableScope[0] === 'FONT_WEIGHT') {
      return Number(variableValue);
    } else if (variableScope.length === 1 && variableScope[0] === 'OPACITY') {
      // Figma stores opacity as a 0-100 percent number
      if (opacityFormat === 'percent') {
        return `${variableValue}%`;
      }
      if (opacityFormat === 'number') {
        return Number(variableValue);
      }
      return Number(variableValue) / 100;
    }

    // A precise scope (branches above) wins over the name-based refinement
    if (refinedType === 'number' || refinedType === 'fontWeight') {
      const n = new Decimal(variableValue).toDecimalPlaces(6).toNumber();
      // Name-refined opacity honors opacityFormat too. Unlike the OPACITY
      // scope (guaranteed 0-100 by Figma), name-matched values may be stored
      // as 0-100 or as a 0-1 fraction — same heuristic as the import side.
      if (refinedCategory === 'opacity') {
        const percent = n <= 1 ? n * 100 : n;
        if (opacityFormat === 'percent') {
          return `${percent}%`;
        }
        if (opacityFormat === 'number') {
          return percent;
        }
        return percent / 100;
      }
      return n;
    }
    if (refinedType === 'duration') {
      const duration = new Decimal(variableValue).toDecimalPlaces(6).toNumber();
      return useDTCG ? { value: duration, unit: 'ms' } : `${duration}ms`;
    }

    return makeDimension(
      new Decimal(variableValue).toDecimalPlaces(6).toNumber(),
      useDTCG
    );
  }

  return variableValue;
};
