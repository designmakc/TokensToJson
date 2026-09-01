export const normalizeType = (
  type: VariableResolvedDataType,
  variableScopes: VariableScope[],
  opacityFormat: opacityFormatType = 'decimal'
) => {
  switch (type) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      if (variableScopes.length === 1) {
        if (variableScopes[0] === 'FONT_WEIGHT') {
          return 'fontWeight';
        } else if (variableScopes[0] === 'OPACITY') {
          return opacityFormat === 'percent' ? 'string' : 'number';
        }
      }
      return 'dimension';
    case 'STRING':
      if (variableScopes.length === 1) {
        if (variableScopes[0] === 'FONT_WEIGHT') {
          return 'fontWeight';
        }
      }
      return 'string';
    case 'BOOLEAN':
      return 'boolean';
    default:
      return 'string';
  }
};

/**
 * Token types emitted by the plugin that are not part of the
 * DTCG 2025.10 closed type set. When exporting in strict DTCG format,
 * `$type` is omitted for these tokens and the original type is
 * preserved in the token's `$extensions`.
 */
export const isNonSpecTokenType = (tokenType: string): boolean => {
  return tokenType === 'string' || tokenType === 'boolean';
};
