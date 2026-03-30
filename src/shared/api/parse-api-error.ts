import axios, { AxiosError } from 'axios'

import type { ApiError } from '../types/api'

const DEFAULT_ERROR_MESSAGE =
  'Не удалось выполнить запрос. Попробуйте ещё раз.'

const API_ERROR_MESSAGES: Record<string, string> = {
  ACTUAL_COST_ALREADY_EXISTS:
    'Фактический расход для этой записи уже зарегистрирован.',
  ACTUAL_COST_NOT_FOUND: 'Фактический расход не найден.',
  ACTUAL_COST_VALIDATION_ERROR:
    'Проверьте данные фактического расхода и попробуйте ещё раз.',
  ACTUAL_PAYMENT_ALREADY_EXISTS:
    'Фактическое поступление для этой записи уже зарегистрировано.',
  ACTUAL_PAYMENT_NOT_FOUND: 'Фактическое поступление не найдено.',
  ACTUAL_PAYMENT_VALIDATION_ERROR:
    'Проверьте данные фактического поступления и попробуйте ещё раз.',
  EXTERNAL_PROJECT_EVENT_NOT_FOUND:
    'Одно из выбранных проектных событий не найдено в финансовом сервисе.',
  EXTERNAL_PROJECT_EVENT_PROJECT_MISMATCH:
    'Выбранное проектное событие относится к другому проекту.',
  EXTERNAL_PROJECT_NOT_FOUND:
    'Проект с таким внешним ID не найден. Проверьте идентификатор или сначала убедитесь, что проект загружен в финансовый сервис.',
  EXTERNAL_PROJECT_SECTION_NOT_ACTIVE:
    'Выбранный раздел проекта недоступен для работы. Проверьте его состояние во внешней системе.',
  EXTERNAL_PROJECT_SECTION_NOT_FOUND:
    'Раздел с таким внешним ID не найден в финансовом сервисе.',
  EXTERNAL_SECTION_EVENT_NOT_FOUND:
    'Одно из выбранных событий раздела не найдено в финансовом сервисе.',
  EXTERNAL_SECTION_EVENT_PROJECT_MISMATCH:
    'Выбранное событие раздела относится к другому проекту.',
  EXTERNAL_SECTION_PROJECT_MISMATCH:
    'Выбранный раздел относится к другому проекту.',
  OPTIMISTIC_CONCURRENCY_CONFLICT:
    'Данные уже изменились. Обновите страницу и повторите действие.',
  PLANNED_COST_NOT_FOUND: 'Плановый расход не найден.',
  PLANNED_COST_PROJECT_FINANCE_MISMATCH:
    'Плановый расход относится к другому финансовому плану.',
  PLANNED_COST_STATUS_CHANGE_FORBIDDEN:
    'Сейчас нельзя изменить статус этого планового расхода.',
  PLANNED_COST_UPDATE_FORBIDDEN:
    'Сейчас нельзя редактировать этот плановый расход.',
  PLANNED_COST_VALIDATION_ERROR:
    'Проверьте данные планового расхода и попробуйте ещё раз.',
  PLANNED_PAYMENT_NOT_FOUND: 'Плановое поступление не найдено.',
  PLANNED_PAYMENT_PROJECT_FINANCE_MISMATCH:
    'Плановое поступление относится к другому финансовому плану.',
  PLANNED_PAYMENT_STATUS_CHANGE_FORBIDDEN:
    'Сейчас нельзя изменить статус этого планового поступления.',
  PLANNED_PAYMENT_UPDATE_FORBIDDEN:
    'Сейчас нельзя редактировать это плановое поступление.',
  PLANNED_PAYMENT_VALIDATION_ERROR:
    'Проверьте данные планового поступления и попробуйте ещё раз.',
  PROJECT_FINANCE_ALREADY_EXISTS:
    'Для этого проекта финансовый план уже создан.',
  PROJECT_FINANCE_MEMBER_ACCESS_FORBIDDEN:
    'У вас нет прав на управление участниками этого финансового плана.',
  PROJECT_FINANCE_MEMBER_ALREADY_EXISTS:
    'Этот участник уже добавлен в финансовый план.',
  PROJECT_FINANCE_MEMBER_NOT_FOUND:
    'Участник финансового плана не найден.',
  PROJECT_FINANCE_NOT_FOUND: 'Финансовый план проекта не найден.',
  PROJECT_FINANCE_UPDATE_FORBIDDEN:
    'Этот финансовый план сейчас нельзя редактировать.',
  REQUEST_VALIDATION_ERROR: 'Проверьте заполнение формы и попробуйте ещё раз.',
  SECTION_FINANCE_PLAN_ALREADY_EXISTS:
    'Для этого раздела финансовый блок уже создан.',
  SECTION_FINANCE_PLAN_NOT_FOUND:
    'Финансовый блок раздела не найден.',
  SECTION_FINANCE_PLAN_PROJECT_MISMATCH:
    'Выбранный финансовый блок раздела относится к другому проекту.',
  SECTION_FINANCE_PLAN_UPDATE_FORBIDDEN:
    'Этот финансовый блок раздела сейчас нельзя редактировать.',
}

export function parseApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          code?: unknown
          details?: unknown
          error?: unknown
          message?: unknown
        }
      | undefined
    const code = typeof responseData?.code === 'string' ? responseData.code : undefined

    const message =
      code && code in API_ERROR_MESSAGES
        ? API_ERROR_MESSAGES[code]
        : typeof responseData?.message === 'string'
        ? responseData.message
        : typeof responseData?.error === 'string'
          ? responseData.error
          : error.message || DEFAULT_ERROR_MESSAGE

    return {
      code,
      message:
        error.code === AxiosError.ECONNABORTED
          ? 'Сервер долго не отвечает. Попробуйте ещё раз.'
          : message,
      statusCode: error.response?.status,
      details: responseData?.details,
      isNetworkError: !error.response,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message || DEFAULT_ERROR_MESSAGE,
    }
  }

  return {
    message: DEFAULT_ERROR_MESSAGE,
  }
}
