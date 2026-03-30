import { Navigate, createBrowserRouter } from 'react-router-dom'

import { RouteErrorPage } from './RouteErrorPage'
import { ProjectFinanceCreatePage } from '../../pages/project-finance-create/ProjectFinanceCreatePage'
import { ProjectFinanceDetailsPage } from '../../pages/project-finance-details/ProjectFinanceDetailsPage'
import { ProjectFinancesPage } from '../../pages/project-finances/ProjectFinancesPage'
import { LoginPage } from '../../pages/login/LoginPage'
import { NotFoundPage } from '../../pages/not-found/NotFoundPage'
import { RequireMockAuth } from '../../shared/auth/RequireMockAuth'
import { AppShell } from '../../widgets/app-shell/AppShell'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    element: <RequireMockAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        errorElement: <RouteErrorPage />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/project-finances" />,
          },
          {
            path: 'project-finances',
            element: <ProjectFinancesPage />,
          },
          {
            path: 'project-finances/create',
            element: <ProjectFinanceCreatePage />,
          },
          {
            path: 'project-finances/:id',
            element: <ProjectFinanceDetailsPage />,
          },
          {
            path: '*',
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
])
