import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

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
    path: "*",
    element: <div>404 - Page Not Found</div>, // Catch-all route
  },
]);
