import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { Timesheet } from '../../core/models/timesheet.models';
import type { PaginationMeta } from '../../core/models/api.models';

export const ApprovalActions = createActionGroup({
  source: 'Approval',
  events: {
    // ── Queue load ────────────────────────────────────────────────────────────
    'Load Queue':         props<{ page?: number; limit?: number }>(),
    'Load Queue Success': props<{ queue: Timesheet[]; meta: PaginationMeta }>(),
    'Load Queue Failure': props<{ error: string }>(),

    // ── Approve ───────────────────────────────────────────────────────────────
    'Approve':         props<{ id: string }>(),
    'Approve Success': props<{ timesheet: Timesheet }>(),
    'Approve Failure': props<{ id: string; error: string }>(),

    // ── Reject ────────────────────────────────────────────────────────────────
    'Reject':         props<{ id: string; reason: string }>(),
    'Reject Success': props<{ timesheet: Timesheet }>(),
    'Reject Failure': props<{ id: string; error: string }>(),

    // ── Bulk approve ──────────────────────────────────────────────────────────
    'Bulk Approve':         emptyProps(),
    'Bulk Approve Success': props<{ approved: string[]; skipped: string[] }>(),
    'Bulk Approve Failure': props<{ error: string }>(),

    // ── User map (name lookup) ────────────────────────────────────────────────
    'Load Users Success': props<{ userMap: Record<string, string> }>(),

    // ── Selection ─────────────────────────────────────────────────────────────
    'Toggle Select':  props<{ id: string }>(),
    'Select All':     emptyProps(),
    'Deselect All':   emptyProps(),
  },
});
