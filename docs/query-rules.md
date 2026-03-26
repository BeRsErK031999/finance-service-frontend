# Query Rules

## Основной инструмент

Используется **TanStack Query**.

---

## Что хранить в query

- списки сущностей
- detail data
- server-driven состояния
- mutation lifecycle
- refetch/invalidation

---

## Что не хранить в query

- локальный UI toggle state
- состояние модалок
- временные input values форм

---

## Query key strategy

Для каждой сущности использовать понятные key factories.

Примерный стиль:

- `projectFinanceKeys.all()`
- `projectFinanceKeys.list(filters)`
- `projectFinanceKeys.detail(id)`

- `sectionFinancePlanKeys.list(projectFinanceId)`
- `plannedPaymentKeys.list(projectFinanceId)`
- `plannedCostKeys.list(projectFinanceId)`
- `actualPaymentKeys.list(projectFinanceId)`
- `actualCostKeys.list(projectFinanceId)`

---

## Mutation rules

После create/archive:
- инвалидировать relevant lists
- при необходимости инвалидировать detail queries

---

## Loading / Empty / Error states

Для всех query-driven экранов нужно явно обрабатывать:
- loading
- empty
- error
- success