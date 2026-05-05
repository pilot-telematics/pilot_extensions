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

Бизнес-идея:
<что должно делать расширение>

Где функция должна появиться в PILOT:
<новая вкладка / пункт контекстного меню Online / кнопка в header / текущая карта / History / Reports>

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
- Runtime-логика только через Module.js.
- doc/index.html только документация, без <script>.
- Используй runtime PILOT: skeleton, mapContainer/historyMapContainer, l(...), window.uom, Highcharts/jQuery, renderers, если нужны и доступны.
- Не подключай повторно Highcharts/jQuery/helper scripts, если они уже доступны.
- Если нужны свои CSS-цвета, используй палитру Tailwind CSS для hex-значений, но не подключай Tailwind CSS как framework без отдельной необходимости.

Результат должен включать:
1. выбранную архитектуру;
2. zip-архив с полной структурой файлов Extension;
3. дерево файлов внутри zip;
4. инструкцию куда положить файлы;
5. итоговый URL Module.js для регистрации в PILOT;
6. пошаговую проверку запуска;
7. troubleshooting для 404, CORS, skeleton undefined, class not found.

Не печатай полный исходный код в чате по умолчанию. Сложи сгенерированные файлы в zip-архив.
```
