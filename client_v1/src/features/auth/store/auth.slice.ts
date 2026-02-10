import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "../types/auth.types";
import { storageService } from "@/services/storage/localStorage.service";
import { STORAGE_KEYS } from "@/shared/constants/storage.constants";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
    },

    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;

      // Clear tokens from storage
      storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
      storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
