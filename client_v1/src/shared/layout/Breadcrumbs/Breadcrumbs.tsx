import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
} from "@mui/material";
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from "@mui/icons-material";

const routeNameMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/products": "Products",
  "/orders": "Orders",
  "/reports": "Reports",
  "/settings": "Settings",
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          sx={{ display: "flex", alignItems: "center" }}
          color="inherit"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const label =
            routeNameMap[to] || value.charAt(0).toUpperCase() + value.slice(1);

          return last ? (
            <Typography key={to} color="text.primary">
              {label}
            </Typography>
          ) : (
            <Link
              key={to}
              component={RouterLink}
              to={to}
              underline="hover"
              color="inherit"
            >
              {label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};
