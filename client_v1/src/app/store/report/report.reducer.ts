import { createReducer, on } from '@ngrx/store';
import { initialReportState, type ReportState } from './report.state';
import { ReportActions } from './report.actions';

export const reportReducer = createReducer<ReportState>(
  initialReportState,

  on(ReportActions.setFilters, (state, { filters }) => ({ ...state, filters })),

  on(ReportActions.loadUtilization, (state) => ({ ...state, loading: true, error: null })),
  on(ReportActions.loadUtilizationSuccess, (state, { rows }) => ({
    ...state, loading: false, utilization: rows,
  })),
  on(ReportActions.loadUtilizationFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  on(ReportActions.loadBilling, (state) => ({ ...state, loading: true, error: null })),
  on(ReportActions.loadBillingSuccess, (state, { rows }) => ({
    ...state, loading: false, billing: rows,
  })),
  on(ReportActions.loadBillingFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  on(ReportActions.clear, () => initialReportState),
);
