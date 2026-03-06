import type { Timesheet } from '../../core/models/timesheet.models';
import type { PaginationMeta } from '../../core/models/api.models';

export interface ApprovalState {
  /** Submitted timesheets waiting for action */
  queue:       Timesheet[];
  meta:        PaginationMeta | null;
  /** userId → "First Last" display name, populated after queue loads */
  userMap:     Record<string, string>;
  loading:     boolean;
  /** IDs of timesheets currently being actioned (approve/reject in-flight) */
  actioning:   Set<string>;
  /** IDs selected for bulk approve */
  selected:    Set<string>;
  error:       string | null;
}

export const initialApprovalState: ApprovalState = {
  queue:     [],
  meta:      null,
  userMap:   {},
  loading:   false,
  actioning: new Set(),
  selected:  new Set(),
  error:     null,
};
