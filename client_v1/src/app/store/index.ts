import { isDevMode } from '@angular/core';
import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { authReducer, AuthState } from '@core/store/auth/auth.reducer';
import { uiReducer, UiState } from '@core/store/ui/ui.reducer';
import { approvalReducer } from './approval/approval.reducer';
import type { ApprovalState } from './approval/approval.state';
import { timesheetReducer } from './timesheet/timesheet.reducer';
import type { TimesheetState } from './timesheet/timesheet.state';
import { projectReducer } from './project/project.reducer';
import type { ProjectState } from './project/project.state';
import { userReducer } from './user/user.reducer';
import type { UserState } from './user/user.state';
import { reportReducer } from './report/report.reducer';
import type { ReportState } from './report/report.state';
import { dashboardReducer } from './dashboard/dashboard.reducer';
import type { DashboardState } from './dashboard/dashboard.state';

export interface AppState {
  auth: AuthState;
  ui: UiState;
  approval: ApprovalState;
  timesheet: TimesheetState;
  project: ProjectState;
  user: UserState;
  report: ReportState;
  dashboard: DashboardState;
  router: RouterReducerState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  ui: uiReducer,
  approval: approvalReducer,
  timesheet: timesheetReducer,
  project: projectReducer,
  user: userReducer,
  report: reportReducer,
  dashboard: dashboardReducer,
  router: routerReducer,
};

export const metaReducers: MetaReducer<AppState>[] = isDevMode() ? [] : [];
