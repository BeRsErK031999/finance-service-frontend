
---

# `docs/api-integration-rules.md`

```md
# API Integration Rules

## Backend contract

Frontend работает с backend finance service.

Основные правила:
- list endpoints возвращают `{ items: [...] }`
- detail endpoints возвращают объект сущности
- error endpoints возвращают `{ code, message, details? }`

---

## API layer

Все HTTP-вызовы должны идти через shared API layer.

### Разрешено
- `shared/api/http-client.ts`
- сущностные API-функции в `entities/<entity>/api/*`

### Запрещено
- прямой `axios` в pages
- прямой `fetch` в widgets/features без API слоя
- дублирование одинаковых endpoint calls

---

## Ошибки

Ошибки backend нужно разбирать через единый parser.

### Нужно учитывать
- 404
- 409
- 422
- optimistic concurrency conflicts

Frontend не должен полагаться только на `message`; код ошибки тоже важен.

---

## OpenAPI / Swagger

Backend предоставляет:
- `/docs`
- `/openapi.json`

Если типы или API layer позже будут генерироваться из OpenAPI, это должно делаться централизованно, а не точечно в случайных местах.

---

## Query keys

Для каждой сущности нужно поддерживать консистентный набор query keys:
- all
- list(filters)
- detail(id)

---

## Mutation invalidation

После успешных create/archive mutations нужно корректно инвалидировать связанные query caches.