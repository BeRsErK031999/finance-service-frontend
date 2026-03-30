import { useSyncExternalStore } from 'react'

import { appConfig } from '../config/env'
import { queryClient } from '../lib/query-client'

const MOCK_AUTH_STORAGE_KEY = 'finance-service.mock-auth.current-user-id'

export interface MockAuthUser {
  id: string
  label: string
  description: string
}

export const MOCK_AUTH_USERS: readonly MockAuthUser[] = [
  {
    id: 'viewer-1',
    label: 'Демо наблюдатель',
    description: 'Может только просматривать уже созданные финансовые планы.',
  },
  {
    id: 'editor-1',
    label: 'Демо редактор',
    description: 'Может создавать и редактировать данные в MVP-сценарии.',
  },
]

const mockAuthListeners = new Set<() => void>()

function isBrowserEnvironment() {
  return typeof window !== 'undefined'
}

function notifyMockAuthListeners() {
  mockAuthListeners.forEach((listener) => listener())
}

function readStoredMockUserId(): string | null {
  if (!isBrowserEnvironment()) {
    return null
  }

  const storedUserId = window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY)

  return storedUserId && storedUserId.trim().length > 0 ? storedUserId : null
}

function writeStoredMockUserId(userId: string | null) {
  if (!isBrowserEnvironment()) {
    return
  }

  if (userId === null) {
    window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY)
  } else {
    window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, userId)
  }

  notifyMockAuthListeners()
}

async function refreshAuthScopedQueries() {
  await queryClient.cancelQueries()
  await queryClient.resetQueries()
}

function findMockAuthUserById(userId: string | null): MockAuthUser | null {
  if (userId === null) {
    return null
  }

  return MOCK_AUTH_USERS.find((user) => user.id === userId) ?? null
}

export function getCurrentMockAuthUser(): MockAuthUser | null {
  return findMockAuthUserById(readStoredMockUserId())
}

export function getCurrentMockAuthUserId(): string | null {
  return getCurrentMockAuthUser()?.id ?? null
}

export function getCurrentRequestUserId(): string | null {
  return getCurrentMockAuthUserId() ?? appConfig.fallbackCurrentUserId
}

export function loginMockAuthUser(userId: string): MockAuthUser {
  const user = findMockAuthUserById(userId)

  if (user === null) {
    throw new Error(`Пользователь демо-входа "${userId}" не настроен.`)
  }

  if (readStoredMockUserId() !== user.id) {
    writeStoredMockUserId(user.id)
    void refreshAuthScopedQueries()
  }

  return user
}

export function logoutMockAuthUser() {
  if (readStoredMockUserId() === null) {
    return
  }

  writeStoredMockUserId(null)
  void refreshAuthScopedQueries()
}

export function switchMockAuthUser(userId: string) {
  return loginMockAuthUser(userId)
}

function subscribeToMockAuth(listener: () => void) {
  mockAuthListeners.add(listener)

  if (!isBrowserEnvironment()) {
    return () => {
      mockAuthListeners.delete(listener)
    }
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === MOCK_AUTH_STORAGE_KEY) {
      listener()
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    mockAuthListeners.delete(listener)
    window.removeEventListener('storage', handleStorage)
  }
}

export function useMockAuth() {
  const currentUser = useSyncExternalStore(
    subscribeToMockAuth,
    getCurrentMockAuthUser,
    getCurrentMockAuthUser,
  )

  return {
    availableUsers: MOCK_AUTH_USERS,
    currentUser,
    isAuthenticated: currentUser !== null,
    login: loginMockAuthUser,
    logout: logoutMockAuthUser,
    switchUser: switchMockAuthUser,
  }
}
