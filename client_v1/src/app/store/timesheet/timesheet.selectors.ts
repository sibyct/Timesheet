import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { TimesheetState } from './timesheet.state';

export const selectTimesheetState = createFeatureSelector<TimesheetState>('timesheet');

export const selectTimesheetList    = createSelector(selectTimesheetState, (s) => s.list);
export const selectActiveTimesheet  = createSelector(selectTimesheetState, (s) => s.active);
export const selectPendingEntries   = createSelector(selectTimesheetState, (s) => s.pendingEntries);
export const selectTimesheetLoading = createSelector(selectTimesheetState, (s) => s.loading);
export const selectTimesheetSaving  = createSelector(selectTimesheetState, (s) => s.saving);
export const selectTimesheetSubmitting = createSelector(selectTimesheetState, (s) => s.submitting);
export const selectTimesheetRecalling  = createSelector(selectTimesheetState, (s) => s.recalling);
export const selectTimesheetError   = createSelector(selectTimesheetState, (s) => s.error);

export const selectActiveStatus = createSelector(
  selectActiveTimesheet,
  (ts) => ts?.status ?? null,
);

export const selectIsDirty = createSelector(
  selectPendingEntries,
  (entries) => entries !== null,
);

export const selectActiveTotalHours = createSelector(
  selectActiveTimesheet,
  (ts) => ts?.totalHours ?? 0,
);

/** True when any async op is in-flight */
export const selectAnyBusy = createSelector(
  selectTimesheetState,
  (s) => s.loading || s.saving || s.submitting || s.recalling,
);
