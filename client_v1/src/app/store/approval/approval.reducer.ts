import { createReducer, on } from '@ngrx/store';
import { initialApprovalState, type ApprovalState } from './approval.state';
import { ApprovalActions } from './approval.actions';

export const approvalReducer = createReducer<ApprovalState>(
  initialApprovalState,

  // ── Load queue ──────────────────────────────────────────────────────────────
  on(ApprovalActions.loadQueue, (state) => ({
    ...state, loading: true, error: null,
  })),
  on(ApprovalActions.loadQueueSuccess, (state, { queue, meta }) => ({
    ...state, loading: false, queue, meta, selected: new Set<string>(),
  })),
  on(ApprovalActions.loadUsersSuccess, (state, { userMap }) => ({
    ...state, userMap,
  })),
  on(ApprovalActions.loadQueueFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  // ── Approve ─────────────────────────────────────────────────────────────────
  on(ApprovalActions.approve, (state, { id }) => ({
    ...state, actioning: new Set([...state.actioning, id]),
  })),
  on(ApprovalActions.approveSuccess, (state, { timesheet }) => ({
    ...state,
    queue:     state.queue.filter((t) => t._id !== timesheet._id),
    actioning: new Set([...state.actioning].filter((id) => id !== timesheet._id)),
    selected:  new Set([...state.selected].filter((id) => id !== timesheet._id)),
  })),
  on(ApprovalActions.approveFailure, (state, { id, error }) => ({
    ...state,
    actioning: new Set([...state.actioning].filter((i) => i !== id)),
    error,
  })),

  // ── Reject ──────────────────────────────────────────────────────────────────
  on(ApprovalActions.reject, (state, { id }) => ({
    ...state, actioning: new Set([...state.actioning, id]),
  })),
  on(ApprovalActions.rejectSuccess, (state, { timesheet }) => ({
    ...state,
    queue:     state.queue.filter((t) => t._id !== timesheet._id),
    actioning: new Set([...state.actioning].filter((id) => id !== timesheet._id)),
    selected:  new Set([...state.selected].filter((id) => id !== timesheet._id)),
  })),
  on(ApprovalActions.rejectFailure, (state, { id, error }) => ({
    ...state,
    actioning: new Set([...state.actioning].filter((i) => i !== id)),
    error,
  })),

  // ── Bulk approve ─────────────────────────────────────────────────────────────
  on(ApprovalActions.bulkApprove, (state) => ({
    ...state,
    actioning: new Set([...state.actioning, ...state.selected]),
  })),
  on(ApprovalActions.bulkApproveSuccess, (state, { approved }) => ({
    ...state,
    queue:     state.queue.filter((t) => !approved.includes(t._id)),
    actioning: new Set([...state.actioning].filter((id) => !approved.includes(id))),
    selected:  new Set<string>(),
  })),
  on(ApprovalActions.bulkApproveFailure, (state, { error }) => ({
    ...state,
    actioning: new Set<string>(),
    error,
  })),

  // ── Selection ────────────────────────────────────────────────────────────────
  on(ApprovalActions.toggleSelect, (state, { id }) => {
    const next = new Set(state.selected);
    next.has(id) ? next.delete(id) : next.add(id);
    return { ...state, selected: next };
  }),
  on(ApprovalActions.selectAll, (state) => ({
    ...state,
    selected: new Set(state.queue.map((t) => t._id)),
  })),
  on(ApprovalActions.deselectAll, (state) => ({
    ...state, selected: new Set<string>(),
  })),
);
