import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { ReportState } from './report.state';

export const selectReportState = createFeatureSelector<ReportState>('report');

export const selectUtilization = createSelector(selectReportState, (s) => s.utilization);
export const selectBilling     = createSelector(selectReportState, (s) => s.billing);
export const selectFilters     = createSelector(selectReportState, (s) => s.filters);
export const selectReportLoading = createSelector(selectReportState, (s) => s.loading);
export const selectReportError   = createSelector(selectReportState, (s) => s.error);

export const selectUtilizationTotals = createSelector(selectUtilization, (rows) => ({
  totalHours:       rows.reduce((s, r) => s + r.totalHours,       0),
  billableHours:    rows.reduce((s, r) => s + r.billableHours,    0),
  nonBillableHours: rows.reduce((s, r) => s + r.nonBillableHours, 0),
}));

export const selectBillingTotals = createSelector(selectBilling, (rows) => ({
  billableHours: rows.reduce((s, r) => s + r.billableHours, 0),
  totalAmount:   rows.reduce((s, r) => s + r.totalAmount,   0),
}));
