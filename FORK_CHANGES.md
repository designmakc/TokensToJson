# Изменения форка (TokensToJson)

Форк [tokens-bruecke/figma-plugin](https://github.com/tokens-bruecke/figma-plugin) (база — v3.4.0, коммит `127b272`).
Цель: экспорт градиентов с геометрией и mode-механикой для мультибрендовой DS (web CSS + React Native), см. бриф `tokensbruecke-fork-brief.md`.

## Экспорт токенов

### Геометрия градиентов (GAP-1)

`src/common/transform/color/gradientGeometry.ts` — инверсия `gradientTransform` → handles + CSS-угол.
Гео пишется в `$extensions['tokens-to-json'].gradient`, `$value` остаётся чистым DTCG (только стопы):

```json
"$extensions": {
  "tokens-to-json": {
    "gradient": {
      "kind": "linear",
      "start": { "x": 0, "y": 0 },
      "end":   { "x": 1, "y": 1 },
      "cssAngle": 135,
      "figmaStyleId": "S:…"
    }
  }
}
```

- `kind`: linear | radial | conic | diamond
- `start`/`end` — доли 0..1, 1-в-1 для RN `LinearGradient`; `cssAngle` — derived для CSS
- В CLI-режиме (REST API) вместо `gradientTransform` приходит `gradientHandlePositions` — поддержаны обе формы
- Вырожденная матрица → фолбэк на горизонтальный градиент (90°)
- Юнит-тесты: `gradientGeometry.spec.ts` (0/45/90/135/180/270°, flip, REST-форма, вырожденная)

### styleId для drift-check (GAP-3)

- solid-цвета: `$extensions.styleId` (как у typography)
- градиенты: `figmaStyleId` внутри `$extensions['tokens-to-json'].gradient`

### Градиент на сплошной подложке

Стиль из двух слоёв — сплошная заливка снизу, градиент сверху (`paints = [SOLID, GRADIENT_*]`;
Figma перечисляет слои снизу вверх) — экспортируется как градиент. Раньше такой стиль пропускался
целиком с warn'ом «unsupported paint combination», и в выгрузке его не было вовсе.

`$value` и `gradient` — как у однослойного градиента; цвет подложки пишется рядом, в
`$extensions['tokens-to-json'].backgroundColor`:

```json
"$type": "gradient",
"$value": [{ "color": "{component.balance-card.gradient.default.start}", "position": 0 }, …],
"$extensions": {
  "tokens-to-json": {
    "gradient": { "kind": "radial", …, "figmaStyleId": "S:…" },
    "backgroundColor": "{semantic.color.background.interactive.fourth.default}"
  }
}
```

- подложка привязана к переменной → ссылка; не привязана → цвет в выбранном формате с учётом
  прозрачности слоя
- скрытая подложка (`visible: false`) ничего не рисует — `backgroundColor` не пишется
- CSS: `background: <gradient>, <backgroundColor>`; потребитель, который поля не знает, получает
  тот же градиент без фона под ним
- юнит-тесты: `colorStylesToTokens.spec.ts`

### Ошибка экспорта видна на экране

Профиль настроек общий для всех файлов. Если `Add styles to` указывает на коллекцию, которой в
открытом файле нет (или она исключена из экспорта), экспорт раньше падал с
`Cannot convert undefined or null to object` и ничего не показывал. Теперь `mergeStylesIntoTokens`
называет коллекцию в сообщении, а контроллер показывает любую ошибку экспорта через `figma.notify`.
Юнит-тесты: `mergeStylesIntoTokens.spec.ts`.

### Warn'ы при экспорте (§5.3 брифа)

В `colorStylesToTokens.ts`, только `console.warn`, экспорт не блокируют:

- стиль с несколькими paint'ами — экспортируется первый (GAP-2)
- стиль с неподдерживаемой комбинацией paint'ов — пропущен (раньше молча исчезал); градиент на
  сплошной подложке к ним не относится, см. выше
- hardcoded-стоп (без bound variable) в стилях `gradient/*`
- стоп с alpha=0 (платформы по-разному интерполируют прозрачность)
- асимметричный linear-градиент (midpoint handles вне центра ±0.01) — CSS `linear-gradient()` не выразит

### Категории токенов (semantic categories)

Проблема: Figma заставляет ставить `ALL_SCOPES` (иначе переменную не выбрать в стилях/эффектах), и по одному только `scopes` разработчики не понимали роль токена.

- Тумблер `Include variable scopes` пишет `scopes` **как есть, без преобразований** (включая `ALL_SCOPES`); семантическая интерпретация — рядом, в `$extensions["tokens-to-json"].category`
- Резолвер `src/common/transform/categories/`: сегменты имени токена сверяются со словарём ключевых слов, категория пишется в `$extensions["tokens-to-json"].category` (например `spacing`, `gradient`, `opacity`). Побеждает самый глубокий сегмент: `color/gradient/x` → `gradient`. Матчатся и слова внутри kebab/snake-сегментов (`icon-size` → `size`)
- Словарь редактируется в UI: Advanced settings → Token categories (категория + слова через запятую, Add rule / Reset to defaults); хранится в профиле
- Тумблер `Refine token types by category` (выкл. по умолчанию): уточняет generic FLOAT `dimension` до спекового типа — `opacity/*` → `number`, `motion/*` → `duration`, `weight` → `fontWeight`. Точный Figma-scope (`FONT_WEIGHT`, `OPACITY`) всегда приоритетнее имени. Кастомные значения в `$type` («spacing») не пишутся принципиально — DTCG 2025.10 закрытый набор, Style Dictionary теряет такие токены
- Style Dictionary фильтр: `(t) => t.$extensions?.['tokens-to-json']?.category === 'spacing'`

### Формат прозрачности (opacityFormat)

Boolean `usePercentageOpacity` заменён на enum `opacityFormat` (значения со scope `OPACITY`; Figma хранит 0–100):

- `decimal` (дефолт) → `0.5`, `$type: number`
- `number` → `50`, `$type: number`
- `percent` → `"50%"`, `$type: string` (в DTCG `$type` опускается, `figmaType: FLOAT` в `$extensions`)

Dropdown в Advanced settings. Миграция: старые профили/CLI-конфиги с `usePercentageOpacity: true` → `percent`. Импорт (`tokensToVariables`) принимает все три формы: `"50%"` → 50, доля ≤1 → ×100, число >1 → как есть.

Формат применяется в двух случаях: точный scope `OPACITY` (хранение 0–100 гарантировано Figma), либо категория `opacity` по имени при включённом **Refine types** — там хранение не гарантировано, поэтому эвристика как на импорте: значение ≤1 считается долей, >1 — процентами. Refine types выключен → generic dimension, как раньше.

### Figma-метаданные для обратной связки с REST API

Потребители экспорта (генератор спецификаций) связывают узлы макета с токенами через
REST-выгрузку файла, где `boundVariables` содержит только `VariableID:*` — имён переменных
там нет вообще. Без идентификаторов связка восстанавливается угадыванием по имени.

- `$extensions.figmaType` пишется **у каждого токена**, а не только там, где `$type` опущен.
  DTCG-тип лоссовый для чисел: `dimension` / `number` / `fontWeight` / `duration` — это всё
  один и тот же Figma-тип `FLOAT`, и обратно он не восстанавливается
- `$extensions.figma.key` — 40-символьный библиотечный ключ переменной, и
  `$extensions.figma.hiddenFromPublishing`. `variableId` живёт в пределах файла, а
  импортируется переменная по ключу; скрытая по ключу не импортируется вообще, поэтому
  потребитель не должен предлагать её как цель привязки
- `$extensions.figma.targetVariableId` — id переменной, на которую ссылается алиас
  (`value.id` при `type === "VARIABLE_ALIAS"`). Строковый `$value` вида
  `"{collection.path.to.token}"` разбирается только по точкам и ломается на первом же
  имени токена с точкой внутри
- `$extensions.modeTargetIds` — карта `имя моды → id цели`, зеркало `$extensions.mode`.
  При `splitByMode` она сворачивается в `figma.targetVariableId` того файла, чья это мода,
  и в выгрузку не попадает. Мода может ссылаться там, где дефолтная держит сырое значение,
  и наоборот — цель дефолтной моды в чужой файл не протекает
- В корневой мета-блок `tokens-bruecke-meta` при `splitByMode` / `splitByCollection`
  добавлены `collection` (`id`, `name`, `defaultModeId`) и `mode` (`id`, `name`).
  Имя файла — не идентификатор: оно санитизируется, а имена мод регистрозависимы и могут
  содержать пробелы и слэши. Без `modeId` переименование моды неотличимо от появления
  новой, а дефолтную моду коллекции не с чем сопоставить. Одномодовые коллекции не
  исключение — их единственная мода тоже называется и идентифицируется

Обратная совместимость: всё внутри `$extensions`, структура DTCG-дерева и значения токенов
не меняются. Импорт (`tokensToVariables`) читает `figmaType` только когда `$type` отсутствует,
поэтому новое поле на него не влияет.

## UI

### Русская локализация

- `src/app/i18n.ts` — zero-dep: английская строка = ключ, словарь `src/app/locales/ru.ts`, без перевода остаётся английский
- переключатель EN/RU в футере, выбор в `clientStorage` (`MultiTenantConfig.language`)
- новые поля конфига обязаны проходить через `normalizeConfig` в `storageConfig.ts`, иначе срезаются при сохранении

### Подсказки настроек (ⓘ)

- `src/app/components/Hint` — иконка ⓘ + пузырь; тексты из README (General settings / Show output / Push to server), RU/EN
- пузырь рендерится порталом в `document.body` (`position:fixed` + кламп к окну) — не клипается и не перекрывается строками
- проп `inline` для хинтов внутри Toggle-label (невидимый checkbox-`<input>` растянут на всю строку и крадёт hover)

### Фиксы

- окно плагина схлопывалось до заголовка после переключения языка (remount по key → ResizeObserver отдавал высоту 0 → `resizeUIHeight: 0`); ремаунт убран, нулевые высоты игнорируются
- `<meta charset="utf-8">` в шаблоне UI — кириллица вне iframe-дефолтов Figma

## Не тронуто

typography / grids / shadows / blur, import-режим (JSON → Figma), CLI-функциональность — работают как в upstream.


## Downstream

Style Dictionary: N сборок (по бренду), трансформы `gradient/css` и `gradient/rn` читают `$extensions['tokens-to-json'].gradient` — контракт и примеры в §7 брифа. Оба трансформа требуют `transitive: true`; `expand` для `gradient` не включать.
