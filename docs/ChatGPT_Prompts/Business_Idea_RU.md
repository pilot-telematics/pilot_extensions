# Prompt: PILOT Extension По Бизнес-Идее

Скопируйте текст ниже в AI и замените блоки в угловых скобках.

```text
Ты должен разработать PILOT Extension по бизнес-идее.

Репозиторий:
https://github.com/pilot-telematics/pilot_extensions

Перед генерацией кода прочитай:
1. AI_SPECS.md
2. docs/AI_EXTENSION_GUIDE.md
3. docs/PILOT_RUNTIME_UTILS_RU.md
4. docs/IDEA_TO_EXTENSION_RU.md
5. ближайший пример из examples/
6. docs/MapContainer_RU.md, если идея использует карту, центр карты, координаты, маркеры, маршруты, треки или геозоны

Бизнес-идея:
<что должно делать расширение>

Где функция должна появиться в PILOT:
<пусть AI выберет / новая вкладка / пункт контекстного меню Online / кнопка в header / пункт меню header / текущая карта / History / Reports / Vehicle Editor / settings>

Какие данные нужны:
<объекты, машины, история, отчеты, внешний API, ручные настройки>

Интерфейс:
<таблица, дерево, график Highcharts, карта, окно, dashboard>

Язык интерфейса:
<RU / EN / RU+EN>

Развертывание:
<Cloudflare Workers / GitHub Pages / VPS / пока просто структура файлов>

Обязательные правила:
- Extension не standalone web app.
- Никаких React/Vue/Vite/Webpack/npm, если я явно не попросил.
- Ext JS уже загружен PILOT.
- Не загружай Ext JS вручную.
- Используй Store.<extension>.* для своих классов.
- Можно использовать доступные host-классы Pilot.utils.*, например Pilot.utils.Toggle, Pilot.utils.LeftBarPanel, Pilot.utils.ColorField.
- Выбирай самый простой integration pattern, который решает бизнес-идею.
- Advanced Host Integration используй только если явно нужна интеграция с Reports, Vehicle Editor, History или settings.
- Runtime-логика только через Module.js.
- doc/index.html только документация, без <script>.
- Используй runtime PILOT: skeleton, mapContainer/historyMapContainer, l(...), window.uom, Highcharts/jQuery, renderers, если нужны и доступны.
- PILOT MapContainer - это обертка над Leaflet. Для функций карты используй docs/MapContainer_RU.md и не придумывай Google Maps-style API вроде getMap().getCenter().lat()/lng().
- Не подключай повторно Highcharts/jQuery/helper scripts, если они уже доступны.
- Если нужны свои CSS-цвета, используй палитру Tailwind CSS для hex-значений, но не подключай Tailwind CSS как framework без отдельной необходимости.
- Если добавляешь кнопку в header, используй `header_tool <extension>-header-btn` и CSS с заметным фоном и читаемым цветом текста/иконки. Не оставляй белую иконку/текст прямо на светло-сером header PILOT.
- Если развертывание Cloudflare и я явно не попросил developer CLI flow, дай manager-friendly инструкцию только через Cloudflare dashboard/browser UI. Не требуй npm, Node.js, Wrangler, Git, terminal или shell commands.
- Используй безопасное lowercase snake_case имя PILOT Extension, например weather_demo. Не используй дефисы в имени Extension в PILOT, потому что PILOT создает Store.<extension_name>.Module из этого имени.
- Класс в Module.js должен точно совпадать с именем Extension в PILOT: Ext.define('Store.weather_demo.Module', ...). Публичный Cloudflare/GitHub project URL при этом может быть с дефисами, например https://weather-demo.YOUR.pages.dev/.
- PILOT admin хранит внешний base URL, но runtime-файлы проксируются через /store/<extension>/ для CORS compatibility. Используй/опиши /store/<extension>/... для assets, docs, JSON и backend-запросов Extension. Сегмент <extension> - безопасное имя Extension в PILOT, например /store/weather_demo/Module.js.
- Не придумывай ссылку на скачивание. Приложи/создай настоящий zip-артефакт, если твоя среда поддерживает файлы; иначе честно скажи, что не можешь приложить файлы в этом чате.
- Не заменяй zip-артефакт Python/Node/PowerShell/Bash кодом, который я должен запускать локально для создания архива.

Результат должен включать:
1. выбранную архитектуру;
2. zip-архив с полной структурой файлов Extension;
3. дерево файлов внутри zip;
4. инструкцию куда положить файлы, с browser UI-first шагами для Cloudflare/GitHub;
5. прямой URL `/Module.js` для проверки в браузере;
6. безопасное имя PILOT Extension для admin, например weather_demo;
7. base URL для регистрации в PILOT admin, например https://weather-demo.YOUR.workers.dev/;
8. proxied runtime URLs, например /store/weather_demo/Module.js, /store/weather_demo/doc/index.html, /store/weather_demo/backend/;
9. пошаговую проверку запуска;
10. troubleshooting для 404, CORS, skeleton undefined, class not found, особенно Store.weather-demo.Module vs Store.weather_demo.Module.

Не печатай полный исходный код в чате по умолчанию. Сложи сгенерированные файлы в zip-архив.
Не давай локальный script для создания zip, если я явно не попросил developer workaround.
```
