import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectToken      = createSelector(selectAuthState, (s) => s.token);
export const selectAuthUser   = createSelector(selectAuthState, (s) => s.user);
export const selectAuthRole   = createSelector(selectAuthState, (s) => s.user?.role ?? null);
export const selectIsLoggedIn = createSelector(selectAuthState, (s) => !!s.token);
export const selectIsAdmin    = createSelector(selectAuthState, (s) => s.user?.role === 'admin');
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError  = createSelector(selectAuthState, (s) => s.error);

export const selectUserFullName = createSelector(
  selectAuthUser,
  (user) => user ? `${user.firstName} ${user.lastName}`.trim() : '',
);

export const selectUserInitials = createSelector(
  selectAuthUser,
  (user) => {
    if (!user) return '';
    return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  },
);
