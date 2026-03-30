# Developer Page Guide

## Назначение документа

Эта методичка описывает, как во frontend-проекте собраны страницы финансового модуля, как устроено их оформление, где лежит логика блоков, где менять формы добавления и редактирования, и какие файлы отвечают за каждый слой.

Документ полезен, если нужно:

- понять, из каких блоков состоит UI;
- быстро найти файл для изменения конкретного раздела;
- не смешивать page-level, widget-level и feature-level логику;
- не сломать текущий паттерн оформления экранов.

---

## 1. Общая схема сборки страниц

Проект собран по FSD-подобной схеме:

- `app` отвечает за bootstrap, роутинг, providers, theme;
- `shared` хранит общие UI-обёртки, API-инфраструктуру, форматтеры, access-логику;
- `entities` хранит типы сущностей, API-функции и query hooks;
- `features` хранит формы создания, редактирования, смены статуса;
- `widgets` собирают крупные UI-блоки detail-страниц;
- `pages` собирают route-level страницы из готовых виджетов.

Ключевое правило проекта: страницы не содержат тяжёлую бизнес-логику. Они только композируют состояние и виджеты.

---

## 2. Роуты и верхний каркас приложения

### Основные маршруты

- `/project-finances` — список финансовых планов;
- `/project-finances/create` — создание финансового плана;
- `/project-finances/:id` — detail-страница финансового плана.

### Где это настраивается

- `src/app/router/router.tsx` — вся карта роутов;
- `src/widgets/app-shell/AppShell.tsx` — общий layout приложения.

### Как выглядит общий layout

`AppShell` даёт единый каркас:

- sticky `AppBar` сверху;
- название продукта и кнопку перехода к списку планов;
- переключатель demo-пользователя;
- `Outlet` для route content;
- footer с адресом API.

Это означает, что все страницы внутри финансового модуля визуально живут в единой оболочке и не дублируют шапку/подвал.

---

## 3. Базовые правила оформления страниц

### Theme

Глобальная тема задаётся в `src/app/theme/theme.ts`.

Основные визуальные токены:

- `primary.main = #145da0`;
- `background.default = #f5f7fb`;
- карточки имеют мягкую тень;
- `Container` по умолчанию ограничен `maxWidth="lg"`;
- базовый скруглённый радиус `14px`;
- типографика строится на `Segoe UI` / `Helvetica Neue`.

### Общие UI-обёртки

Основной паттерн страницы:

1. `PageContainer`
2. `PageTitle`
3. один или несколько `SectionCard` или вложенных `Paper`

Файлы:

- `src/shared/ui/PageContainer.tsx`
- `src/shared/ui/PageTitle.tsx`
- `src/shared/ui/SectionCard.tsx`

### Состояния запроса

Для query-driven экранов используется единый набор состояний:

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `AccessNotice`

Файлы:

- `src/shared/ui/LoadingState.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/ErrorState.tsx`
- `src/shared/ui/AccessNotice.tsx`

### Статусы и архивирование

- визуализация статусов идёт через `FinanceStatusChip`;
- action архивирования оформлен через `ArchiveActionButton`.

Файлы:

- `src/shared/ui/FinanceStatusChip.tsx`
- `src/shared/ui/ArchiveActionButton.tsx`

---

## 4. Страница списка финансовых планов

### Что это за экран

Страница `/project-finances` показывает список доступных `ProjectFinance`.

Главный файл:

- `src/pages/project-finances/ProjectFinancesPage.tsx`

### Как она оформлена

Структура страницы:

1. `PageContainer`
2. `PageTitle`
3. проверки доступа
4. loading / error / empty states
5. `SectionCard` со списком планов

### Что показывается в карточке списка

Каждый элемент списка показывает:

- название финансового плана;
- внешний ID проекта;
- статус;
- дату обновления;
- описание.

### Как работает кнопка создания

Кнопка `Создать финансовый план` показывается только если `financeCapabilities.canCreateProjectFinance === true`.

Доступ рассчитывается в:

- `src/shared/access/finance-capabilities.ts`
- `src/entities/project-finance/api/project-finance.query.ts`

---

## 5. Страница создания финансового плана

### Главный файл страницы

- `src/pages/project-finance-create/ProjectFinanceCreatePage.tsx`

### Что делает страница

Страница:

- проверяет глобальные права;
- показывает `CreateProjectFinanceForm`, если создание разрешено;
- иначе показывает `EmptyState` с объяснением причины.

### Как выглядит форма

Форма собрана внутри `SectionCard` с заголовком "Основная информация".

Поля:

- `externalProjectId`
- `name`
- `description`

Файлы:

- `src/features/project-finance/create-project-finance/ui/CreateProjectFinanceForm.tsx`
- `src/features/project-finance/create-project-finance/model/schema.ts`

### Что важно по логике

- после успешного создания пользователь перенаправляется на detail-страницу нового плана;
- серверные ошибки раскладываются по полям и в form-level alert;
- данные валидируются через RHF + Zod.

---

## 6. Detail-страница финансового плана

### Главный файл

- `src/pages/project-finance-details/ProjectFinanceDetailsPage.tsx`

### Из чего состоит detail-страница

После загрузки и проверки доступа detail-экран собирается так:

1. блок "Общая информация";
2. блок "Итоги по проекту";
3. блок "Участники";
4. блок "Финансы по разделам".

Это главная композиция всего модуля.

---

## 7. Блок "Общая информация"

### Где лежит

Блок собран прямо внутри:

- `src/pages/project-finance-details/ProjectFinanceDetailsPage.tsx`

### Как он выглядит

Это `SectionCard` с action-кнопкой `Редактировать`.

Внутри через `Stack` и `Divider` показываются:

- название;
- внешний ID проекта;
- описание;
- состояние;
- версия;
- дата создания;
- дата обновления;
- дата архивирования;
- дата удаления.

### Как работает редактирование

- форма раскрывается через `Collapse`;
- форма доступна только при `financeCapabilities.canEditProjectFinance`;
- кнопка редактирования disabled, если `projectFinance.state !== 'ACTIVE'`.

Файлы формы:

- `src/features/project-finance/edit-project-finance/ui/EditProjectFinanceForm.tsx`
- `src/features/project-finance/edit-project-finance/model/schema.ts`

### Важная логика

- при редактировании в payload передаётся `version`;
- если backend возвращает `OPTIMISTIC_CONCURRENCY_CONFLICT`, показывается отдельное понятное сообщение;
- page-level код не содержит собственной валидации, только подключает feature-форму.

---

## 8. Блок "Итоги по проекту"

### Где лежит

- `src/widgets/project-finance-summary-block/ProjectFinanceSummaryBlock.tsx`

### Что показывает

Блок строит сводку по четырём типам движений:

- плановые поступления;
- плановые расходы;
- фактические поступления;
- фактические расходы.

Плюс считает:

- плановый баланс;
- фактический баланс.

### Как считается сводка

В сводке учитываются только записи со `state === 'ACTIVE'`.

Блок делает четыре query:

- `usePlannedPayments`
- `usePlannedCosts`
- `useActualPayments`
- `useActualCosts`

### Как он выглядит

Это `SectionCard` с набором компактных metric-card на `Paper`.

Если есть проблема хотя бы в одном источнике, блок показывает единый `ErrorState`.

---

## 9. Блок "Участники"

### Где лежит

- `src/widgets/project-finance-members-block/ProjectFinanceMembersBlock.tsx`

### Что показывает

Для каждого участника показываются:

- имя;
- технический `userId`, если он отличается от display name;
- текущий уровень доступа;
- дата добавления;
- дата обновления.

### Как работает добавление

Кнопка `Добавить участника` открывает форму через `Collapse`.

Форма:

- `src/features/project-finance-member/create-project-finance-member/ui/CreateProjectFinanceMemberForm.tsx`
- `src/features/project-finance-member/create-project-finance-member/model/schema.ts`

### Как выглядит форма

Форма использует:

- `Autocomplete` по доступным пользователям;
- `Select` для access level (`VIEW` / `EDIT`).

### Как работает редактирование участника

Редактирование доступа встроено прямо в list item:

- справа показывается селект доступа;
- рядом кнопка `Сохранить доступ`;
- ниже кнопка `Убрать`.

Это не отдельная feature-форма, а локальный action внутри widget.

---

## 10. Блок "Финансы по разделам"

### Где лежит

- `src/widgets/section-finance-plan-block/SectionFinancePlanBlock.tsx`

### Что это за блок

Это корневой контейнер всех section-level финансов внутри одного `ProjectFinance`.

Каждый `SectionFinancePlan` рендерится как отдельный `Paper`, внутри которого живут:

1. шапка блока раздела;
2. форма редактирования блока раздела;
3. сводка по разделу;
4. блок плановых поступлений;
5. блок плановых расходов.

### Как выглядит шапка блока раздела

Показываются:

- имя блока;
- статус;
- внешний ID раздела;
- описание;
- версия;
- даты создания, обновления и архивирования.

### Какие действия доступны

- `Редактировать`
- `Архивировать`

Они показываются в зависимости от `financeCapabilities`.

### Как добавлять новый блок раздела

На верхнем уровне есть кнопка `Добавить блок раздела`, которая открывает `CreateSectionFinancePlanForm`.

Файлы:

- `src/features/section-finance-plan/create-section-finance-plan/ui/CreateSectionFinancePlanForm.tsx`
- `src/features/section-finance-plan/create-section-finance-plan/model/schema.ts`

Поля формы:

- `externalSectionId`
- `name`
- `description`

### Как редактировать блок раздела

Форма редактирования:

- `src/features/section-finance-plan/edit-section-finance-plan/ui/EditSectionFinancePlanForm.tsx`
- `src/features/section-finance-plan/edit-section-finance-plan/model/schema.ts`

Логика:

- форма живёт внутри `Collapse`;
- редактирование выключено, если блок уже не `ACTIVE`;
- в update payload передаётся `version`.

---

## 11. Сводка по разделу

### Где лежит

- `src/widgets/section-finance-summary-block/SectionFinanceSummaryBlock.tsx`

### Что делает

Блок показывает ту же идею, что и проектная сводка, но только для конкретного раздела.

### Как фильтруются данные

- плановые поступления и расходы берутся по `sectionFinancePlanIds.includes(sectionFinancePlanId)`;
- фактические поступления и расходы подтягиваются через связанные planned-записи;
- в расчёт также попадают только активные записи.

### Как выглядит

Это вложенный `Paper` с компактными summary-card.

---

## 12. Блок "Плановые поступления"

### Где лежит

- `src/widgets/planned-payment-block/PlannedPaymentBlock.tsx`

### Как выглядит раздел

Блок строится как отдельный `Paper` внутри section block.

Верхняя часть:

- заголовок "Плановые поступления";
- текст-пояснение;
- кнопка `Добавить поступление`, если действие разрешено.

### Как добавлять плановое поступление

Кнопка открывает `CreatePlannedPaymentForm`.

Файлы:

- `src/features/planned-payment/create-planned-payment/ui/CreatePlannedPaymentForm.tsx`
- `src/features/planned-payment/create-planned-payment/model/schema.ts`

Поля формы:

- `name`
- `amount`
- `conditionSource`
- `plannedDate` или события

### Важная логика формы

`conditionSource` может быть только:

- `DATE`
- `EVENTS`

Если выбран `DATE`:

- показывается поле даты;
- поля событий очищаются;
- события должны быть пустыми по Zod-схеме.

Если выбран `EVENTS`:

- поле даты очищается и скрывается;
- показываются `Autocomplete` для `projectEventIds` и `sectionEventIds`;
- должно быть выбрано хотя бы одно событие.

Форма переводит дату в ISO-формат на начало дня через schema mapper.

### Как выглядит одна запись планового поступления

В карточке показываются:

- название;
- `status`;
- `state`;
- сумма;
- либо плановая дата, либо блок событий;
- версия;
- дата создания;
- дата обновления;
- фактическая дата;
- дата архивирования.

### Как работает редактирование

Форма:

- `src/features/planned-payment/edit-planned-payment/ui/EditPlannedPaymentForm.tsx`
- `src/features/planned-payment/edit-planned-payment/model/schema.ts`

Особенности:

- можно менять связанные `sectionFinancePlanIds`;
- режим `DATE` / `EVENTS` также взаимоисключающий;
- форма раскрывается через `Collapse`.

### Когда редактирование запрещено

Редактирование отключается, если:

- planned-запись уже в архиве;
- ещё грузятся фактические поступления;
- произошла ошибка загрузки фактических поступлений;
- существует активное фактическое поступление.

Если активный факт уже существует, UI показывает причину рядом с кнопкой.

### Как работает смена статуса

Отдельная форма смены статуса показывается только если одновременно выполняются условия:

- пользователь может менять статус;
- planned-запись активна;
- `plannedPayment.status === 'RECEIVED'`;
- существует активное `ActualPayment`.

Файлы:

- `src/features/planned-payment/change-planned-payment-status/ui/ChangePlannedPaymentStatusForm.tsx`
- `src/features/planned-payment/change-planned-payment-status/model/schema.ts`

Из формы можно вернуть запись только в:

- `PLANNED`
- `EXPECTED`

---

## 13. Блок "Фактические поступления"

### Где лежит

Это не отдельная page-level секция проекта, а вложенный подраздел внутри каждой planned payment записи.

Файл:

- `src/widgets/planned-payment-block/PlannedPaymentBlock.tsx`

### Как выглядит

Внутри planned payment item есть отдельный `Paper` с заголовком "Фактические поступления".

Показываются:

- кнопка `Добавить факт поступления`, если действие разрешено;
- состояние загрузки / ошибки / пустоты;
- список `ActualPayment`.

### Как добавлять фактическое поступление

Используется `CreateActualPaymentForm`.

Файлы:

- `src/features/actual-payment/create-actual-payment/ui/CreateActualPaymentForm.tsx`
- `src/features/actual-payment/create-actual-payment/model/schema.ts`

Поля формы:

- `amount`
- `actualDate`
- `comment`

### Когда можно добавить факт

Кнопка создания показывается только если:

- есть право `canCreateActualPayment`;
- запрос фактических поступлений уже успешно завершился;
- planned-запись активна;
- активного фактического поступления ещё нет.

То есть для одной planned payment UI не даёт создать второй активный факт.

### Как выглядит одна фактическая запись

Показываются:

- дата поступления;
- `state`;
- сумма;
- комментарий;
- версия;
- дата создания;
- дата обновления;
- дата архивирования.

### Как работает архивирование факта

Архивирование возможно через `ArchiveActionButton`.

После архивирования query invalidation обновляет:

- список actual payments;
- список planned payments.

Это важно, потому что backend может вернуть planned-запись из `RECEIVED` в другой статус.

---

## 14. Блок "Плановые расходы"

### Где лежит

- `src/widgets/planned-cost-block/PlannedCostBlock.tsx`

### Общая структура

По устройству блок почти симметричен `PlannedPaymentBlock`.

Верхняя часть:

- заголовок "Плановые расходы";
- поясняющий текст;
- кнопка `Добавить расход`.

### Как добавлять плановый расход

Файлы:

- `src/features/planned-cost/create-planned-cost/ui/CreatePlannedCostForm.tsx`
- `src/features/planned-cost/create-planned-cost/model/schema.ts`

Поля:

- `name`
- `amount`
- `conditionSource`
- `plannedDate` или события

### Важная логика формы

Логика режима полностью повторяет плановые поступления:

- `DATE` показывает дату и запрещает события;
- `EVENTS` скрывает дату и требует хотя бы одно событие;
- значения событий нормализуются и дедуплицируются;
- дата переводится в ISO через schema mapper.

### Как выглядит карточка расхода

Показываются:

- название;
- `status`;
- `state`;
- сумма;
- либо плановая дата, либо описанный rule-блок по событиям;
- версия;
- даты создания, обновления, архивирования;
- `actualDate`.

### Как редактировать

Файлы:

- `src/features/planned-cost/edit-planned-cost/ui/EditPlannedCostForm.tsx`
- `src/features/planned-cost/edit-planned-cost/model/schema.ts`

Форма позволяет:

- менять базовые поля;
- менять `conditionSource`;
- выбирать связанные `sectionFinancePlanIds`.

### Когда редактирование запрещено

Логика повторяет плановые поступления:

- нельзя редактировать архивную запись;
- нельзя редактировать запись с активным `ActualCost`;
- нельзя редактировать, пока факт не загрузился или пока запрос по фактам упал.

### Как работает смена статуса

Отдельная форма смены статуса:

- `src/features/planned-cost/change-planned-cost-status/ui/ChangePlannedCostStatusForm.tsx`
- `src/features/planned-cost/change-planned-cost-status/model/schema.ts`

Показывается только когда:

- `plannedCost.status === 'RECEIVED'`;
- есть активный `ActualCost`;
- пользователь имеет право менять статус;
- запись не архивная.

---

## 15. Блок "Фактические расходы"

### Где лежит

Это вложенный подраздел внутри каждой planned cost записи.

Файл:

- `src/widgets/planned-cost-block/PlannedCostBlock.tsx`

### Как выглядит

Вложенный `Paper` с заголовком "Фактические расходы".

### Как добавлять

Файлы:

- `src/features/actual-cost/create-actual-cost/ui/CreateActualCostForm.tsx`
- `src/features/actual-cost/create-actual-cost/model/schema.ts`

Поля:

- `amount`
- `actualDate`
- `comment`

### Когда можно добавить факт расхода

Условия те же, что и для фактических поступлений:

- запись planned active;
- активного actual ещё нет;
- query по фактам успешно загружен;
- пользователь имеет нужное право.

---

## 16. Где именно лежит логика добавления и редактирования

Если нужно изменить поведение кнопки, раскрытие формы или вид списка:

- меняется `widget`.

Если нужно изменить поля формы, helper text, порядок полей:

- меняется `features/.../ui/*.tsx`.

Если нужно изменить правила валидации, взаимосвязь полей, mapping в request:

- меняется `features/.../model/schema.ts`.

Если нужно изменить запросы, invalidation или query keys:

- меняется `entities/.../api/*.query.ts`.

Если нужно изменить endpoint или shape HTTP-вызова:

- меняется `entities/.../api/*.api.ts`.

Если нужно изменить доменный контракт сущности:

- меняется `entities/.../model/types.ts`.

---

## 17. Общая логика прав доступа

Весь UI финансового модуля завязан на `getFinanceCapabilities`.

Главный файл:

- `src/shared/access/finance-capabilities.ts`

Что он делает:

- переводит module access и project finance access в набор булевых флагов;
- даёт `readOnlyReason`;
- централизованно определяет, какие create/edit/archive/status-change действия доступны.

Практический вывод:

- если кнопка не показывается, сначала проверять `financeCapabilities`;
- не нужно дублировать логику ролей по всему UI.

---

## 18. Общая логика запросов и ошибок

### Query hooks

Основные query-файлы:

- `src/entities/project-finance/api/project-finance.query.ts`
- `src/entities/section-finance-plan/api/section-finance-plan.query.ts`
- `src/entities/project-finance-member/api/project-finance-member.query.ts`
- `src/entities/planned-payment/api/planned-payment.query.ts`
- `src/entities/planned-cost/api/planned-cost.query.ts`
- `src/entities/actual-payment/api/actual-payment.query.ts`
- `src/entities/actual-cost/api/actual-cost.query.ts`

### Общий принцип

- чтение данных идёт через `useQuery`;
- создание/редактирование/архивирование идёт через `useMutation`;
- после успешной мутации инвалидируются связанные query;
- page и widget код не вызывает `axios` напрямую.

### Ошибки

Единый parser ошибок:

- `src/shared/api/parse-api-error.ts`

Общий HTTP-клиент:

- `src/shared/api/http-client.ts`

Что важно:

- frontend работает с error shape `{ code, message, details? }`;
- code-based сообщения нормализуются в `parseApiError`;
- form-level ошибки и field-level ошибки разделены.

---

## 19. Карта файлов по зонам ответственности

### Каркас приложения

- `src/app/router/router.tsx`
- `src/widgets/app-shell/AppShell.tsx`
- `src/app/theme/theme.ts`

### Shared UI и инфраструктура

- `src/shared/ui/PageContainer.tsx`
- `src/shared/ui/PageTitle.tsx`
- `src/shared/ui/SectionCard.tsx`
- `src/shared/ui/LoadingState.tsx`
- `src/shared/ui/EmptyState.tsx`
- `src/shared/ui/ErrorState.tsx`
- `src/shared/ui/AccessNotice.tsx`
- `src/shared/ui/FinanceStatusChip.tsx`
- `src/shared/ui/ArchiveActionButton.tsx`
- `src/shared/access/finance-capabilities.ts`
- `src/shared/api/http-client.ts`
- `src/shared/api/parse-api-error.ts`

### Pages

- `src/pages/project-finances/ProjectFinancesPage.tsx`
- `src/pages/project-finance-create/ProjectFinanceCreatePage.tsx`
- `src/pages/project-finance-details/ProjectFinanceDetailsPage.tsx`

### Widgets

- `src/widgets/project-finance-summary-block/ProjectFinanceSummaryBlock.tsx`
- `src/widgets/project-finance-members-block/ProjectFinanceMembersBlock.tsx`
- `src/widgets/section-finance-plan-block/SectionFinancePlanBlock.tsx`
- `src/widgets/section-finance-summary-block/SectionFinanceSummaryBlock.tsx`
- `src/widgets/planned-payment-block/PlannedPaymentBlock.tsx`
- `src/widgets/planned-cost-block/PlannedCostBlock.tsx`

### Feature-формы

- `src/features/project-finance/create-project-finance/ui/CreateProjectFinanceForm.tsx`
- `src/features/project-finance/edit-project-finance/ui/EditProjectFinanceForm.tsx`
- `src/features/project-finance-member/create-project-finance-member/ui/CreateProjectFinanceMemberForm.tsx`
- `src/features/section-finance-plan/create-section-finance-plan/ui/CreateSectionFinancePlanForm.tsx`
- `src/features/section-finance-plan/edit-section-finance-plan/ui/EditSectionFinancePlanForm.tsx`
- `src/features/planned-payment/create-planned-payment/ui/CreatePlannedPaymentForm.tsx`
- `src/features/planned-payment/edit-planned-payment/ui/EditPlannedPaymentForm.tsx`
- `src/features/planned-payment/change-planned-payment-status/ui/ChangePlannedPaymentStatusForm.tsx`
- `src/features/actual-payment/create-actual-payment/ui/CreateActualPaymentForm.tsx`
- `src/features/planned-cost/create-planned-cost/ui/CreatePlannedCostForm.tsx`
- `src/features/planned-cost/edit-planned-cost/ui/EditPlannedCostForm.tsx`
- `src/features/planned-cost/change-planned-cost-status/ui/ChangePlannedCostStatusForm.tsx`
- `src/features/actual-cost/create-actual-cost/ui/CreateActualCostForm.tsx`

### Schema-слой feature-форм

- `src/features/project-finance/create-project-finance/model/schema.ts`
- `src/features/project-finance/edit-project-finance/model/schema.ts`
- `src/features/project-finance-member/create-project-finance-member/model/schema.ts`
- `src/features/section-finance-plan/create-section-finance-plan/model/schema.ts`
- `src/features/section-finance-plan/edit-section-finance-plan/model/schema.ts`
- `src/features/planned-payment/create-planned-payment/model/schema.ts`
- `src/features/planned-payment/edit-planned-payment/model/schema.ts`
- `src/features/planned-payment/change-planned-payment-status/model/schema.ts`
- `src/features/actual-payment/create-actual-payment/model/schema.ts`
- `src/features/planned-cost/create-planned-cost/model/schema.ts`
- `src/features/planned-cost/edit-planned-cost/model/schema.ts`
- `src/features/planned-cost/change-planned-cost-status/model/schema.ts`
- `src/features/actual-cost/create-actual-cost/model/schema.ts`

### Entity contracts и query hooks

- `src/entities/project-finance/model/types.ts`
- `src/entities/project-finance/api/project-finance.api.ts`
- `src/entities/project-finance/api/project-finance.query.ts`
- `src/entities/project-finance-member/model/types.ts`
- `src/entities/project-finance-member/api/project-finance-member.api.ts`
- `src/entities/project-finance-member/api/project-finance-member.query.ts`
- `src/entities/section-finance-plan/model/types.ts`
- `src/entities/section-finance-plan/api/section-finance-plan.api.ts`
- `src/entities/section-finance-plan/api/section-finance-plan.query.ts`
- `src/entities/planned-payment/model/types.ts`
- `src/entities/planned-payment/api/planned-payment.api.ts`
- `src/entities/planned-payment/api/planned-payment.query.ts`
- `src/entities/planned-cost/model/types.ts`
- `src/entities/planned-cost/api/planned-cost.api.ts`
- `src/entities/planned-cost/api/planned-cost.query.ts`
- `src/entities/actual-payment/model/types.ts`
- `src/entities/actual-payment/api/actual-payment.api.ts`
- `src/entities/actual-payment/api/actual-payment.query.ts`
- `src/entities/actual-cost/model/types.ts`
- `src/entities/actual-cost/api/actual-cost.api.ts`
- `src/entities/actual-cost/api/actual-cost.query.ts`

---

## 20. Короткий практический навигатор

Если нужно изменить только внешний вид страницы:

- начинать с `pages` и `widgets`;
- если паттерн общий, смотреть `shared/ui`.

Если нужно изменить "Общую информацию":

- `src/pages/project-finance-details/ProjectFinanceDetailsPage.tsx`
- `src/features/project-finance/edit-project-finance/*`

Если нужно изменить "Финансы по разделам":

- `src/widgets/section-finance-plan-block/SectionFinancePlanBlock.tsx`
- `src/features/section-finance-plan/*`

Если нужно изменить "Фактические поступления":

- `src/widgets/planned-payment-block/PlannedPaymentBlock.tsx`
- `src/features/actual-payment/create-actual-payment/*`
- `src/entities/actual-payment/*`

Если нужно изменить "Плановые расходы":

- `src/widgets/planned-cost-block/PlannedCostBlock.tsx`
- `src/features/planned-cost/*`
- `src/entities/planned-cost/*`

Если нужно менять правила режима `DATE` / `EVENTS`:

- сначала смотреть `model/schema.ts` у planned payment / planned cost;
- потом UI-форму;
- только потом query/api.
