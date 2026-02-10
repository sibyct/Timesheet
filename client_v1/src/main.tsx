import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppProviders } from "@/core/providers/AppProviders.tsx";
import { RouterProvider } from "react-router-dom";
import { router } from "@/core/router";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
