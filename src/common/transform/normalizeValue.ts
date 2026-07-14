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
  usePercentageOpacity: boolean;
  omitCollectionNames?: boolean;
  // Name-based category refinement ("Refine types" setting) — the value
  // must be formatted to match the refined $type, not as a dimension
  refinedType?: TokenCategoryRefineTypeT;
}

export const normalizeValue = async (props: PropsI, resolver: IResolver) => {
  const {
    variableValue,
    variableType,
    variableScope,
    colorMode,
    useDTCG,
    includeValueStringKeyToAlias,
    usePercentageOpacity,
    omitCollectionNames = false,
    refinedType,
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
      if (usePercentageOpacity) {
        return `${variableValue}%`;
      } else {
        return Number(variableValue) / 100;
      }
    }

    // A precise scope (branches above) wins over the name-based refinement
    if (refinedType === 'number' || refinedType === 'fontWeight') {
      return new Decimal(variableValue).toDecimalPlaces(6).toNumber();
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
