import React, { useState } from 'react';

import { Panel, PanelHeader, Stack, Button, Input } from 'react-figma-ui/ui';
import { t } from '@app/i18n';

interface NewProfileViewProps {
  addProfile: (profileName: string) => void;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
}

export const NewProfileView = ({
  addProfile,
  setCurrentView,
}: NewProfileViewProps) => {
  const [profileName, setProfileName] = useState('');

  return (
    <Panel hasLeftRightPadding={false} hasTopBottomPadding bottomBorder={false}>
      <Stack hasLeftRightPadding={false}>
        <PanelHeader
          title={t('Create profile')}
          isActive
          hasBackButton
          onClick={() => {
            setCurrentView('main');
          }}
        />
      </Stack>

      <Stack hasLeftRightPadding hasTopBottomPadding gap="var(--space-small)">
        <Stack gap="var(--space-extra-small)">
          <Input
            id="create-profile-name"
            placeholder={t('Profile name')}
            value={profileName}
            onChange={(value: string) => {
              setProfileName(value);
            }}
          />
        </Stack>

        <Stack hasTopBottomPadding gap="var(--space-extra-small)">
          <Button
            label={t('Create')}
            fullWidth
            secondary
            disabled={!profileName.trim()}
            onClick={() => {
              const trimmed = profileName.trim();
              if (!trimmed) return;
              addProfile(trimmed);
              setCurrentView('main');
            }}
          />
        </Stack>
      </Stack>
    </Panel>
  );
};
