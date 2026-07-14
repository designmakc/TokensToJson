import React from 'react';
import styles from './styles.module.scss';

import { Panel, PanelHeader, Stack, Text, Toggle } from 'react-figma-ui/ui';
import { t } from '@app/i18n';

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
              </Toggle>
            </Stack>
          </Panel>
        ))}
      </Stack>
    </Panel>
  );
};
