# UI Rules

## Основной UI toolkit

Используется **MUI**.

---

## Общие правила

- Не строить отдельный дизайн-фреймворк без необходимости
- Использовать shared wrappers для повторяющихся состояний
- Списки и карточки должны быть визуально консистентны
- Archive action не должен визуально выглядеть как hard delete

---

## Shared UI building blocks

Полезно иметь:
- `PageContainer`
- `PageTitle`
- `SectionCard`
- `LoadingState`
- `EmptyState`
- `ErrorState`

---

## Detail pages

Detail page должен быть собран из widgets, а не из случайного набора компонентов.

---

## Status display

Статусы должны отображаться понятно:
- `PLANNED`
- `EXPECTED`
- `RECEIVED`
- `ARCHIVED`

Frontend может красить и стилизовать статусы, но не должен вычислять их как бизнес-истину.

---

## Empty states

Пустое состояние должно:
- объяснять, что данных пока нет
- подсказывать следующее действие, если это уместно

---

## Error states

Ошибка должна:
- быть понятной
- не ломать layout страницы
- по возможности давать retry