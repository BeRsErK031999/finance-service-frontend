# Forms Rules

## Стек форм

Формы строятся через:
- React Hook Form
- Zod
- @hookform/resolvers/zod

---

## Главные правила

- Форма должна иметь явную schema validation
- Ошибки формы и ошибки API должны быть разделены
- Conditional fields должны зависеть от mode/source, а не жить всегда одновременно
- Не держать form logic в page-level компоненте, если это отдельная feature

---

## Planned movements

`PlannedPayment` и `PlannedCost` имеют два взаимоисключающих режима:

- `DATE`
- `EVENTS`

### UI-правила
Если выбран `DATE`:
- показывать поле даты
- скрывать выбор событий

Если выбран `EVENTS`:
- скрывать поле даты
- показывать выбор project events / section events

### Нельзя
- Показывать оба режима как одновременно обязательные
- Упрощать правила backend

---

## Actual movements

`ActualPayment` и `ActualCost` — отдельные формы.

Обычно содержат:
- planned entity link
- amount
- actualDate
- comment

---

## Ошибки

Ошибки backend должны отображаться отдельно от field-level validation.
Например:
- field error
- form-level API error