import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UiState } from './ui.state';

export const selectUiState = createFeatureSelector<UiState>('ui');

export const selectLoading      = createSelector(selectUiState, (s) => s.loading);
export const selectBusy         = createSelector(selectUiState, (s) => s.busy);
export const selectNotification = createSelector(selectUiState, (s) => s.notification);
export const selectSidenavOpen  = createSelector(selectUiState, (s) => s.sidenavOpen);
