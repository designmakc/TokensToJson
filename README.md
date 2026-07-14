# TokensToJson

Figma-плагин для экспорта переменных и стилей в [DTCG](https://www.designtokens.org/tr/2025.10/format/)-токены (JSON), заточенный под мультибрендовые дизайн-системы с потребителями web (CSS) и React Native.

Форк [tokens-bruecke/figma-plugin](https://github.com/tokens-bruecke/figma-plugin) (MIT). Базовые возможности — экспорт variables по коллекциям и режимам, стили (typography / effects / grids / colors), push в GitHub / GitLab / JSONBin, форматы цвета, split-by-mode — описаны в [документации родительского проекта](https://github.com/tokens-bruecke/figma-plugin#readme) и работают как в upstream.

## Чем отличается от upstream

Полный список изменений с деталями — в [FORK_CHANGES.md](FORK_CHANGES.md).

### Градиенты с геометрией

Upstream экспортирует у градиентных стилей только стопы — linear и radial на выходе неразличимы, угол теряется. Форк пишет геометрию в `$extensions`, не ломая DTCG-совместимость `$value`:

```json
"gradient/action/primary": {
  "$type": "gradient",
  "$value": [
    { "color": "{color.gradient.action.primary.start}", "position": 0 },
    { "color": "{color.gradient.action.primary.end}",   "position": 1 }
  ],
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
}
```

- `start`/`end` — доли 0..1, кладутся 1-в-1 в React Native `LinearGradient`;
- `cssAngle` — готовый угол для CSS `linear-gradient()`;
- цвета стопов, забинженные на переменные, экспортируются алиасами — mode-механика брендов работает через них;
- warn'ы при экспорте: hardcoded-стоп в `gradient/*`, стоп с alpha=0, асимметричный градиент (CSS его не выразит), многослойный paint.

### Семантические категории токенов

Figma вынуждает ставить переменным `ALL_SCOPES` (иначе их не выбрать в стилях и эффектах), и этот шум уезжал в JSON. Теперь:

- `ALL_SCOPES` всегда вырезается из экспорта — это костыль пикеров Figma, а не семантика;
- роль токена определяется по сегментам имени через настраиваемый словарь (Advanced settings → Token categories) и пишется в `$extensions["tokens-to-json"].category`: `spacing`, `gradient`, `radius`, `opacity`…;
- опция **Refine token types**: generic FLOAT `dimension` уточняется до спекового типа по категории — `opacity/*` → `number`, `motion/*` → `duration` (`{ "value": 150, "unit": "ms" }`), `weight` → `fontWeight`. Точный Figma-scope всегда приоритетнее имени. За пределы закрытого набора типов DTCG 2025.10 плагин не выходит.

Фильтр для Style Dictionary:

```js
filter: (t) => t.$extensions?.['tokens-to-json']?.category === 'spacing'
```

### styleId для drift-check

`$extensions.styleId` у solid-цветов и `figmaStyleId` в геометрии градиентов — для CI-сверки «repo vs Figma».

### UI

- русская локализация (переключатель EN/RU в футере);
- подсказки ⓘ у всех настроек экспорта.

## Установка (development)

```bash
git clone https://github.com/designmakc/TokensToJson
cd TokensToJson
pnpm install
npm run build
```

Figma → Plugins → Development → **Import plugin from manifest…** → `dist/figma-plugin/manifest.json` (корневой `manifest.json` — исходник, не импортировать).

Тесты: `npx vitest run`.

## Downstream

Style Dictionary: по одной сборке на бренд (`source` = общий файл геометрии градиентов + цвета бренда из split-by-mode). Кастомные трансформы `gradient/css` и `gradient/rn` читают `$extensions['tokens-to-json'].gradient`; обоим нужен `transitive: true`, `expand` для `gradient`-токенов не включать.

## Лицензия

MIT, как у [родительского проекта](https://github.com/tokens-bruecke/figma-plugin). Спасибо [Pavel Laptev](https://github.com/PavelLaptev) за TokensBrücke.
