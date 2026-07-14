import React from 'react';
import styles from './styles.module.scss';

import {
  Panel,
  PanelHeader,
  Stack,
  Text,
  Toggle,
  Input,
  IconButton,
  Icon,
  Button,
} from 'react-figma-ui/ui';

import { t } from '@app/i18n';
import { Hint } from '@app/components/Hint';
import { DEFAULT_CATEGORY_RULES } from '@common/transform/categories/defaultCategoryRules';

interface ViewProps {
  JSONsettingsConfig: JSONSettingsConfigI;
  setJSONsettingsConfig: React.Dispatch<
    React.SetStateAction<JSONSettingsConfigI>
  >;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
}

const defaultConfig = (): TokenCategoriesConfigI => ({
  isEnabled: true,
  refineTypes: false,
  rules: DEFAULT_CATEGORY_RULES,
});

export const CategorySettingsView = ({
  JSONsettingsConfig,
  setJSONsettingsConfig,
  setCurrentView,
}: ViewProps) => {
  const config = JSONsettingsConfig.tokenCategories || defaultConfig();

  const updateConfig = (patch: Partial<TokenCategoriesConfigI>) => {
    setJSONsettingsConfig({
      ...JSONsettingsConfig,
      tokenCategories: { ...config, ...patch },
    });
  };

  const updateRule = (index: number, patch: Partial<TokenCategoryRuleI>) => {
    const rules = config.rules.map((rule, i) =>
      i === index ? { ...rule, ...patch } : rule
    );
    updateConfig({ rules });
  };

  return (
    <Panel hasLeftRightPadding={false} hasTopBottomPadding bottomBorder={false}>
      <Stack hasLeftRightPadding={false}>
        <PanelHeader
          title={t('Token categories')}
          isActive
          hasBackButton
          onClick={() => {
            setCurrentView('advancedSettings');
          }}
        />
      </Stack>

      <Panel>
        <Stack hasLeftRightPadding>
          <Toggle
            id="token-categories-enabled"
            checked={config.isEnabled}
            onChange={(checked: boolean) => updateConfig({ isEnabled: checked })}
          >
            <Text>{t('Resolve categories by token name')}</Text>
            <Hint
              inline
              text={t(
                'Matches token name segments against the keywords below and writes the category into $extensions["tokens-to-json"].category. ALL_SCOPES is always stripped from the export — it is a Figma picker workaround, not semantics.'
              )}
            />
          </Toggle>
        </Stack>
      </Panel>

      <Panel>
        <Stack hasLeftRightPadding>
          <Toggle
            id="token-categories-refine"
            checked={config.refineTypes}
            onChange={(checked: boolean) =>
              updateConfig({ refineTypes: checked })
            }
          >
            <Text>{t('Refine token types by category')}</Text>
            <Hint
              inline
              text={t(
                'Upgrades generic FLOAT "dimension" to a more precise DTCG type: opacity to number, motion to duration, weight to fontWeight. A precise Figma scope always wins over the name.'
              )}
            />
          </Toggle>
        </Stack>
      </Panel>

      <Panel>
        <Stack hasLeftRightPadding hasTopBottomPadding gap="var(--space-small)">
          <Text className={styles.listLabel}>
            {t('Category keywords (comma separated)')}
          </Text>

          <Stack gap="var(--space-extra-small)">
            {config.rules.map((rule, index) => (
              <Stack
                key={index}
                direction="row"
                gap="var(--space-extra-small)"
                className={styles.ruleRow}
              >
                <Input
                  id={`category-name-${index}`}
                  className={styles.categoryInput}
                  value={rule.category}
                  placeholder={t('Category')}
                  onChange={(value: string) =>
                    updateRule(index, { category: value })
                  }
                />
                <Input
                  id={`category-keywords-${index}`}
                  className={styles.keywordsInput}
                  value={rule.keywords.join(', ')}
                  placeholder={t('keyword, keyword')}
                  onChange={(value: string) =>
                    updateRule(index, {
                      keywords: value.split(',').map((word) => word.trim()),
                    })
                  }
                />
                <IconButton
                  onClick={() =>
                    updateConfig({
                      rules: config.rules.filter((_, i) => i !== index),
                    })
                  }
                  children={<Icon name="minus" size="32" />}
                />
              </Stack>
            ))}
          </Stack>

          <Stack hasTopBottomPadding gap="var(--space-extra-small)">
            <Button
              label={t('Add rule')}
              fullWidth
              secondary
              onClick={() =>
                updateConfig({
                  rules: [...config.rules, { category: '', keywords: [] }],
                })
              }
            />
            <Button
              label={t('Reset to defaults')}
              fullWidth
              secondary
              onClick={() => updateConfig({ rules: DEFAULT_CATEGORY_RULES })}
            />
          </Stack>
        </Stack>
      </Panel>
    </Panel>
  );
};
