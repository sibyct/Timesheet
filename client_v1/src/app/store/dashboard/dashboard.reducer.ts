import { createReducer, on } from '@ngrx/store';
import { initialDashboardState, type DashboardState } from './dashboard.state';
import { DashboardActions } from './dashboard.actions';

export const dashboardReducer = createReducer<DashboardState>(
  initialDashboardState,

  on(DashboardActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(DashboardActions.loadSuccess, (state, { stats }) => ({
    ...state, loading: false, stats,
  })),
  on(DashboardActions.loadFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),
);
