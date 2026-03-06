import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { ApprovalState } from './approval.state';

export const selectApprovalState = createFeatureSelector<ApprovalState>('approval');

export const selectQueue     = createSelector(selectApprovalState, (s) => s.queue);
export const selectQueueMeta = createSelector(selectApprovalState, (s) => s.meta);
export const selectUserMap   = createSelector(selectApprovalState, (s) => s.userMap);
export const selectLoading   = createSelector(selectApprovalState, (s) => s.loading);
export const selectSelected  = createSelector(selectApprovalState, (s) => s.selected);
export const selectActioning = createSelector(selectApprovalState, (s) => s.actioning);
export const selectError     = createSelector(selectApprovalState, (s) => s.error);

export const selectPendingHours = createSelector(
  selectQueue,
  (queue) => queue.reduce((sum, t) => sum + t.totalHours, 0),
);

export const selectSelectedCount = createSelector(
  selectSelected,
  (sel) => sel.size,
);

export const selectAllSelected = createSelector(
  selectQueue,
  selectSelected,
  (queue, sel) => queue.length > 0 && queue.every((t) => sel.has(t._id)),
);

export const selectIsActioning = (id: string) =>
  createSelector(selectActioning, (set) => set.has(id));

export const selectIsSelected = (id: string) =>
  createSelector(selectSelected, (set) => set.has(id));
