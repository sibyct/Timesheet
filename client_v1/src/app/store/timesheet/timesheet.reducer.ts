import { createReducer, on } from '@ngrx/store';
import { initialTimesheetState, type TimesheetState } from './timesheet.state';
import { TimesheetActions } from './timesheet.actions';

export const timesheetReducer = createReducer<TimesheetState>(
  initialTimesheetState,

  // ── Load list ──────────────────────────────────────────────────────────────
  on(TimesheetActions.loadMyTimesheets, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(TimesheetActions.loadMyTimesheetsSuccess, (state, { timesheets }) => ({
    ...state, loading: false, list: timesheets,
  })),
  on(TimesheetActions.loadMyTimesheetsFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // ── Load for week ──────────────────────────────────────────────────────────
  on(TimesheetActions.loadForWeek, (state) => ({
    ...state, loading: true, active: null, pendingEntries: null, error: null,
  })),
  on(TimesheetActions.loadForWeekSuccess, (state, { timesheet }) => ({
    ...state, loading: false, active: timesheet, pendingEntries: null,
  })),
  on(TimesheetActions.loadForWeekFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // ── Create ────────────────────────────────────────────────────────────────
  on(TimesheetActions.create, (state) => ({
    ...state, saving: true, error: null,
  })),
  on(TimesheetActions.createSuccess, (state, { timesheet }) => ({
    ...state,
    saving:  false,
    active:  timesheet,
    list:    [timesheet, ...state.list],
    pendingEntries: null,
  })),
  on(TimesheetActions.createFailure, (state, { error }) => ({
    ...state, saving: false, error,
  })),

  // ── Pending edits ─────────────────────────────────────────────────────────
  on(TimesheetActions.setPendingEntries, (state, { entries }) => ({
    ...state, pendingEntries: entries,
  })),

  // ── Save entries ──────────────────────────────────────────────────────────
  on(TimesheetActions.saveEntries, (state) => ({
    ...state, saving: true, error: null,
  })),
  on(TimesheetActions.saveEntriesSuccess, (state, { timesheet }) => ({
    ...state,
    saving:         false,
    active:         timesheet,
    pendingEntries: null,
    list: state.list.map((t) => t._id === timesheet._id ? timesheet : t),
  })),
  on(TimesheetActions.saveEntriesFailure, (state, { error }) => ({
    ...state, saving: false, error,
  })),

  // ── Submit ────────────────────────────────────────────────────────────────
  on(TimesheetActions.submit, (state) => ({
    ...state, submitting: true, error: null,
  })),
  on(TimesheetActions.submitSuccess, (state, { timesheet }) => ({
    ...state,
    submitting: false,
    active:     timesheet,
    list: state.list.map((t) => t._id === timesheet._id ? timesheet : t),
  })),
  on(TimesheetActions.submitFailure, (state, { error }) => ({
    ...state, submitting: false, error,
  })),

  // ── Recall ────────────────────────────────────────────────────────────────
  on(TimesheetActions.recall, (state) => ({
    ...state, recalling: true, error: null,
  })),
  on(TimesheetActions.recallSuccess, (state, { timesheet }) => ({
    ...state,
    recalling: false,
    active:    timesheet,
    list: state.list.map((t) => t._id === timesheet._id ? timesheet : t),
  })),
  on(TimesheetActions.recallFailure, (state, { error }) => ({
    ...state, recalling: false, error,
  })),

  // ── Clear active ──────────────────────────────────────────────────────────
  on(TimesheetActions.clearActive, (state) => ({
    ...state, active: null, pendingEntries: null, error: null,
  })),
);
