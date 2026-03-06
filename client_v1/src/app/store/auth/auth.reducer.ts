import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export type { AuthState };

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, (state): AuthState => ({
    ...state,
    loading: true,
    error:   null,
  })),

  on(AuthActions.loginSuccess, (state, { token, user }): AuthState => ({
    ...state,
    user,
    token,
    loading: false,
    error:   null,
  })),

  on(AuthActions.loginFailure, (state, { error }): AuthState => ({
    ...state,
    user:    null,
    token:   null,
    loading: false,
    error,
  })),

  on(AuthActions.logout, (): AuthState => ({
    user:    null,
    token:   null,
    loading: false,
    error:   null,
  })),

  on(AuthActions.restoreSession, (state, { token }): AuthState => ({
    ...state,
    token,
  })),

  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null,
  })),
);
