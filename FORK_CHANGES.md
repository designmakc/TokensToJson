# Изменения форка (TokensToJson)

Форк [tokens-bruecke/figma-plugin](https://github.com/tokens-bruecke/figma-plugin) (база — v3.4.0, коммит `127b272`).
Цель: экспорт градиентов с геометрией и mode-механикой для мультибрендовой DS (web CSS + React Native), см. бриф `tokensbruecke-fork-brief.md`.

## Экспорт токенов

### Геометрия градиентов (GAP-1)

`src/common/transform/color/gradientGeometry.ts` — инверсия `gradientTransform` → handles + CSS-угол.
Гео пишется в `$extensions['io.github.designmakc.gradient']`, `$value` остаётся чистым DTCG (только стопы):

```json
"$extensions": {
  "io.github.designmakc.gradient": {
    "kind": "linear",
    "start": { "x": 0, "y": 0 },
    "end":   { "x": 1, "y": 1 },
    "cssAngle": 135,
    "figmaStyleId": "S:…"
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
- градиенты: `figmaStyleId` внутри `io.github.designmakc.gradient`

### Warn'ы при экспорте (§5.3 брифа)

В `colorStylesToTokens.ts`, только `console.warn`, экспорт не блокируют:

- стиль с несколькими paint'ами — экспортируется первый (GAP-2)
- стиль с неподдерживаемой комбинацией paint'ов — пропущен (раньше молча исчезал)
- hardcoded-стоп (без bound variable) в стилях `gradient/*`
- стоп с alpha=0 (платформы по-разному интерполируют прозрачность)
- асимметричный linear-градиент (midpoint handles вне центра ±0.01) — CSS `linear-gradient()` не выразит

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

Style Dictionary: N сборок (по бренду), трансформы `gradient/css` и `gradient/rn` читают `$extensions['io.github.designmakc.gradient']` — контракт и примеры в §7 брифа. Оба трансформа требуют `transitive: true`; `expand` для `gradient` не включать.
