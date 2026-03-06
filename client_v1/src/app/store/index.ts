import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { authReducer, AuthState } from './auth/auth.reducer';
import { uiReducer, UiState } from './ui/ui.reducer';
import { approvalReducer }  from './approval/approval.reducer';
import type { ApprovalState }  from './approval/approval.state';
import { timesheetReducer } from './timesheet/timesheet.reducer';
import type { TimesheetState } from './timesheet/timesheet.state';

export interface AppState {
  auth:      AuthState;
  ui:        UiState;
  approval:  ApprovalState;
  timesheet: TimesheetState;
  router:    RouterReducerState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth:      authReducer,
  ui:        uiReducer,
  approval:  approvalReducer,
  timesheet: timesheetReducer,
  router:    routerReducer,
};

export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];
