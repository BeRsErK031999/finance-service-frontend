# AGENTS.md

Этот файл обязателен к прочтению перед любыми изменениями во frontend-проекте.

## 1. Общие правила

- Не менять архитектурный стиль проекта без необходимости.
- Не делать лишний рефакторинг без явного запроса.
- Не добавлять новые библиотеки без реальной необходимости.
- Не делать premature abstraction.
- Не строить сложные generic-решения раньше времени.
- Все изменения должны быть минимальными, целевыми и объяснимыми.
- Перед изменением нужно смотреть `README.md` и релевантные документы из `docs/`.

---

## 2. Архитектурный стиль

Проект использует frontend-структуру с разделением на:

- `app` — bootstrap, providers, router, theme
- `shared` — переиспользуемые API/config/lib/ui utilities
- `entities` — сущностные модули (типы, api, query hooks, мапперы)
- `features` — пользовательские сценарии и действия
- `widgets` — композиционные UI-блоки страниц
- `pages` — route-level страницы

### Запрещено

- Складывать всю бизнес-логику в `pages`
- Складывать все запросы в один giant `api.ts`
- Дублировать один и тот же API-код в нескольких местах
- Размещать сложную форму целиком внутри страницы, если она является отдельным пользовательским действием
- Переносить server-state в локальный state без необходимости

---

## 3. State management

Основной менеджер server-state:
- **TanStack Query**

### Использовать TanStack Query для:
- списков
- detail-запросов
- create/archive mutations
- invalidation после изменений

### Не использовать:
- Redux для server-state
- самодельные глобальные сторы для данных API, если TanStack Query достаточно

---

## 4. Формы

Формы строятся через:
- **React Hook Form**
- **Zod**
- `@hookform/resolvers/zod`

### Правила
- Валидация формы должна быть декларативной
- Условные поля должны зависеть от выбранного режима формы
- Не дублировать одну и ту же схему в нескольких местах без причины
- Ошибки API и ошибки формы должны быть разделены

### Запрещено
- Писать ручную валидацию в JSX без необходимости
- Размазывать form state по нескольким unrelated компонентам
- Пытаться повторить backend-доменные правила на фронте полностью

---

## 5. API integration

HTTP-клиент строится вокруг:
- `axios`
- shared `http-client`
- общего `parseApiError`

### Правила
- Все запросы к backend должны идти через shared API layer
- Не вызывать `fetch`/`axios` напрямую из pages/components, если это не специально оговорено
- Сначала API-функция, потом query hook, потом UI
- Контракты backend считаются source of truth

### Запрещено
- Жёстко хардкодить base URL
- Смешивать response parsing с UI rendering
- Игнорировать единый backend error shape `{ code, message, details? }`

---

## 6. UI rules

UI строится на:
- **MUI**
- shared UI wrappers
- понятных composition blocks

### Правила
- Общие визуальные паттерны должны жить в `shared/ui`
- Списки, таблицы и карточки должны быть консистентны
- Loading / Empty / Error states должны быть единообразны
- Archive actions должны быть понятны пользователю и не выглядеть как hard delete

### Запрещено
- Создавать свой дизайн-фреймворк без необходимости
- Делать тяжёлые reusable abstractions для 1-2 компонентов
- Использовать inline-хаос там, где нужен переиспользуемый UI wrapper

---

## 7. API contracts

Backend уже стабилизирован и имеет:
- list responses: `{ items: [...] }`
- detail responses: объект сущности
- error responses: `{ code, message, details? }`

Frontend должен придерживаться этих контрактов.

### Обязательно
- List pages должны работать с `items`
- Ошибки должны отображаться через единый parser
- Статусы (`PLANNED`, `EXPECTED`, `RECEIVED`, `ARCHIVED`) не должны вычисляться на фронте как source of truth

---

## 8. Planned / Actual movements

Сущности:
- `PlannedPayment`
- `PlannedCost`
- `ActualPayment`
- `ActualCost`

### Важные правила UI
- У `Planned*` есть два взаимоисключающих режима:
  - `DATE`
  - `EVENTS`
- Если выбран `DATE`, UI должен показывать дату и скрывать event selectors
- Если выбран `EVENTS`, UI должен показывать event selectors и скрывать дату
- `Actual*` создаются отдельно и переводят planned aggregate в `RECEIVED`
- Archive actual может вернуть planned aggregate в `EXPECTED` или `PLANNED`

### Запрещено
- Вычислять жизненный цикл planned/actual на фронте как основную бизнес-логику
- Упрощать `EVENTS` в “любое событие”; backend использует правило ALL selected events

---

## 9. Качество и проверки

Перед завершением задачи обязательно проверять:

```bash
yarn lint
yarn type-check
yarn build