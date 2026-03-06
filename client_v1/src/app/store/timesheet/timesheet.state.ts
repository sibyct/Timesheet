import type { Timesheet, TimesheetEntry } from '../../core/models/timesheet.models';

export interface TimesheetState {
  /** All timesheets belonging to the current user */
  list:       Timesheet[];
  /** The timesheet currently open in the grid */
  active:     Timesheet | null;
  /** Unsaved grid edits (entries only) */
  pendingEntries: TimesheetEntry[] | null;
  loading:    boolean;
  saving:     boolean;
  submitting: boolean;
  recalling:  boolean;
  error:      string | null;
}

export const initialTimesheetState: TimesheetState = {
  list:           [],
  active:         null,
  pendingEntries: null,
  loading:        false,
  saving:         false,
  submitting:     false,
  recalling:      false,
  error:          null,
};
