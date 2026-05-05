# PILOT Extensions

Репозиторий с примерами, документацией и AI-контрактами для разработки расширений PILOT.

Главная цель репозитория: дать человеку или AI достаточно контекста, чтобы по бизнес-идее быстро собрать рабочее расширение PILOT без типовых ошибок: без отдельного SPA, без ручной загрузки Ext JS, без моков `skeleton`, с правильным встраиванием в существующий интерфейс PILOT.

## Быстрый Старт Для Людей

1. Если у вас есть только бизнес-идея, начните с [docs/IDEA_TO_EXTENSION_RU.md](docs/IDEA_TO_EXTENSION_RU.md).
2. Прочитайте [карту документации](docs/README_RU.md).
3. Пройдите [руководство разработчика](docs/HUMAN_EXTENSION_GUIDE_RU.md).
4. Выберите ближайший пример:
   - [examples/hello-world](examples/hello-world) - минимальное расширение с вкладкой и панелью.
   - [examples/nearby-poi](examples/nearby-poi) - пункт контекстного меню в Online и работа с существующей картой.
   - [examples/airports](examples/airports) - список объектов и собственная карта.
   - [examples/communal](examples/communal) - сложный модуль с backend, авторизацией и мнемосхемами.
5. Разместите файлы расширения на сервере и зарегистрируйте URL `Module.js` в PILOT.

## Быстрый Старт Для AI

Если вы хотите попросить AI сделать расширение по бизнес-идее:

1. Дайте AI ссылку на этот репозиторий.
2. Попросите прочитать в таком порядке:
   - [AI_SPECS.md](AI_SPECS.md)
   - [docs/AI_EXTENSION_GUIDE.md](docs/AI_EXTENSION_GUIDE.md)
   - [docs/PILOT_RUNTIME_UTILS_RU.md](docs/PILOT_RUNTIME_UTILS_RU.md)
   - подходящий пример из `examples/`
3. Используйте готовый шаблон запроса:
   - [docs/ChatGPT_Prompts/Business_Idea_RU.md](docs/ChatGPT_Prompts/Business_Idea_RU.md)
   - [docs/ChatGPT_Prompts/Business_Idea.md](docs/ChatGPT_Prompts/Business_Idea.md)

Минимальная формулировка:

```text
Используй репозиторий pilot-telematics/pilot_extensions.
Сначала прочитай AI_SPECS.md и docs/AI_EXTENSION_GUIDE.md.
Сделай PILOT Extension по бизнес-идее ниже.
Не создавай standalone web app. Расширение должно запускаться через Module.js внутри PILOT.
```

## Runtime PILOT, Который Должен Знать Разработчик

Расширения запускаются внутри уже загруженного PILOT UI.

Ключевые глобальные объекты:

- `window.skeleton` - главный контейнер интерфейса.
- `window.skeleton.header` - верхний header.
- `window.skeleton.navigation` - левая навигация.
- `window.skeleton.mapframe` - основной контейнер карт/панелей в существующих примерах.
- `window.skeleton.map_frame` - имя того же смыслового контейнера в некоторых описаниях runtime; перед использованием проверяйте фактическую сборку.
- `window.mapContainer` - карта раздела Online.
- `window.historyMapContainer` - карта раздела History.
- `window.Highcharts` - графики, если доступны в текущей сборке PILOT.
- `window.jQuery` / `window.$` - jQuery, если доступен в текущей сборке PILOT.
- `window.uom` - единицы измерения текущего пользователя, если доступны.

Связь между вкладкой навигации и основной панелью обычно хранится в свойстве компонента:

```js
navTab.map_frame = mainPanel;
```

## Структура Репозитория

```text
pilot_extensions/
├── AI_SPECS.md                 # строгий контракт для AI-generated code
├── AI_SPECS_SHORT.md           # короткая версия контракта
├── DEPLOY.md                   # варианты хостинга и публикации
├── README.md                   # English overview
├── README_RU.md                # этот файл
├── docs/
│   ├── README.md               # documentation map in English
│   ├── README_RU.md            # карта документации
│   ├── IDEA_TO_EXTENSION.md
│   ├── IDEA_TO_EXTENSION_RU.md
│   ├── HUMAN_EXTENSION_GUIDE.md
│   ├── HUMAN_EXTENSION_GUIDE_RU.md
│   ├── AI_EXTENSION_GUIDE.md
│   ├── PILOT_RUNTIME_UTILS.md
│   ├── PILOT_RUNTIME_UTILS_RU.md
│   ├── MapContainer.md
│   ├── MapContainer_RU.md
│   ├── MarkerIconApi.md
│   └── ChatGPT_Prompts/
└── examples/
    ├── hello-world/
    ├── nearby-poi/
    ├── airports/
    ├── planets/
    ├── template-app/
    └── communal/
```

## Минимальная Структура Расширения

```text
my-extension/
├── Module.js
├── doc/
│   └── index.html
├── style.css       # опционально
└── backend/        # опционально, если нужен PHP/backend
```

`Module.js` - единственная точка входа runtime-логики.

`doc/index.html` - только документация расширения. В нем не должно быть `<script>` и логики запуска.

## Полезные Документы

- [AI_SPECS.md](AI_SPECS.md) - обязательные правила для AI.
- [docs/IDEA_TO_EXTENSION.md](docs/IDEA_TO_EXTENSION.md) - English version.
- [docs/IDEA_TO_EXTENSION_RU.md](docs/IDEA_TO_EXTENSION_RU.md) - путь от бизнес-идеи до работающего Extension.
- [docs/AI_EXTENSION_GUIDE.md](docs/AI_EXTENSION_GUIDE.md) - как AI должен читать репозиторий и проектировать расширение.
- [docs/HUMAN_EXTENSION_GUIDE.md](docs/HUMAN_EXTENSION_GUIDE.md) - English developer guide.
- [docs/HUMAN_EXTENSION_GUIDE_RU.md](docs/HUMAN_EXTENSION_GUIDE_RU.md) - практическое руководство для разработчиков.
- [docs/PILOT_RUNTIME_UTILS.md](docs/PILOT_RUNTIME_UTILS.md) - English guide to built-in PILOT runtime objects and utilities.
- [docs/PILOT_RUNTIME_UTILS_RU.md](docs/PILOT_RUNTIME_UTILS_RU.md) - встроенные runtime-объекты и утилиты PILOT, доступные Extensions.
- [DEPLOY.md](DEPLOY.md) - Cloudflare Workers, GitHub Pages, AWS EC2/Nginx/PHP-FPM.
- [docs/MapContainer_RU.md](docs/MapContainer_RU.md) - работа с картой.
- [docs/MarkerIconApi.md](docs/MarkerIconApi.md) - генерация SVG-иконок маркеров.
- [docs/communal_RU.md](docs/communal_RU.md) - разбор сложного модуля `communal`.

## Лицензия

Apache License. См. [LICENSE](LICENSE).
