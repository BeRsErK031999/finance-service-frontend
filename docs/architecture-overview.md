
---

# `docs/architecture-overview.md`

```md
# Architecture Overview

## Назначение frontend

Frontend-приложение предоставляет интерфейс для управления финансовым планом проекта и связанными финансовыми движениями.

Система работает поверх уже реализованного backend finance service.

---

## Основные сущности UI

- `ProjectFinance`
- `SectionFinancePlan`
- `PlannedPayment`
- `PlannedCost`
- `ActualPayment`
- `ActualCost`

---

## Архитектурный стиль

Frontend использует layered feature-oriented structure:

```text
src/
  app/
  shared/
  entities/
  features/
  widgets/
  pages/