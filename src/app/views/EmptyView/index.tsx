import React from 'react';

import { config } from '@app/controller/config';
import { t } from '@app/i18n';

import { Text, Button, Stack } from 'react-figma-ui/ui';
import { StatusPicture } from '@app/components/StatusPicture';

import styles from './styles.module.scss';

interface EmptyViewProps {
  setFileHasVariables: (value: boolean) => void;
  onImportTokens?: () => Promise<void>;
  isImporting?: boolean;
}

export const EmptyView = ({
  setFileHasVariables,
  onImportTokens,
  isImporting = false,
}: EmptyViewProps) => {
  return (
    <section className={styles.emptyView}>
      <Stack gap={8} className={styles.group}>
        <StatusPicture status="error" />
        <Text className={styles.label}>{t('No variables found in the file')}</Text>
      </Stack>

      <Stack gap={8} className={styles.group}>
        {onImportTokens && (
          <Button
            className={styles.button}
            label={t('Import tokens (Beta)')}
            onClick={onImportTokens}
            loading={isImporting}
            fullWidth
          />
        )}
        <Button
          className={styles.button}
          label={t('Continue without variables')}
          secondary
          onClick={() => {
            setFileHasVariables(true);
          }}
          fullWidth
        />
        <a
          href={config.docsLink}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
          style={{
            margin: '15px',
          }}
        >
          {t('Documentation')} 📖
        </a>
      </Stack>
    </section>
  );
};
