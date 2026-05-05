# От Бизнес-Идеи До Работающего Extension

Этот документ нужен для самого короткого пути: человек описывает бизнес-идею, AI генерирует код, а пользователь быстро размещает файлы и запускает Extension в PILOT.

## 1. Что Должен Сказать Пользователь AI

Минимально:

```text
Сделай PILOT Extension по этой бизнес-идее:
<описание идеи>

Используй репозиторий pilot-telematics/pilot_extensions.
Сначала прочитай AI_SPECS.md, docs/AI_EXTENSION_GUIDE.md и docs/PILOT_RUNTIME_UTILS_RU.md.
В результате дай zip-архив с полной структурой файлов Extension и пошаговую инструкцию куда их положить и какой Module.js URL зарегистрировать в PILOT.
```

Лучше дать больше контекста:

```text
Бизнес-идея:
<что должно делать расширение>

Где должна появиться функция:
- новая вкладка в левой навигации / пункт меню в Online / кнопка в header / работа с существующей картой

Данные:
- какие данные PILOT нужны
- нужен ли внешний API
- есть ли API key
- нужен ли backend/proxy

Интерфейс:
- таблица / дерево / график / карта / модальное окно / dashboard
- язык UI: русский / английский / оба

Развертывание:
- Cloudflare Workers / GitHub Pages / VPS / пока локальная папка
```

## 2. Как AI Должен Выбрать Архитектуру

| Идея | Вероятный паттерн |
|---|---|
| Нужен отдельный рабочий экран, dashboard, таблица, редактор | Full UI Extension |
| Действие по выбранной машине Online | Context Menu Extension |
| Показать маркеры/маршруты на текущей карте | Existing Map Interaction |
| Нужна отдельная карта в модуле | Custom Map Panel |
| Нужны секреты, CORS proxy, БД | Extension + backend |

AI должен выбрать самый простой паттерн, который закрывает задачу.

## 3. Что AI Должен Выдать

Ответ AI должен содержать:

1. Краткое описание выбранной архитектуры.
2. Zip-архив с полной структурой файлов Extension.
3. Дерево файлов внутри zip.
4. Подтверждение, что `Module.js` является единственной runtime-точкой входа.
5. Подтверждение, что `doc/index.html` не содержит `<script>`.
6. Пошаговое размещение файлов.
7. Итоговый URL `Module.js`, который нужно зарегистрировать в PILOT.
8. Проверочный чеклист.
9. Что делать, если не работает.

AI не должен печатать полный исходный код в чате по умолчанию. Сгенерированные файлы должны быть внутри zip-архива.

## 4. Типовая Структура Результата

Frontend-only:

```text
my-extension/
├── Module.js
├── style.css
└── doc/
    └── index.html
```

С backend:

```text
my-extension/
├── Module.js
├── style.css
├── doc/
│   └── index.html
└── backend/
    └── api.php
```

## 5. Куда Класть Файлы

Для быстрого теста нужен любой публичный static hosting.

## 5.1 Как Выбрать Hosting

| Нужно | Рекомендуемый hosting |
|---|---|
| Только `Module.js`, CSS, doc, публичные browser-friendly API | Cloudflare Workers static assets или GitHub Pages |
| Внешний API с CORS проблемами | Cloudflare Worker proxy |
| API key/secret нельзя показывать в браузере | Backend/proxy: Cloudflare Worker или VPS |
| PHP endpoints, база данных, файлы, логи | VPS/Nginx/PHP-FPM |
| Быстрый workshop/demo | Cloudflare Workers static assets |

Вариант Cloudflare Workers static assets:

```text
extension-upload/
├── Module.js
├── style.css
└── doc/
    └── index.html
```

После публикации должны открываться:

```text
https://YOUR-HOST/Module.js
https://YOUR-HOST/style.css
https://YOUR-HOST/doc/index.html
```

Вариант GitHub Pages:

```text
https://USERNAME.github.io/REPOSITORY/Module.js
```

Вариант VPS/Nginx:

```text
https://ext.example.com/my-extension/Module.js
```

Подробно см. [../DEPLOY.md](../DEPLOY.md).

## 6. Как Зарегистрировать В PILOT

1. Откройте прямой URL `Module.js` в браузере.
2. Убедитесь, что браузер показывает JavaScript-код, а не HTML-страницу ошибки.
3. В PILOT откройте админку приложений/Extensions.
4. Создайте новое приложение.
5. Укажите URL `Module.js`.
6. Сохраните и включите Extension для нужного договора/пользователя.
7. Подождите время применения настроек, если в вашей установке есть delay/proxy-cache.
8. Перезагрузите PILOT.

## 7. Проверка В Браузере

Проверьте DevTools:

- Network: `Module.js` загружается с HTTP 200.
- Console: нет ошибок `Ext.define`, `Ext.create`, missing class.
- Console: нет ошибки `skeleton is undefined`.
- Если есть CSS: CSS загружается с HTTP 200.
- Если есть свои CSS-цвета: по возможности используются значения из палитры Tailwind CSS, без подключения Tailwind по умолчанию.
- Если есть внешний API: нет CORS ошибок.
- Если есть backend: endpoint возвращает JSON, а не HTML/PHP warning.

## 8. Самые Частые Ошибки

| Симптом | Причина | Что сделать |
|---|---|---|
| `Module.js` 404 | Неправильно загружена папка | Откройте прямой URL и проверьте структуру hosting |
| Открывается HTML вместо JS | Указан URL сайта, а не `Module.js` | В PILOT нужно регистрировать прямой URL `Module.js` |
| `skeleton is undefined` | Код запущен вне PILOT | Проверять Extension нужно внутри PILOT, а не как standalone page |
| `Ext is undefined` | Extension сделали как отдельный сайт | Не загружайте вне PILOT, не делайте SPA |
| Класс не найден | Не загружен дополнительный JS-файл | В `Module.js` нужно загрузить файл через `Ext.Loader.loadScript` или держать код в одном файле |
| CORS error | Внешний API не разрешает browser-call | Нужен backend/proxy |
| Карта не найдена | Использована не та карта | Для Online: `getActiveTabMapContainer()` или `window.mapContainer`; для History: `window.historyMapContainer` |

## 9. Чеклист Для Быстрого Релиза

- [ ] `Module.js` доступен по прямому URL.
- [ ] `Module.js` содержит `Ext.define('Store.<name>.Module', ...)`.
- [ ] `initModule` является методом класса.
- [ ] Нет standalone HTML/React/Vue/Vite.
- [ ] Если есть вкладка, она добавляется в `skeleton.navigation`.
- [ ] Если есть main panel, она добавляется в `skeleton.mapframe`.
- [ ] Есть связь `navTab.map_frame = mainPanel`, если нужен paired UI.
- [ ] Если используется context menu, существующее меню расширяется, а не заменяется.
- [ ] `doc/index.html` не содержит `<script>`.
- [ ] AI дал понятную инструкцию публикации и URL регистрации.

## 10. Готовый Короткий Prompt

```text
Сделай PILOT Extension.

Бизнес-идея:
<описание>

Требования:
- используй pilot-telematics/pilot_extensions;
- соблюдай AI_SPECS.md;
- Extension должен работать внутри PILOT через Module.js;
- используй runtime-объекты PILOT: skeleton, mapContainer/historyMapContainer, l(...), window.uom, Highcharts/jQuery если нужны и доступны;
- не делай standalone web app;
- дай zip-архив с полной структурой файлов Extension вместо печати полного исходного кода в чате;
- дай пошаговую инструкцию: куда положить файлы, какой URL Module.js зарегистрировать в PILOT, как проверить запуск.
```
