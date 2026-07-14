import React from 'react';
import styles from './styles.module.scss';

import {
  Panel,
  PanelHeader,
  Stack,
  Text,
  Toggle,
  Icon,
} from 'react-figma-ui/ui';
import { t } from '@app/i18n';
import { Hint } from '@app/components/Hint';

interface ViewProps {
  JSONsettingsConfig: JSONSettingsConfigI;
  setJSONsettingsConfig: React.Dispatch<
    React.SetStateAction<JSONSettingsConfigI>
  >;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
}

type AdvancedSettingItem = {
  id: string;
  label: React.ReactNode;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const AdvancedSettingsView = ({
  JSONsettingsConfig,
  setJSONsettingsConfig,
  setCurrentView,
}: ViewProps) => {
  const toggleItems: AdvancedSettingItem[] = [
    {
      id: 'split-by-collection',
      label: t('Split collections into separate files'),
      hint: t(
        'Each variable collection becomes its own {Collection}.tokens.json file (a zip archive on download).'
      ),
      checked: JSONsettingsConfig.splitByCollection,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          splitByCollection: checked,
        });
      },
    },
    {
      id: 'split-by-mode',
      label: t('Split modes into separate files'),
      hint: t(
        'Each collection mode becomes its own {Collection}/{Mode}.tokens.json file with values resolved for that mode.'
      ),
      checked: JSONsettingsConfig.splitByMode,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          splitByMode: checked,
        });
      },
    },
    {
      id: 'omit-collection-names',
      label: t('Omit collection names'),
      hint: t(
        'Drop top-level collection names and merge all variables into one flat namespace. On name collisions the last one wins.'
      ),
      checked: JSONsettingsConfig.omitCollectionNames,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          omitCollectionNames: checked,
        });
      },
    },
    {
      id: 'include-variable-scopes',
      label: t('Include variable scopes'),
      hint: t(
        "Add each variable's Figma scopes to the JSON as an array of strings, without transformations."
      ),
      checked: JSONsettingsConfig.includeScopes,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          includeScopes: checked,
        });
      },
    },
    {
      id: 'use-percentage-opacity',
      label: t('Use percentage for opacity'),
      hint: t(
        'Export OPACITY-scoped values as percentages ("10%") instead of decimals (0.1).'
      ),
      checked: JSONsettingsConfig.usePercentageOpacity,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          usePercentageOpacity: checked,
        });
      },
    },
    {
      id: 'include-value-alias-string',
      label: (
        <>
          {t('Include')} <span className={styles.codeLine}>.value</span>{' '}
          {t('string for aliases')}
        </>
      ),
      hint: t(
        'Append .value (or .$value in DTCG format) to alias paths, e.g. {colors.primary.10.value}.'
      ),
      checked: JSONsettingsConfig.includeValueStringKeyToAlias,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          includeValueStringKeyToAlias: checked,
        });
      },
    },
    {
      id: 'include-figma-metadata',
      label: t('Include figma metadata'),
      hint: t(
        "Add Figma metadata (variableId, codeSyntax, collection info) into each token's $extensions."
      ),
      checked: JSONsettingsConfig.includeFigmaMetaData,
      onChange: (checked: boolean) => {
        setJSONsettingsConfig({
          ...JSONsettingsConfig,
          includeFigmaMetaData: checked,
        });
      },
    },
  ];

  return (
    <Panel hasLeftRightPadding={false} hasTopBottomPadding bottomBorder={false}>
      <Stack hasLeftRightPadding={false}>
        <PanelHeader
          title={t('Advanced settings')}
          isActive
          hasBackButton
          onClick={() => {
            setCurrentView('main');
          }}
        />
      </Stack>

      <Stack hasLeftRightPadding={false}>
        {toggleItems.map((item) => (
          <Panel key={item.id}>
            <Stack hasLeftRightPadding>
              <Toggle
                id={item.id}
                checked={item.checked}
                onChange={item.onChange}
              >
                <Text>{item.label}</Text>
                <Hint inline text={item.hint} />
              </Toggle>
            </Stack>
          </Panel>
        ))}

        <Panel>
          <PanelHeader
            title={t('Token categories')}
            onClick={() => {
              setCurrentView('tokenCategories');
            }}
            iconButtons={[
              {
                children: <Icon name="caret-right" size="16" />,
                onClick: () => {
                  setCurrentView('tokenCategories');
                },
              },
            ]}
          />
        </Panel>
      </Stack>
    </Panel>
  );
};
