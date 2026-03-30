import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useMockAuth } from './mock-auth'

export interface MockAuthRedirectState {
  from?: string
}

export function RequireMockAuth() {
  const { currentUser } = useMockAuth()
  const location = useLocation()

  if (currentUser === null) {
    return (
      <Navigate
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        } satisfies MockAuthRedirectState}
        to="/login"
      />
    )
  }

  return <Outlet />
}
