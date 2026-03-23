# Руководство Разработчика По Модулю Communal

Этот документ описывает, как устроен модуль `communal`, как он интегрируется в PILOT, как организован его backend, и как использовать его как пример для создания собственных сложных расширений.

Сам модуль находится здесь:

- [examples/communal](D:/PhpstormProjects/pilot_extensions/examples/communal)

Документ сделан максимально практическим. Он концентрируется на архитектуре, разделении ответственности, потоках данных и тех паттернах, которые имеет смысл переиспользовать в своих модулях.

## 1. Что Это За Модуль

`communal` — это пример нетривиального расширения для PILOT, которое сочетает в себе:

- собственный UI внутри оболочки PILOT
- собственную авторизацию
- собственный backend и свою БД
- обращения к внешнему API
- использование нативной UI-инфраструктуры PILOT
- интеграцию с нативной картой PILOT
- собственный редактор и рендерер мнемосхем

То есть это не "одна панелька". Это полноценная небольшая подсистема, встроенная в PILOT.

## 2. Архитектура Верхнего Уровня

У модуля есть 4 основные части:

1. Frontend bootstrap и встраивание в PILOT
2. Бизнес-интерфейс на Ext JS
3. Собственный backend на PHP
4. Подсистема мнемосхем

Основные frontend-файлы:

- [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js)
- [Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)
- [Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js)
- [Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)
- [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)
- [Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)
- [Mnemo.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Mnemo.js)

Основные backend-файлы:

- [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php)
- [backend/auth_login.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/auth_login.php)
- [backend/session.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/session.php)
- [backend/tree.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/tree.php)
- [backend/node_types.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/node_types.php)
- [backend/mnemo.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/mnemo.php)

Основные файлы данных и схем:

- [install/create _db.sql](D:/PhpstormProjects/pilot_extensions/examples/communal/install/create%20_db.sql)
- [lang/lang.json](D:/PhpstormProjects/pilot_extensions/examples/communal/lang/lang.json)
- [store/mnemo_library.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library.json)

## 3. Как Модуль Встраивается В PILOT

Точка входа — [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js).

Что делает этот файл:

- загружает внешние JS-зависимости, нужные модулю
- загружает переводы из `lang/lang.json`
- создаёт вкладку в левой панели
- создаёт основную панель контента
- подключает CSS модуля

Ключевые точки интеграции с PILOT:

- `skeleton.navigation.add(...)`
  - добавляет модуль в левую панель навигации
- `skeleton.mapframe.add(...)`
  - добавляет основную рабочую область модуля в центральную часть интерфейса
- `lang[...]`
  - сливает переводы расширения в глобальный словарь переводов
- `base_url`
  - используется для построения URL расширения и внешних API относительно текущей установки PILOT

Это первый важный паттерн, который стоит переиспользовать в своём модуле:

- держать один маленький bootstrap-файл
- собирать UI только после загрузки зависимостей и переводов

## 4. Какие Нативные Возможности PILOT Используются

Расширение написано на Ext JS, но поверх него использует нативную инфраструктуру PILOT и его утилитарные компоненты.

Ключевые используемые части PILOT:

- `Pilot.utils.LeftBarPanel`
  - базовый класс для вкладки в левой панели
  - используется в [Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)
- `Pilot.utils.MapContainer`
  - обёртка над Leaflet и картографическими функциями
  - используется в [Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)
- `skeleton.navigation`
  - глобальный контейнер левой панели
- `skeleton.mapframe`
  - центральная рабочая область
- `skeleton.navigation.online.online_tree.store`
  - нативное дерево объектов PILOT, из которого модуль получает привязываемые объекты/агенты
- `pilot_confirm(...)`
  - нативный confirm-диалог
- `l(...)`
  - функция перевода
- `global_conf`
  - глобальная конфигурация, в том числе текущий `account_id`
- `dateTimeStr(...)`
  - helper форматирования даты и времени, если доступен

Если вы делаете свой модуль, по возможности используйте эти готовые возможности PILOT, а не создавайте рядом дублирующую инфраструктуру.

## 5. Как Собран Интерфейс

Видимый интерфейс собирается послойно.

### 5.1 Левая вкладка

[Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)

Ответственность:

- объявляет вкладку модуля в левом баре
- гарантирует, что авторизация выполнена до использования модуля
- создаёт панель дерева объектов

Эта вкладка наследуется от `Pilot.utils.LeftBarPanel`, поэтому ведёт себя как нативная секция боковой панели PILOT.

### 5.2 Основной layout рабочей области

[Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js)

Ответственность:

- собирает основную рабочую область через `border` layout
- создаёт:
  - центральную таблицу датчиков
  - правую панель с вкладками
  - вкладку `Information`
  - вкладку `Mnemo`

Этот файл намеренно тонкий. Он выступает как композиционный корень интерфейса.

### 5.3 Дерево объектов

[Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)

Ответственность:

- загружает и показывает иерархию собственных объектов из backend расширения
- позволяет создавать, редактировать и удалять эти объекты
- при выборе узла:
  - собирает все вложенные `agent_id`
  - даёт команду центральной таблице загрузить данные по этим агентам
  - даёт команду вкладке мнемосхем загрузить схемы для выбранного узла

Это главный источник текущего контекста выбора внутри модуля.

### 5.4 Центральная таблица датчиков

[Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)

Ответственность:

- вызывает `/api/v3/vehicles/status`
- нормализует payload API в плоский набор строк датчиков
- показывает сгруппированные строки датчиков
- поддерживает:
  - текстовый поиск
  - фильтр по тегам
  - фильтр "только проблемные"
- считает сводную статистику для правой панели
- передаёт нормализованные строки датчиков в:
  - `Information`
  - `Mnemo`

Этот файл является главным адаптером между сырым payload API и состоянием UI.

### 5.5 Вкладка Information

[Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)

Ответственность:

- показывает агрегированные счётчики:
  - total
  - active
  - not active
  - issues
- показывает в таблице только проблемные датчики
- содержит карту
- при клике по строке проблемного датчика ставит маркер на карте

Важная деталь реализации:

- `Pilot.utils.MapContainer` создаётся как Ext-компонент
- сам объект `MapContainer` лежит в `component.map`
- поэтому картой нужно управлять через `this.map.map`

Пример:

```js
this.map.map.addMarker(...);
this.map.map.setMapCenter(lat, lon);
```

Это важно. Ext-компонент и реальный map wrapper — не один и тот же объект.

### 5.6 Вкладка Mnemo

[Mnemo.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Mnemo.js)

Ответственность:

- загружает список схем для выбранного узла
- показывает селектор схем и CRUD-действия
- рендерит выбранную схему
- передаёт в рендерер живые данные датчиков
- открывает редактор схемы

Файлы поддержки подсистемы мнемосхем:

- [MnemoStorage.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoStorage.js)
- [MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)
- [view/MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

## 6. Модель Авторизации

Это расширение не использует авторизацию PILOT напрямую для своего backend. У него есть собственный auth-слой.

Точка входа авторизации на frontend:

- [Auth.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Auth.js)

Как это работает:

1. Модуль вызывает `Store.communal.Auth.ensure(accountId, ...)`
2. Если в `localStorage` нет токена, открывается окно логина
3. Если токен есть, backend проверяет сессию
4. При успехе:
   - токен переиспользуется
   - генерируется событие `communal-auth-ok`
5. При неуспехе:
   - токен удаляется
   - окно логина открывается снова

Где хранится токен:

- ключ формата `comm_token_<accountId>`
- хранение в `localStorage`

Backend endpoints, связанные с авторизацией:

- [backend/auth_login.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/auth_login.php)
- [backend/session.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/session.php)

Хороший паттерн для переиспользования:

- держать auth-логику в одном singleton
- наружу отдавать `getAuthHeaders()`
- использовать этот helper в store и AJAX-запросах
- уведомлять остальную UI-часть через глобальное событие

## 7. Структура Backend

Все PHP-скрипты backend подключают:

- [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php)

Этот bootstrap:

- загружает конфигурацию
- инициализирует DB helper-ы
- выставляет JSON-заголовки
- обрабатывает CORS
- извлекает bearer token
- валидирует текущую сессию

Это общая основа для всех backend endpoints расширения.

### 7.1 Backend дерева объектов

[backend/tree.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/tree.php)

Ответственность:

- отдаёт иерархические узлы для Ext tree
- поддерживает:
  - `read`
  - `create`
  - `update`
  - `destroy`
- обеспечивает изоляцию по аккаунту
- вычисляет:
  - рекурсивное количество потомков
  - список agent id всех вложенных узлов

Этот backend специально подстроен под контракт Ext tree/store, а не под "абстрактный REST".

Это полезный паттерн:

- форма ответа должна быть удобной для конкретного UI-компонента
- если это упрощает frontend, преобразование можно оставить на сервере

### 7.2 Backend типов узлов

[backend/node_types.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/node_types.php)

Ответственность:

- возвращает доступные типы объектов/узлов
- используется формой редактирования узла

### 7.3 Backend мнемосхем

[backend/mnemo.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/mnemo.php)

Ответственность:

- хранит несколько именованных мнемосхем на один узел
- поддерживает:
  - `list`
  - `read`
  - `save`
  - `delete`
- нормализует структуру схемы
- изолирует данные по аккаунту и узлу

Важный контракт данных:

- один узел дерева может иметь несколько схем
- каждая запись схемы содержит:
  - постоянный DB `id`
  - человекочитаемое `name`
  - `schema_json`

## 8. Модель Базы Данных

Основная схема БД описана в:

- [install/create _db.sql](D:/PhpstormProjects/pilot_extensions/examples/communal/install/create%20_db.sql)

Ключевые таблицы:

- `users`
  - пользователи расширения
- `sessions`
  - сессии авторизации расширения
- `tree_nodes`
  - иерархия бизнес-объектов, отображаемых в модуле
- `node_types`
  - доступные типы для `tree_nodes`
- `mnemo_schemes`
  - сохранённые схемы для узлов

Backend расширения изолирован по аккаунту. Почти во всех запросах участвует `account_id`.

Это хорошая практика, которую стоит повторять:

- данные должны быть явно scoped по аккаунту
- нельзя доверять account id из frontend как единственному источнику истины
- доступ должен определяться через валидированную bearer-сессию

## 9. API И Потоки Данных

В модуле есть 3 разных класса запросов.

### 9.1 Запросы к backend расширения

Примеры:

- `/store/communal/backend/tree.php`
- `/store/communal/backend/node_types.php`
- `/store/communal/backend/mnemo.php`
- `/store/communal/backend/session.php`

Назначение:

- авторизация
- конфигурационные данные модуля
- CRUD самого модуля
- сохранение мнемосхем

Эти запросы используют bearer token расширения.

### 9.2 Запросы к внешнему бизнес-API

Пример:

- `base_url + '../api/v3/vehicles/status'`

Используется в:

- [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)

Назначение:

- загружать статусы датчиков/объектов
- получать значения датчиков, timestamps, issues и координаты

Потом эти данные один раз нормализуются и переиспользуются сразу в нескольких частях интерфейса.

Это важный паттерн:

- нормализовать payload в одном месте
- затем раздавать нормализованные строки в другие панели
- не заставлять каждую панель заново парсить сырой API-ответ

### 9.3 Доступ к нативным данным PILOT

Пример:

- `skeleton.navigation.online.online_tree.store`

Используется в:

- [Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)

Назначение:

- собрать нативные объекты/агенты PILOT
- показать их в форме привязки узла

Так модуль связывает собственное дерево объектов со штатными объектами PILOT.

## 10. Подсистема Мнемосхем

Подсистема мнемосхем — это фактически отдельное маленькое приложение внутри модуля.

### 10.1 Хранение

[MnemoStorage.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoStorage.js)

Ответственность:

- загрузка списка схем
- сохранение схемы
- удаление схемы
- нормализация структуры схемы
- обеспечение уникальных integer id элементов внутри одной схемы

Element ids здесь намеренно сделаны простыми:

- integer
- уникальны только внутри одной схемы
- новый id вычисляется как `max(existing ids) + 1`

Это осознанный KISS-подход.

### 10.2 Рендеринг

[MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)

Ответственность:

- рендерить схему в SVG
- обновлять текстовые и value-элементы живыми данными датчиков
- рендерить preview для редактора
- поддерживать выделение и интерактивность

Текущие активные runtime-типы элементов:

- `symbol`
- `label`
- `value`
- `sensor`

### 10.3 Редактирование

[view/MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

Ответственность:

- визуально редактировать схему
- добавлять элементы из библиотеки
- редактировать свойства оформления
- дублировать, удалять и менять порядок элементов
- сохранять схему с именем

### 10.4 Библиотека элементов

Файлы:

- [store/mnemo_library.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library.json)
- [store/mnemo_library/core.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/core.json)
- [store/mnemo_library/hvac.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/hvac.json)
- [store/mnemo_library/electrical.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/electrical.json)

Библиотека сделана декларативной:

- groups
- items
- primitives

Это значит, что добавление новых символов — в основном задача данных, а не задача переписывания JS-кода.

Подробный формат библиотеки отдельно описан в:

- [examples/communal/doc/mnemo_library.md](D:/PhpstormProjects/pilot_extensions/examples/communal/doc/mnemo_library.md)

## 11. Локализация

Переводы лежат в:

- [lang/lang.json](D:/PhpstormProjects/pilot_extensions/examples/communal/lang/lang.json)

Принцип:

- исходные строки в коде должны быть английскими
- runtime UI использует `l('...')`
- русские переводы подтягиваются из `lang.json`

Пример:

```js
fieldLabel: l('Name')
```

Если вы делаете свой модуль:

- держите ключи стабильными
- не встраивайте русский текст прямо в JS
- загружайте переводы до создания UI

## 12. Почему Этот Модуль Полезен Как Эталон

Этот модуль показывает, как строить расширение, которое заметно сложнее одной простой панели:

- собственная авторизация
- собственный backend
- account-scoped бизнес-данные
- собственный CRUD дерева
- потребление внешнего API
- интеграция с native PILOT
- работа с картой
- визуальный редактор
- сохранение пользовательских схем

Поэтому это хороший шаблон для:

- мониторинговых модулей
- вертикальных бизнес-модулей
- GIS-насыщенных расширений
- кастомных dashboard-решений
- отраслевых операторских интерфейсов

## 13. Рекомендуемый Подход Для Создания Похожего Модуля

Если вы хотите сделать модуль примерно такой же сложности, хороший порядок работы будет таким.

### Шаг 1. Сделайте bootstrap минимальным

Создайте один входной файл модуля вроде [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js), который только:

- загружает скрипты
- загружает переводы
- создаёт вкладку
- создаёт основную рабочую область
- подключает CSS

### Шаг 2. Разделите композицию и бизнес-логику

Используйте тонкий композиционный контейнер вроде [Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js), а бизнес-логику держите в дочерних панелях.

### Шаг 3. Централизуйте авторизацию

Используйте один auth singleton вроде [Auth.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Auth.js).

Не размазывайте bearer-token логику по всем файлам.

### Шаг 4. Сделайте маленькое backend-ядро

Используйте один общий bootstrap вроде [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php) для:

- конфигурации
- DB-подключения
- JSON-ответов
- CORS
- валидации bearer token

### Шаг 5. Нормализуйте внешний API один раз

Именно это делает [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js).

Не позволяйте каждой панели самостоятельно переосмысливать сырой payload.

### Шаг 6. Переиспользуйте нативные возможности PILOT

Перед тем как писать свой слой инфраструктуры, проверьте, не даёт ли PILOT уже готовые:

- контейнеры боковой панели
- карты
- диалоги
- деревья
- переводы
- глобальные skeleton-контейнеры

### Шаг 7. Для визуальных каталогов предпочитайте data-driven подход

Библиотека элементов мнемосхем в этом модуле JSON-driven.

Это гораздо проще масштабировать, чем жёстко кодировать каждый визуальный элемент в JS.

## 14. Практические Предупреждения

### 14.1 Различайте Ext-компоненты и обёрнутые нативные объекты

Пример:

- `this.map` может быть Ext-компонентом
- `this.map.map` может быть реальным `MapContainer`

Это критично, когда вы вызываете map methods.

### 14.2 Держите runtime-контракты простыми

Хорошие примеры в этом модуле:

- integer id элементов внутри одной схемы
- один auth singleton
- один шаг нормализации строк датчиков
- один backend bootstrap

### 14.3 Всегда явно учитывайте изоляцию по аккаунту

Backend должен фильтровать данные по аккаунту, полученному из валидной сессии.

### 14.4 Не смешивайте форматы хранения

Редактор мнемосхем хранит схемы в БД, а не в браузерном временном storage.

Для совместно используемых операторских инструментов это правильный выбор.

## 15. Рекомендуемый Порядок Чтения

Если вы впервые заходите в этот модуль, читайте файлы в таком порядке:

1. [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js)
2. [Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)
3. [Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js)
4. [Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)
5. [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)
6. [Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)
7. [Auth.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Auth.js)
8. [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php)
9. [backend/tree.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/tree.php)
10. [Mnemo.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Mnemo.js)
11. [MnemoStorage.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoStorage.js)
12. [MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)
13. [view/MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

## 16. Главный Вывод

Главный урок из `communal` такой:

Внутри PILOT можно строить сложные предметные подсистемы без конфликта с host platform, если чётко разделять роли:

- PILOT отвечает за оболочку, контейнеры, карты, диалоги и объектный контекст
- backend расширения отвечает за бизнес-логику и хранение
- внешний API отвечает за живые доменные данные
- frontend-панели выступают адаптерами между данными и представлением

Именно такое разделение делает модуль масштабируемым и поддерживаемым.
