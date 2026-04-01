
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

По умолчанию frontend проксирует API на `http://localhost:13000`.
Fallback target не включён по умолчанию, потому что на локальной машине порт `3000` часто уже занят другим сервисом, и в таком случае Vite может начать проксировать API не в backend.

Если нужен резервный backend target, его нужно задавать явно в `.env`:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:13000
VITE_API_PROXY_FALLBACK_TARGET=http://localhost:13001
```
