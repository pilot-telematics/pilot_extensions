# Документация расширений PILOT

## Первое расширение

Если вы ещё не создавали расширения, начните с [пошагового руководства](IDEA_TO_EXTENSION_RU.md). Оно ведёт от простого Hello World до включения расширения в PILOT.

Порядок действий:

1. Попросите AI создать минимальное расширение «Привет, PILOT!».
2. Выберите Cloudflare Pages Direct Upload для загрузки ZIP или папки через браузер либо GitHub Pages для публикации из репозитория. Cloudflare Pages выдаёт адрес с доменом `pages.dev`.
3. Проверьте, что файл `Module.js` открывается по публичному URL.
4. Зарегистрируйте базовый URL в панели Администратора.
5. Разрешите доступ своему аккаунту и включите расширение в PILOT.

[Руководство по регистрации](REGISTER_EXTENSION_RU.md) описывает поля и вкладки панели Администратора.

## Развивайте расширение по шагам

| Цель | Документ или пример |
|---|---|
| Понять структуру и запуск кода | [Hello World](../examples/hello_world/Module.js) |
| Добавить команду для объекта Online | [nearby_poi](../examples/nearby_poi/Module.js) |
| Показать список и карту | [airports](../examples/airports/Module.js) и [MapContainer](MapContainer_RU.md) |
| Читать глобальные настройки и настройки аккаунта | [API настроек runtime](PILOT_RUNTIME_UTILS_RU.md#api-настроек-расширения) |
| Выбрать стабильный API PILOT | [Совместимость API](PILOT_API_COMPATIBILITY_RU.md) |
| Добавить backend, авторизацию или секреты | [Размещение](../DEPLOY.md) и [пример communal](communal_RU.md) |

Добавляйте одну возможность за раз. Не начинайте с карты, backend или секретов, если задача требует только простой экран.

## Справочники

- [Руководство разработчика](HUMAN_EXTENSION_GUIDE_RU.md)
- [Контракт кода для AI](../AI_SPECS.md)
- [Руководство по шаблонам интеграции](AI_EXTENSION_GUIDE.md)
- [Runtime-объекты и утилиты PILOT](PILOT_RUNTIME_UTILS_RU.md)
- [Совместимость API и границы поддержки](PILOT_API_COMPATIBILITY_RU.md)
- [MapContainer и карты](MapContainer_RU.md)
- [Размещение и хостинг](../DEPLOY.md)
- [Подробный разбор communal](communal_RU.md)
