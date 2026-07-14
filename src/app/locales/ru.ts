// Русский словарь. Ключ — английская строка из UI as-is.
// Строки без перевода автоматически остаются английскими (см. i18n.ts).
export const ru: Record<string, string> = {
  // SettingsView
  'Show output': 'Показать результат',
  'Color mode': 'Формат цвета',
  'Include styles': 'Включить стили',
  'Add styles to': 'Добавить стили в',
  'Keep separate': 'Хранить отдельно',
  'Advanced settings': 'Расширенные настройки',
  'Push to server': 'Отправить на сервер',
  'Download JSON': 'Скачать JSON',
  'Import tokens (Beta)': 'Импорт токенов (бета)',
  Documentation: 'Документация',
  'Switch language': 'Переключить язык',
  'Drag to resize. Double-click to auto-fit':
    'Тяните для изменения размера. Двойной клик — автоподбор',
  'Import Error': 'Ошибка импорта',
  'Import Successful': 'Импорт выполнен',
  'Import Failed': 'Импорт не удался',

  // AdvancedSettingsView
  'Split collections into separate files':
    'Разбить коллекции по отдельным файлам',
  'Split modes into separate files': 'Разбить режимы по отдельным файлам',
  'Omit collection names': 'Опустить имена коллекций',
  'Include variable scopes': 'Включить scopes переменных',
  'Use percentage for opacity': 'Прозрачность в процентах',
  Include: 'Добавлять',
  'string for aliases': 'к алиасам',
  'Include figma metadata': 'Включить метаданные Figma',

  // EmptyView
  'No variables found in the file': 'В файле не найдено переменных',
  'Continue without variables': 'Продолжить без переменных',

  // Profiles
  'Create profile': 'Создать профиль',
  'Profile name': 'Имя профиля',
  Create: 'Создать',
  Profile: 'Профиль',
  Save: 'Сохранить',
  Remove: 'Удалить',

  // CodePreviewView + JsonViewer
  'Search…': 'Поиск…',
  'Previous match (Shift+Enter)': 'Предыдущее совпадение (Shift+Enter)',
  'Next match (Enter)': 'Следующее совпадение (Enter)',
  'Close search (Esc)': 'Закрыть поиск (Esc)',
  'Search (⌘F)': 'Поиск (⌘F)',
  Update: 'Обновить',
  'Copied!': 'Скопировано!',
  Copy: 'Копировать',
  tokens: 'токенов',
  groups: 'групп',
  lines: 'строк',

  // ServerSettingsView
  'JSONbin credentials': 'Доступы JSONbin',
  'To use JSONbin you need to create': 'Для работы с JSONbin создайте',
  'an account': 'аккаунт',
  'and get your': 'и получите',
  'API key': 'API-ключ',
  'Github credentials': 'Доступы Github',
  'In order to post on Github you need to have a':
    'Для публикации на Github нужен',
  'personal access token': 'персональный токен доступа',
  'Gitlab credentials': 'Доступы Gitlab',
  'In order to post on Gitlab you need to have a':
    'Для публикации на Gitlab нужен',
  'project access token': 'токен доступа проекта',
  'Custom URL': 'Свой URL',
  'To use custom URL you need to create a server that will accept POST or PUT requests with JSON body.':
    'Для отправки на свой URL нужен сервер, принимающий POST- или PUT-запросы с JSON-телом.',
  'Bin name': 'Имя bin',
  'Access Key': 'Ключ доступа',
  'Bin ID (for existing bin)': 'ID bin (для существующего)',
  'Personal access token': 'Персональный токен доступа',
  Owner: 'Владелец',
  'Repo name': 'Имя репозитория',
  'Branch name': 'Имя ветки',
  'File name': 'Имя файла',
  'Commit message (optional)': 'Сообщение коммита (необязательно)',
  'Base branch': 'Базовая ветка',
  'Branch name (optional)': 'Имя ветки (необязательно)',
  'PR title (optional)': 'Заголовок PR (необязательно)',
  'PR body (optional)': 'Описание PR (необязательно)',
  'Gitlab host for selfhosted (default: gitlab.com)':
    'Хост Gitlab для selfhosted (по умолчанию gitlab.com)',
  'Project access token': 'Токен доступа проекта',
  'Method (POST or PUT)': 'Метод (POST или PUT)',
  'Headers (optional)': 'Заголовки (необязательно)',

  // Server push toasts
  'Github: Updated successfully': 'Github: успешно обновлено',
  'Tokens on Github have been updated successfully':
    'Токены на Github обновлены',
  'Github: Created successfully': 'Github: успешно создано',
  'Tokens on Github have been created successfully':
    'Токены на Github созданы',
  'Github: Error creating file': 'Github: ошибка создания файла',
  'Error creating file:': 'Ошибка создания файла:',
  'Github: An error occurred': 'Github: произошла ошибка',
  'Github: Error creating pull request':
    'Github: ошибка создания pull request',
  'Error creating pull request:': 'Ошибка создания pull request:',
  'Github Pull Request has been updated successfully':
    'Pull Request на Github обновлён',
  'Gitlab: An error occured': 'Gitlab: произошла ошибка',
  'Error:': 'Ошибка:',
  'Gitlab: Updated successfully': 'Gitlab: успешно обновлено',
  'Tokens on Gitlab have been updated successfully':
    'Токены на Gitlab обновлены',
  'Gitlab: Created successfully': 'Gitlab: успешно создано',
  'Tokens on Gitlab have been created successfully':
    'Токены на Gitlab созданы',
  'JSONBin: Updated successfully': 'JSONBin: успешно обновлено',
  'Tokens on JSONBin have been updated successfully':
    'Токены на JSONBin обновлены',
  'JSONBin: Error pushing tokens': 'JSONBin: ошибка отправки токенов',
  'Error pushing tokens to JSONBin:': 'Ошибка отправки токенов на JSONBin:',
};
