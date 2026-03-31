
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

## Локальный backend для frontend dev

По умолчанию frontend сначала пытается проксировать API на `http://localhost:13000`.
Если backend в dev поднят локально без `.env` и слушает стандартный порт `3000`, Vite автоматически переключится на `http://localhost:3000`.

При необходимости можно явно переопределить адреса в `.env`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:13000
VITE_API_PROXY_FALLBACK_TARGET=http://localhost:3000
```
