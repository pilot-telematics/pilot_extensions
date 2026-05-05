# Карта Документации PILOT Extensions

Эта директория разделена по назначению: человеку нужно понять платформу и выбрать архитектуру, AI нужно получить строгий контракт и порядок действий.

Соглашение по именам файлов: английский язык используется по умолчанию и идет без суффикса, русские версии имеют суффикс `_RU`.

## Для Разработчиков

Читайте в таком порядке:

1. [IDEA_TO_EXTENSION_RU.md](IDEA_TO_EXTENSION_RU.md) - если есть бизнес-идея и нужно быстро получить рабочий Extension.
2. [IDEA_TO_EXTENSION.md](IDEA_TO_EXTENSION.md) - English default version.
3. [HUMAN_EXTENSION_GUIDE_RU.md](HUMAN_EXTENSION_GUIDE_RU.md) - практическое руководство по созданию расширений.
4. [HUMAN_EXTENSION_GUIDE.md](HUMAN_EXTENSION_GUIDE.md) - English default version.
5. [MapContainer_RU.md](MapContainer_RU.md) - работа с картой `MapContainer`.
6. [MarkerIconApi.md](MarkerIconApi.md) - SVG-иконки для маркеров.
7. [PILOT_RUNTIME_UTILS_RU.md](PILOT_RUNTIME_UTILS_RU.md) - какие встроенные runtime-объекты и утилиты PILOT можно использовать из Extensions.
8. [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md) - English default version.
9. [communal_RU.md](communal_RU.md) - подробный разбор сложного расширения `examples/communal`.
10. [../DEPLOY.md](../DEPLOY.md) - публикация `Module.js` на Cloudflare, GitHub Pages или VPS.

## Для AI

Перед генерацией кода AI должен прочитать:

1. [../AI_SPECS.md](../AI_SPECS.md) - строгий контракт, обязательный к соблюдению.
2. [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md) - порядок анализа бизнес-идеи и выбора паттерна.
3. [PILOT_RUNTIME_UTILS_RU.md](PILOT_RUNTIME_UTILS_RU.md) или [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md) - использовать только runtime-объекты и утилиты, доступные в скомпилированном PILOT app.js.
4. [IDEA_TO_EXTENSION_RU.md](IDEA_TO_EXTENSION_RU.md) или [IDEA_TO_EXTENSION.md](IDEA_TO_EXTENSION.md) - формат ожидаемого результата и инструкции запуска.
5. Один ближайший пример из `../examples/`.

Готовый prompt для передачи AI:

- [ChatGPT_Prompts/Business_Idea_RU.md](ChatGPT_Prompts/Business_Idea_RU.md)
- [ChatGPT_Prompts/Business_Idea.md](ChatGPT_Prompts/Business_Idea.md)

## Как Выбрать Пример

| Нужно сделать | Смотрите |
|---|---|
| Минимальная вкладка + основная панель | `examples/hello-world` |
| Шаблон нового UI-модуля | `examples/template-app` |
| Таблица/список + собственная карта | `examples/airports` |
| Простая data UI без карты | `examples/planets` |
| Пункт контекстного меню в Online + существующая карта | `examples/nearby-poi` |
| Сложный модуль с backend, авторизацией, CRUD и мнемосхемами | `examples/communal` |

## Ключевые Runtime-Объекты

- `window.skeleton` - главный контейнер PILOT UI.
- `window.skeleton.header` - header с кнопками и индикаторами.
- `window.skeleton.navigation` - левая навигация.
- `window.skeleton.navigation.online.online_tree` - дерево объектов Online.
- `window.skeleton.mapframe` - основной контейнер карт/панелей в примерах репозитория.
- `window.skeleton.map_frame` - то же смысловое место в некоторых описаниях runtime; при сомнении используйте fallback.
- `window.mapContainer` - карта Online.
- `window.historyMapContainer` - карта History.

Связь вкладки и основной панели:

```js
navTab.map_frame = mainPanel;
```

## Правило Разделения Документов

Документы для людей объясняют причины, варианты и порядок работы.

Документы для AI должны быть императивными: что можно, что нельзя, какие файлы создать, какие тесты пройти.
