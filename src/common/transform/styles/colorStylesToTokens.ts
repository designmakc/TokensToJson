import { groupObjectNamesIntoCategories } from '@common/transform/groupObjectNamesIntoCategories';
import { convertRGBA } from '@common/transform/color/convertRGBA';
import { getGradientGeometry } from '@common/transform/color/gradientGeometry';
import { getTokenKeyName } from '@common/transform/getTokenKeyName';
import { getAliasVariableName } from '@common/transform/getAliasVariableName';
import { IResolver } from '@common/resolver';

import { PLUGIN_EXTENSION_NAMESPACE } from '@common/transform/extensionNamespace';
import { applyNameConvention } from './applyNameConvention';

// Design-system contract checks. They only warn — export always proceeds.
const validateGradientStyle = (
  styleName: string,
  paint: GradientPaint,
  geometry: ReturnType<typeof getGradientGeometry>
) => {
  const isGradientSlot = /^gradient\//i.test(styleName);

  paint.gradientStops.forEach((stop, i) => {
    const bound = (stop as any).boundVariables?.color;

    if (isGradientSlot && !bound?.id) {
      console.warn(
        `[tokens] Style "${styleName}": hardcoded color in gradient stop ${i} (position ${stop.position}). Stops under gradient/* must be bound to variables.`
      );
    }

    if (!bound?.id && stop.color.a === 0) {
      console.warn(
        `[tokens] Style "${styleName}": stop ${i} has alpha=0. Platforms interpolate transparency differently — use rgba(<same color>, 0) instead of transparent.`
      );
    }
  });

  if (geometry.kind === 'linear') {
    const midX = (geometry.start.x + geometry.end.x) / 2;
    const midY = (geometry.start.y + geometry.end.y) / 2;

    if (Math.abs(midX - 0.5) > 0.01 || Math.abs(midY - 0.5) > 0.01) {
      console.warn(
        `[tokens] Style "${styleName}": gradient handles are not symmetric around the center. CSS linear-gradient() cannot express this — web and native will render it differently.`
      );
    }
  }
};

const convertGradientStopsToDTCG = async (
  gradientStops: ReadonlyArray<ColorStop>,
  colorMode: colorModeType,
  isDTCGFormat: boolean,
  includeValueStringKeyToAlias: boolean,
  resolver: IResolver
) => {
  const stops: { color: string | undefined; position: number }[] = [];

  for (let i = 0; i < gradientStops.length; i++) {
    const stop = gradientStops[i];
    let colorValue;

    // Each gradient stop can have its own bound variable for the color
    const stopBoundVariable = (stop as any).boundVariables?.color;

    if (stopBoundVariable?.id) {
      colorValue = await getAliasVariableName(
        stopBoundVariable.id,
        isDTCGFormat,
        includeValueStringKeyToAlias,
        resolver
      );
      console.log(
        `Stop ${i} (position ${stop.position}): Variable ID ${stopBoundVariable.id} resolved to:`,
        colorValue
      );
    } else {
      const colorWithOpacity = {
        r: stop.color.r,
        g: stop.color.g,
        b: stop.color.b,
        a: stop.color.a,
      };
      colorValue = convertRGBA(colorWithOpacity, colorMode);
      console.log(
        `Stop ${i} (position ${stop.position}): No bound variable, using direct color:`,
        colorValue
      );
    }

    stops.push({
      color: colorValue,
      position: stop.position,
    });
  }

  return stops;
};

const isGradientPaint = (paint: Paint) =>
  paint.type === 'GRADIENT_LINEAR' ||
  paint.type === 'GRADIENT_RADIAL' ||
  paint.type === 'GRADIENT_ANGULAR' ||
  paint.type === 'GRADIENT_DIAMOND';

// The solid layer under a gradient: an alias when the paint is bound to a
// variable, a raw color (with the paint opacity) otherwise.
const convertUnderlayColor = async (
  paint: SolidPaint,
  colorMode: colorModeType,
  isDTCGFormat: boolean,
  includeValueStringKeyToAlias: boolean,
  resolver: IResolver
) => {
  const bound = (paint as any).boundVariables?.color;

  if (bound?.id) {
    return getAliasVariableName(
      bound.id,
      isDTCGFormat,
      includeValueStringKeyToAlias,
      resolver
    );
  }

  return convertRGBA(
    {
      r: paint.color.r,
      g: paint.color.g,
      b: paint.color.b,
      a: paint.opacity !== undefined ? paint.opacity : 1,
    },
    colorMode
  );
};

export const colorStylesToTokens = async (
  customName: string,
  colorMode: colorModeType,
  isDTCGForamt: boolean,
  includeValueStringKeyToAlias: boolean,
  resolver: IResolver,
  nameConvention: nameConventionType = 'none'
) => {
  const keyNames = getTokenKeyName(isDTCGForamt);
  const paintStyles = await resolver.getLocalPaintStyles();

  let colorTokens = {};

  const allColorStyles = {};

  console.log('paintStyles', paintStyles);

  for (const style of paintStyles) {
    const styleName = style.name;
    const paints = style.paints;

    if (paints.length === 0) continue;

    const boundVariables = (style as any).boundVariables;

    // Figma lists paints bottom to top, so [SOLID, GRADIENT] is a gradient
    // over a solid underlay.
    const hasUnderlay =
      paints.length === 2 &&
      paints[0].type === 'SOLID' &&
      isGradientPaint(paints[1]);

    // Handle solid color paints
    if (paints.length === 1 && paints[0].type === 'SOLID') {
      const paint = paints[0] as SolidPaint;

      // Check for bound variables (aliases)
      let aliasVariable: string | null = null;

      if (boundVariables?.paints && boundVariables.paints.length > 0) {
        aliasVariable = await getAliasVariableName(
          boundVariables.paints[0].id,
          isDTCGForamt,
          includeValueStringKeyToAlias,
          resolver
        );
      }

      const colorWithOpacity = {
        r: paint.color.r,
        g: paint.color.g,
        b: paint.color.b,
        a: paint.opacity !== undefined ? paint.opacity : 1,
      };

      const styleObject = {
        [keyNames.type]: 'color',
        [keyNames.value]:
          aliasVariable || convertRGBA(colorWithOpacity, colorMode),
        $extensions: {
          [PLUGIN_EXTENSION_NAMESPACE]: {
            styleId: style.id,
          },
        },
      };

      allColorStyles[styleName] = styleObject;
    }

    // Handle gradient paints (LINEAR, RADIAL, ANGULAR, DIAMOND)
    else if (isGradientPaint(paints[0]) || hasUnderlay) {
      const underlay = hasUnderlay ? (paints[0] as SolidPaint) : null;
      const paint = (underlay ? paints[1] : paints[0]) as GradientPaint;

      if (!underlay && paints.length > 1) {
        console.warn(
          `[tokens] Style "${styleName}" has ${paints.length} paints; only the first is exported.`
        );
      }

      const gradientStops = await convertGradientStopsToDTCG(
        paint.gradientStops,
        colorMode,
        isDTCGForamt,
        includeValueStringKeyToAlias,
        resolver
      );

      const geometry = getGradientGeometry(paint);
      validateGradientStyle(styleName, paint, geometry);

      // A hidden underlay paints nothing — the style is just the gradient.
      const backgroundColor =
        underlay && underlay.visible !== false
          ? await convertUnderlayColor(
              underlay,
              colorMode,
              isDTCGForamt,
              includeValueStringKeyToAlias,
              resolver
            )
          : undefined;

      const styleObject = {
        [keyNames.type]: 'gradient',
        [keyNames.value]: gradientStops,
        $extensions: {
          [PLUGIN_EXTENSION_NAMESPACE]: {
            gradient: {
              ...geometry,
              figmaStyleId: style.id,
            },
            ...(backgroundColor !== undefined && { backgroundColor }),
          },
        },
      };

      allColorStyles[styleName] = styleObject;
    } else {
      console.warn(
        `[tokens] Style "${styleName}" has an unsupported paint combination (${paints
          .map((p) => p.type)
          .join(', ')}); style skipped.`
      );
    }
  }

  colorTokens[customName] = groupObjectNamesIntoCategories(
    applyNameConvention(allColorStyles, nameConvention)
  );

  return colorTokens;
};
