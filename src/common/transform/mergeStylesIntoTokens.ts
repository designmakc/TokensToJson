export const mergeStylesIntoTokens = (
  variableTokens: any,
  styleTokens: any,
  storeStyleInCollection: string
) => {
  if (!storeStyleInCollection || storeStyleInCollection === 'none') {
    // Object.assign(variableTokens, styleTokens);
    styleTokens.forEach((styleToken) => {
      Object.assign(variableTokens, styleToken);
    });
  } else {
    // The profile is shared by every file, so the chosen collection may not
    // exist in the one being exported (or it is excluded from the export).
    if (!variableTokens[storeStyleInCollection]) {
      throw new Error(
        `[tokens] "Add styles to" is set to "${storeStyleInCollection}", but this export has no such collection. Open the file that owns it, or change the setting.`
      );
    }

    // Object.assign(variableTokens[storeStyleInCollection], styleTokens);
    styleTokens.forEach((styleToken) => {
      Object.assign(variableTokens[storeStyleInCollection], styleToken);
    });
  }

  // console.log("variableTokens", variableTokens);

  return variableTokens;
};
