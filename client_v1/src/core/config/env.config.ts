export const envConfig = {
  development: {
    apiUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  },
  production: {
    apiUrl: import.meta.env.VITE_API_BASE_URL || "https://api.timesheet.com",
  },
};
