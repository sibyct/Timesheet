import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/shared/layout/AppLayout/AppLayout";
import { lazy,Suspense  } from "react";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner";

const ProductsListPage = lazy(() => import('@/features/products/pages/ProductsListPage'))
const ProductCreatePage = lazy(() => import('@/features/products/pages/ProductCreatePage'))
const ProductDetailsPage = lazy(() => import('@/features/products/pages/ProductDetailsPage'))
const ProductEditPage = lazy(() => import('@/features/products/pages/ProductEditPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner fullScreen />}>
    {children}
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />, // Redirect root to login
  },

  {
    path: "login",
    element: (
    <SuspenseWrapper>
      <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "register",
    element:(
    <SuspenseWrapper>
      <RegisterPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: "",
    element: (
    <SuspenseWrapper>
      <AppLayout />
    </SuspenseWrapper>
    ),
    children: [
      {
        path: "dashboard",
        element: (
        <SuspenseWrapper>
          <div>Dashboard</div>
        </SuspenseWrapper>
        ),
      },
      {
        path: "users",
        element: (
        <SuspenseWrapper>
          <div>Users</div>
        </SuspenseWrapper>
        ),
      },
      {
        path: '/products',
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <ProductsListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: 'create',
            element: (
              <SuspenseWrapper>
                <ProductCreatePage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id',
            element: (
              <SuspenseWrapper>
                <ProductDetailsPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <SuspenseWrapper>
                <ProductEditPage />
              </SuspenseWrapper>
            ),
          },
        ],
      },
      {
        path: "orders", 
        element: (
        <SuspenseWrapper>
          <div>Orders</div>
        </SuspenseWrapper>
        ),
      },
      {
        path: "reports",
        element: (
        <SuspenseWrapper>
          <div>Reports</div>
        </SuspenseWrapper>
        ),
      },
      {
        path: "settings",
        element: (
        <SuspenseWrapper>
          <div>Settings</div>
          </SuspenseWrapper>
        ),
      },
    ],
  },

  {
    path: "*",
    element: <div>404 - Page Not Found</div>, // Catch-all route
  },
]);
