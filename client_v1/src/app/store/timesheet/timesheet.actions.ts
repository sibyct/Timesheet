import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { Timesheet, TimesheetEntry, CreateTimesheetPayload } from '../../core/models/timesheet.models';

export const TimesheetActions = createActionGroup({
  source: 'Timesheet',
  events: {
    // ── Load list ─────────────────────────────────────────────────────────────
    'Load My Timesheets':         emptyProps(),
    'Load My Timesheets Success': props<{ timesheets: Timesheet[] }>(),
    'Load My Timesheets Failure': props<{ error: string }>(),

    // ── Load single (by week start) ───────────────────────────────────────────
    'Load For Week':         props<{ periodStart: string }>(),
    'Load For Week Success': props<{ timesheet: Timesheet | null }>(),
    'Load For Week Failure': props<{ error: string }>(),

    // ── Create ────────────────────────────────────────────────────────────────
    'Create':         props<{ payload: CreateTimesheetPayload }>(),
    'Create Success': props<{ timesheet: Timesheet }>(),
    'Create Failure': props<{ error: string }>(),

    // ── Save entries ──────────────────────────────────────────────────────────
    'Save Entries':         props<{ id: string; entries: TimesheetEntry[]; notes: string }>(),
    'Save Entries Success': props<{ timesheet: Timesheet }>(),
    'Save Entries Failure': props<{ error: string }>(),

    // ── Track pending edits (before save) ─────────────────────────────────────
    'Set Pending Entries': props<{ entries: TimesheetEntry[] }>(),

    // ── Submit ────────────────────────────────────────────────────────────────
    'Submit':         props<{ id: string }>(),
    'Submit Success': props<{ timesheet: Timesheet }>(),
    'Submit Failure': props<{ error: string }>(),

    // ── Recall ────────────────────────────────────────────────────────────────
    'Recall':         props<{ id: string }>(),
    'Recall Success': props<{ timesheet: Timesheet }>(),
    'Recall Failure': props<{ error: string }>(),

    // ── Clear active ─────────────────────────────────────────────────────────
    'Clear Active': emptyProps(),
  },
});
