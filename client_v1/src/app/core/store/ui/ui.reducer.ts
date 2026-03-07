import { createReducer, on } from '@ngrx/store';
import { UiActions } from './ui.actions';
import { UiState, initialUiState } from './ui.state';

export type { UiState };

export const uiReducer = createReducer(
  initialUiState,

  on(UiActions.showLoading, (state): UiState => ({ ...state, loading: true })),
  on(UiActions.hideLoading, (state): UiState => ({ ...state, loading: false })),

  on(UiActions.setBusy, (state, { busy }): UiState => ({ ...state, busy })),

  on(UiActions.showNotification, (state, { message, kind }): UiState => ({
    ...state,
    notification: { message, kind },
  })),

  on(UiActions.clearNotification, (state): UiState => ({
    ...state,
    notification: null,
  })),

  on(UiActions.toggleSidenav, (state): UiState => ({
    ...state,
    sidenavOpen: !state.sidenavOpen,
  })),

  on(UiActions.setSidenavOpen, (state, { open }): UiState => ({
    ...state,
    sidenavOpen: open,
  })),
);
