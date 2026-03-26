
---

# `README.md`

```md
# Finance Service Frontend

Frontend-приложение для работы с финансовым сервисом TrueBIM.

Приложение использует backend с уже готовым HTTP API, OpenAPI/Swagger и стабилизированными контрактами.  
Основная задача frontend — предоставить интерфейс для работы с:

- `ProjectFinance`
- `SectionFinancePlan`
- `PlannedPayment`
- `PlannedCost`
- `ActualPayment`
- `ActualCost`

---

## Стек

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- MUI
- Axios

---

## Архитектура проекта

```text
src/
  app/
  shared/
  entities/
  features/
  widgets/
  pages/