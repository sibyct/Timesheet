import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { store } from "@/core/store";
import ThemeProvider from "./ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
};
