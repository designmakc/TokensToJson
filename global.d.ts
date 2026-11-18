/// <reference path="./node_modules/@figma/plugin-typings/index.d.ts" />

// Naming conventions offered for style token keys. Trimmed to the ones that
// are unambiguous for token names — the wider list this type used to carry was
// never implemented anywhere.
type nameConventionType =
  | 'none'
  | 'kebab-case'
  | 'camelCase'
  | 'PascalCase'
  | 'snake_case'
  | 'MACRO_CASE';

// Export format for OPACITY-scoped values: Figma stores 0-100.
// 'decimal' → 0.5, 'number' → 50, 'percent' → "50%"
type opacityFormatType = 'decimal' | 'number' | 'percent';

type colorModeType =
  | 'hex'
  | 'rgba-object'
  | 'rgba-css'
  | 'srgb-dtcg'
  | 'hsla-object'
  | 'hsla-css'
  | 'hsl-dtcg'
  | 'oklch-dtcg';

type stylesType = 'text' | 'colors' | 'effects' | 'grids';

type variableFeatureType = 'scope' | 'hidden';

type JSONSettingsStyleType = {
  isIncluded: boolean;
  customName: string;
};

interface IncludedStylesI {
  text: JSONSettingsStyleType;
  effects: JSONSettingsStyleType;
  grids: JSONSettingsStyleType;
  colors: JSONSettingsStyleType;
}

interface JsonbinCredentialsI {
  isEnabled: boolean;
  id?: string;
  name: string;
  secretKey: string;
}

interface GithubCredentialsI {
  isEnabled: boolean;
  token: string;
  repo: string;
  branch: string;
  fileName: string;
  owner: string;
  commitMessage?: string;
}

interface GithubPullRequestCredentialsI {
  isEnabled: boolean;
  token: string;
  repo: string;
  baseBranch: string;
  branch: string;
  fileName: string;
  owner: string;
  commitMessage?: string;
  pullRequestTitle?: string;
  pullRequestBody?: string;
}

interface GitlabCredentialsI {
  isEnabled: boolean;
  owner: string;
  host: string;
  repo: string;
  branch: string;
  fileName: string;
  token: string;
  commitMessage?: string;
}

interface CustomURLCredentialsI {
  isEnabled: boolean;
  url: string;
  method: 'POST' | 'PUT';
  headers: string;
}

type TokenCategoryRefineTypeT =
  | 'number'
  | 'duration'
  | 'fontWeight'
  | 'dimension';

type TokenCategoryRuleI = {
  category: string;
  keywords: string[];
  refineType?: TokenCategoryRefineTypeT;
};

type TokenCategoriesConfigI = {
  isEnabled: boolean;
  refineTypes: boolean;
  rules: TokenCategoryRuleI[];
};

interface ExportSettingsI {
  includedStyles: IncludedStylesI;
  // Collection names kept out of the export. Stored as an exclude list so that
  // an empty value means "export everything" and collections added in Figma
  // later are included by default.
  excludedCollections: string[];
  // Case convention applied to style token keys. 'none' keeps Figma's names.
  styleNameConvention: nameConventionType;
  tokenCategories?: TokenCategoriesConfigI;
  includeScopes: boolean;
  useDTCG: boolean;
  includeValueStringKeyToAlias: boolean;
  colorMode: colorModeType;
  storeStyleInCollection: string;
  includeFigmaMetaData: boolean;
  opacityFormat: opacityFormatType;
  splitByCollection: boolean;
  splitByMode: boolean;
  omitCollectionNames: boolean;
}

interface ServerSettingsI {
  jsonbin: JsonbinCredentialsI;
  github: GithubCredentialsI;
  githubPullRequest: GithubPullRequestCredentialsI;
  gitlab: GitlabCredentialsI;
  customURL: CustomURLCredentialsI;
}
type PluginStateI = {
  variableCollections: string[];
};

type JSONSettingsConfigI = ExportSettingsI &
  PluginStateI & {
    servers: ServerSettingsI;
  };

type ProfileId = string;

type SettingsProfileI = JSONSettingsConfigI & {
  profileName: string;
  updatedAt: number;
};

type MultiTenantConfigI = {
  activeProfileId: ProfileId;
  profiles: Record<ProfileId, SettingsProfileI>;
  language?: 'en' | 'ru';
};

interface PluginTokenI {
  $value: string;
  // Omitted in DTCG format for types outside the DTCG 2025.10 type set
  // (string/boolean); the original Figma type is kept in $extensions.figmaType
  $type?: TokenType;
  $description: string;
  scopes?: VariableScope[];
  $extensions: {
    mode: Object;
    // Alias target ids per mode name — mirrors `mode`, present only for
    // multi-mode collections that alias in at least one mode
    modeTargetIds?: Record<string, string>;
    // Opacity parts of a color-with-opacity value per mode name — mirrors
    // `mode`, consumed by the mode split
    modeOpacity?: Record<string, string | number>;
    figmaType?: VariableResolvedDataType;
    'tokens-to-json'?: {
      category?: string;
      // Color-with-opacity: $value is the base color, drawn with this
      // opacity (a reference, or a number in opacityFormat)
      opacity?: string | number;
    };
    figma?: {
      variableId: string;
      // Publishing identity: stable library key, and whether the variable is
      // publishable at all — a hidden one cannot be imported by key
      key: string;
      hiddenFromPublishing: boolean;
      codeSyntax: {
        WEB?: string;
        iOS?: string;
        ANDROID?: string;
      };
      collection: {
        id: string;
        name: string;
        defaultModeId: string;
      };
      // Set when $value is an alias — the raw id of the referenced variable
      targetVariableId?: string;
    };
  };
}

type ServerType = keyof ServerSettingsI;

interface TokensMessageI {
  type: 'getTokens' | 'setTokens' | 'importTokens' | 'importResult';
  tokens: any;
  role: 'preview' | 'push' | 'download' | 'import';
  server: ServerType[];
  result?: {
    success: boolean;
    message: string;
    collectionsCreated: number;
    variablesCreated: number;
    errors: string[];
  };
}

interface MetaPropsI {
  useDTCG: boolean;
  spec?: string;
  colorMode: colorModeType;
  variableCollections: string[] | undefined;
  createdAt: string;
  // Identity of the collection and mode this file holds. Only set when the
  // export is split per collection or per mode, where a file maps to exactly
  // one of each — the file name is a sanitized mode name, not an identifier.
  collection?: {
    id: string;
    name: string;
    defaultModeId: string;
  };
  mode?: {
    id: string;
    name: string;
  };
}

interface ToastIPropsI {
  title: string;
  message: string;
  options: {
    type?: 'success' | 'error' | 'warn' | 'info';
    timeout?: number;
    onClose?: () => void;
  };
}

// Extend Figmas PaintStyle interface
interface PaintStyleExtended extends PaintStyle {
  readonly boundVariables?: {
    readonly paints: VariableAlias[];
  };
}
