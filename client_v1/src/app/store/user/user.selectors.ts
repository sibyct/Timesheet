import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { UserState } from './user.state';

export const selectUserState   = createFeatureSelector<UserState>('user');

export const selectUserList    = createSelector(selectUserState, (s) => s.list);
export const selectUserMeta    = createSelector(selectUserState, (s) => s.meta);
export const selectActiveUser  = createSelector(selectUserState, (s) => s.active);
export const selectUserLoading = createSelector(selectUserState, (s) => s.loading);
export const selectUserSaving  = createSelector(selectUserState, (s) => s.saving);
export const selectUserError   = createSelector(selectUserState, (s) => s.error);

export const selectUserCount = createSelector(
  selectUserList,
  (list) => list.length,
);
