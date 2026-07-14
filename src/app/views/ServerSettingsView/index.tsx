import React, { useState } from 'react';
import styles from './styles.module.scss';

import {
  PanelHeader,
  Panel,
  Stack,
  Button,
  Input,
  Text,
} from 'react-figma-ui/ui';
import { t } from '@app/i18n';

type ViewsConfigI = {
  [K in ServerType]: {
    title: string;
    description: React.ReactNode;
    isEnabled: boolean;
    fields: {
      readonly id: string;
      readonly type: 'input' | 'textarea' | 'select';
      readonly required: boolean;
      readonly placeholder?: string;
      readonly options?: string[];
      value: string;
    }[];
  };
};

interface ViewProps {
  JSONsettingsConfig: JSONSettingsConfigI;
  setJSONsettingsConfig: React.Dispatch<
    React.SetStateAction<JSONSettingsConfigI>
  >;
  setCurrentView: React.Dispatch<React.SetStateAction<string>>;
  server: ServerType;
}

// Function, not a module-level const: t() must re-evaluate on language change
const getViewsConfig = () =>
  ({
  jsonbin: {
    title: t('JSONbin credentials'),
    description: (
      <>
        {t('To use JSONbin you need to create')}{' '}
        <a href="https://jsonbin.io/" target="_blank" rel="noopener noreferrer">
          {t('an account')}
        </a>{' '}
        {t('and get your')}{' '}
        <a
          href="https://jsonbin.io/api-reference/access-keys/create"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('API key')}
        </a>
        .
      </>
    ),
    isEnabled: false,
    fields: [
      {
        id: 'name',
        placeholder: t('Bin name'),
        type: 'input',
        value: 'design.tokens',
        required: true,
      },
      {
        id: 'secretKey',
        placeholder: t('Access Key'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'id',
        placeholder: t('Bin ID (for existing bin)'),
        type: 'input',
        value: '',
        required: false,
      },
    ],
  },
  github: {
    title: t('Github credentials'),
    description: (
      <>
        {t('In order to post on Github you need to have a')}{' '}
        <a
          href="https://github.com/settings/tokens/new?scopes=repo"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('personal access token')}
        </a>
        .
      </>
    ),
    isEnabled: false,
    fields: [
      {
        id: 'token',
        placeholder: t('Personal access token'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'owner',
        placeholder: t('Owner'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'repo',
        placeholder: t('Repo name'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'branch',
        placeholder: t('Branch name'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'fileName',
        placeholder: t('File name'),
        type: 'input',
        value: 'design.tokens.json',
        required: true,
      },
      {
        id: 'commitMessage',
        placeholder: t('Commit message (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
    ],
  },
  githubPullRequest: {
    title: t('Github credentials'),
    description: (
      <>
        {t('In order to post on Github you need to have a')}{' '}
        <a
          href="https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('personal access token')}
        </a>
        .
      </>
    ),
    isEnabled: false,
    fields: [
      {
        id: 'token',
        placeholder: t('Personal access token'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'owner',
        placeholder: t('Owner'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'repo',
        placeholder: t('Repo name'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'baseBranch',
        placeholder: t('Base branch'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'branch',
        placeholder: t('Branch name (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
      {
        id: 'fileName',
        placeholder: t('File name'),
        type: 'input',
        value: 'design.tokens.json',
        required: true,
      },
      {
        id: 'commitMessage',
        placeholder: t('Commit message (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
      {
        id: 'pullRequestTitle',
        placeholder: t('PR title (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
      {
        id: 'pullRequestBody',
        placeholder: t('PR body (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
    ],
  },
  gitlab: {
    title: t('Gitlab credentials'),
    description: (
      <>
        {t('In order to post on Gitlab you need to have a')}{' '}
        <a
          href="https://docs.gitlab.com/ee/user/project/settings/project_access_tokens.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('project access token')}
        </a>
        .
      </>
    ),
    isEnabled: false,
    fields: [
      {
        id: 'host',
        placeholder: t('Gitlab host for selfhosted (default: gitlab.com)'),
        type: 'input',
        value: '',
        required: false,
      },
      {
        id: 'token',
        placeholder: t('Project access token'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'owner',
        placeholder: t('Owner'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'repo',
        placeholder: t('Repo name'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'branch',
        placeholder: t('Branch name'),
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'fileName',
        placeholder: t('File name'),
        type: 'input',
        value: 'design.tokens.json',
        required: true,
      },
      {
        id: 'commitMessage',
        placeholder: t('Commit message (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
    ],
  },
  customURL: {
    title: t('Custom URL'),
    description: (
      <>
        {t(
          'To use custom URL you need to create a server that will accept POST or PUT requests with JSON body.'
        )}
      </>
    ),
    isEnabled: false,
    fields: [
      {
        id: 'url',
        placeholder: 'URL',
        type: 'input',
        value: '',
        required: true,
      },
      {
        id: 'method',
        placeholder: t('Method (POST or PUT)'),
        type: 'input',
        required: true,
      },
      {
        id: 'headers',
        placeholder: t('Headers (optional)'),
        type: 'input',
        value: '',
        required: false,
      },
    ],
  },
} as ViewsConfigI);

interface LocalConfigI {
  isEnabled: boolean;
  [key: string]: string | boolean;
}

export const ServerSettingsView = (props: ViewProps) => {
  const { JSONsettingsConfig, setJSONsettingsConfig, setCurrentView } = props;
  const [errorFields, setErrorFields] = useState([] as string[]);
  const viewsConfig = getViewsConfig();

  const [config, setConfig] = useState(
    viewsConfig[props.server].fields.reduce((acc, field) => {
      const serverSettings = (JSONsettingsConfig.servers[props.server] ||
        {}) as unknown as Record<string, string | boolean>;

      return {
        ...acc,
        isEnabled: !!serverSettings.isEnabled,
        [field.id]: serverSettings[field.id] ?? '',
      };
    }, {} as LocalConfigI)
  );

  // console.log("config state", config);

  const isFormValid = viewsConfig[props.server].fields.every((field) => {
    return config[field.id] !== '' || !field.required;
  });

  /////////////////
  // MAIN RENDER //
  /////////////////

  // console.log("props.server", props.server);
  // console.log("viewsConfig[props.server]", viewsConfig[props.server]);

  return (
    <Panel hasLeftRightPadding={false} hasTopBottomPadding bottomBorder={false}>
      <Stack hasLeftRightPadding={false}>
        <PanelHeader
          title={viewsConfig[props.server].title}
          isActive
          hasBackButton
          onClick={() => {
            setCurrentView('main');
          }}
        />
      </Stack>
      <Stack hasLeftRightPadding hasTopBottomPadding gap="var(--space-small)">
        <Stack hasTopBottomPadding>
          <Text className={styles.description}>
            {viewsConfig[props.server].description}
          </Text>
        </Stack>

        <Stack gap="var(--space-extra-small)">
          {viewsConfig[props.server].fields.map((field) => {
            const handleErrorsOnBlur = (value: string) => {
              if (value === '' && field.required) {
                setErrorFields((prevState) => {
                  return [...prevState, field.id];
                });
              }
            };

            const clearErrorOnFocus = () => {
              setErrorFields((prevState) => {
                return prevState.filter((item) => item !== field.id);
              });
            };

            const handleChange = (value: string) => {
              setConfig((prevState) => {
                return {
                  ...prevState,
                  [field.id]: value,
                };
              });
            };

            return (
              <Input
                key={field.id}
                id={field.id}
                placeholder={field.placeholder}
                value={
                  JSONsettingsConfig.servers[props.server]?.[field.id] || ''
                }
                onChange={handleChange}
                onBlur={handleErrorsOnBlur}
                onFocus={clearErrorOnFocus}
                isInvalid={errorFields.includes(field.id)}
              />
            );
          })}
        </Stack>

        <Stack hasTopBottomPadding gap="var(--space-extra-small)">
          <Button
            label={t('Save')}
            fullWidth
            secondary
            // disabled={!isFormValid}
            onClick={() => {
              // check if all fields are filled
              if (!isFormValid) {
                console.log('not valid');
                setErrorFields(
                  // add to array only fields that are empty
                  viewsConfig[props.server].fields.reduce((acc, field) => {
                    if (!config[field.id] && field.required) {
                      return [...acc, field.id];
                    }

                    return acc;
                  }, [] as string[])
                );

                return;
              }

              setJSONsettingsConfig((prevState) => {
                return {
                  ...prevState,
                  servers: {
                    ...prevState.servers,
                    [props.server]: {
                      ...prevState.servers[props.server],
                      ...config,
                      isEnabled: true,
                    },
                  },
                };
              });

              setCurrentView('main');
            }}
          />
          <Button
            label={t('Remove')}
            fullWidth
            secondary
            danger
            disabled={!config.isEnabled}
            onClick={() => {
              setJSONsettingsConfig((prevState) => {
                return {
                  ...prevState,
                  servers: {
                    ...prevState.servers,

                    // reset config
                    [props.server]: viewsConfig[props.server].fields.reduce(
                      (acc, field) => {
                        return {
                          ...acc,
                          isEnabled: false,
                          [field.id]:
                            viewsConfig[props.server].fields.find(
                              (item) => item.id === field.id
                            )?.value ?? '',
                        };
                      },
                      {} as Record<string, string | boolean>
                    ),
                  },
                };
              });

              setCurrentView('main');
            }}
          />
        </Stack>
      </Stack>
    </Panel>
  );
};
