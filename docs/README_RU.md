# Документация PILOT Extensions

Эта папка организована вокруг одной цели: превратить бизнес-идею в рабочий zip-архив PILOT Extension с минимальным количеством runtime-ошибок.

Английские файлы идут без суффикса. Русские версии имеют суффикс `_RU`.

## Быстрый Путь

Для менеджера, который использует AI-помощника:

1. Откройте [ChatGPT_Prompts/Business_Idea_RU.md](ChatGPT_Prompts/Business_Idea_RU.md).
2. Вставьте prompt в AI-помощника.
3. Добавьте бизнес-идею и ссылку на этот репозиторий.
4. Попросите zip-архив с полной структурой файлов Extension.
5. Зарегистрируйте итоговый URL `Module.js` в PILOT.

Для разработчика:

1. Начните с [IDEA_TO_EXTENSION_RU.md](IDEA_TO_EXTENSION_RU.md).
2. Прочитайте [HUMAN_EXTENSION_GUIDE_RU.md](HUMAN_EXTENSION_GUIDE_RU.md).
3. Используйте [PILOT_RUNTIME_UTILS_RU.md](PILOT_RUNTIME_UTILS_RU.md) для host-объектов, `Pilot.utils.*`, Highcharts, jQuery, UOM и renderers.
4. Для публикации используйте [../DEPLOY.md](../DEPLOY.md).

Для AI coding agent:

1. Прочитать [../AI_SPECS.md](../AI_SPECS.md).
2. Прочитать [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md).
3. Прочитать [PILOT_RUNTIME_UTILS_RU.md](PILOT_RUNTIME_UTILS_RU.md) или [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md).
4. Посмотреть один ближайший пример из `../examples/`.
5. Вернуть zip-архив, а не полный исходный код в чате.

## Архитектурные Паттерны

| Нужно сделать | Паттерн | Пример |
|---|---|---|
| Минимальная вкладка + основная панель | Full UI Extension | `examples/hello-world` |
| Стартовая структура модуля | Full UI Extension | `examples/template-app` |
| Таблица/список + собственная карта | Custom Map Panel | `examples/airports` |
| UI с данными без карты | Full UI Extension | `examples/planets` |
| Действие по выбранному объекту Online | Context Menu Extension | `examples/nearby-poi` |
| Backend, auth, CRUD, мнемосхемы | Extension + backend | `examples/communal` |
| Глобальное действие | Header Button / Header Menu Item | см. [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md) |
| Reports/settings/editor integration | Advanced Host Integration | см. [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md) |

## Справочники

- [MapContainer_RU.md](MapContainer_RU.md) - работа с картой.
- [MarkerIconApi.md](MarkerIconApi.md) - SVG-иконки маркеров.
- [communal_RU.md](communal_RU.md) - разбор сложного Extension.
- [ChatGPT_Prompts/Business_Idea.md](ChatGPT_Prompts/Business_Idea.md) - английский prompt-шаблон.
