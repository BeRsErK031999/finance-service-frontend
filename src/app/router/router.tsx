import { Navigate, createBrowserRouter } from 'react-router-dom'

import { RouteErrorPage } from './RouteErrorPage'
import { ProjectFinanceDetailsPage } from '../../pages/project-finance-details/ProjectFinanceDetailsPage'
import { ProjectFinancesPage } from '../../pages/project-finances/ProjectFinancesPage'
import { NotFoundPage } from '../../pages/not-found/NotFoundPage'
import { AppShell } from '../../widgets/app-shell/AppShell'

export const router = createBrowserRouter([
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
        path: 'project-finances/:id',
        element: <ProjectFinanceDetailsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
