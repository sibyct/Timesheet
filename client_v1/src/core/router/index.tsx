import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { AppLayout } from "@/shared/layout/AppLayout/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />, // Redirect root to login
  },

  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "register",
    element: <RegisterPage />,
  },
  {
    path: "",
    element: <AppLayout />,
    children: [
      {
        path: "dashboard",
        element: <div>Dashboard</div>,
      },
      {
        path: "users",
        element: <div>Users</div>,
      },
      {
        path: "products",
        element: <div>Products</div>,
      },
      {
        path: "orders",
        element: <div>Orders</div>,
      },
      {
        path: "reports",
        element: <div>Reports</div>,
      },
      {
        path: "settings",
        element: <div>Settings</div>,
      },
    ],
  },

  {
    path: "*",
    element: <div>404 - Page Not Found</div>, // Catch-all route
  },
]);
