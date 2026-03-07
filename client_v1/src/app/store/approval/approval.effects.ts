import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  exhaustMap,
  map,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { TimesheetService } from '@core/services/timesheet.service';
import { UserService } from '@core/services/user.service';
import { UiActions } from '@core/store/ui/ui.actions';
import { ApprovalActions } from './approval.actions';
import { selectSelected } from './approval.selectors';

// ── Load queue ────────────────────────────────────────────────────────────────

export const loadQueueEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(ApprovalActions.loadQueue),
      switchMap(({ page = 1, limit = 20 }) =>
        svc
          .list({
            status: 'submitted',
            page,
            limit,
            sortBy: 'submittedAt',
            order: 'asc',
          })
          .pipe(
            map(({ data, meta }) =>
              ApprovalActions.loadQueueSuccess({ queue: data, meta }),
            ),
            catchError((err) =>
              of(
                ApprovalActions.loadQueueFailure({
                  error:
                    err?.error?.message ?? 'Failed to load approval queue.',
                }),
              ),
            ),
          ),
      ),
    ),
  { functional: true },
);

// ── Load users (name lookup, triggered after queue loads) ─────────────────────

export const loadUsersForQueueEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(UserService)) =>
    actions$.pipe(
      ofType(ApprovalActions.loadQueueSuccess),
      switchMap(() =>
        svc.list({ limit: 200, isActive: true }).pipe(
          map(({ data }) => {
            const userMap: Record<string, string> = {};
            for (const u of data) {
              userMap[u._id] = `${u.firstName} ${u.lastName}`.trim();
            }
            return ApprovalActions.loadUsersSuccess({ userMap });
          }),
          catchError(() =>
            of(ApprovalActions.loadUsersSuccess({ userMap: {} })),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ── Approve ───────────────────────────────────────────────────────────────────

export const approveEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(ApprovalActions.approve),
      exhaustMap(({ id }) =>
        svc.approve(id).pipe(
          map((timesheet) => ApprovalActions.approveSuccess({ timesheet })),
          catchError((err) =>
            of(
              ApprovalActions.approveFailure({
                id,
                error: err?.error?.message ?? 'Failed to approve timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const approveSuccessEffect = createEffect(
  (actions$ = inject(Actions), store = inject(Store)) =>
    actions$.pipe(
      ofType(ApprovalActions.approveSuccess),
      map(() =>
        UiActions.showNotification({
          message: 'Timesheet approved.',
          kind: 'success',
        }),
      ),
    ),
  { functional: true },
);

export const approveFailureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ApprovalActions.approveFailure),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);

// ── Reject ────────────────────────────────────────────────────────────────────

export const rejectEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(ApprovalActions.reject),
      exhaustMap(({ id, reason }) =>
        svc.reject(id, reason).pipe(
          map((timesheet) => ApprovalActions.rejectSuccess({ timesheet })),
          catchError((err) =>
            of(
              ApprovalActions.rejectFailure({
                id,
                error: err?.error?.message ?? 'Failed to reject timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const rejectSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ApprovalActions.rejectSuccess),
      map(() =>
        UiActions.showNotification({
          message: 'Timesheet rejected.',
          kind: 'warning',
        }),
      ),
    ),
  { functional: true },
);

export const rejectFailureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ApprovalActions.rejectFailure),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);

// ── Bulk approve ──────────────────────────────────────────────────────────────

export const bulkApproveEffect = createEffect(
  (
    actions$ = inject(Actions),
    svc = inject(TimesheetService),
    store = inject(Store),
  ) =>
    actions$.pipe(
      ofType(ApprovalActions.bulkApprove),
      withLatestFrom(store.select(selectSelected)),
      exhaustMap(([, selected]) =>
        svc.bulkApprove([...selected]).pipe(
          map(({ approved, skipped }) =>
            ApprovalActions.bulkApproveSuccess({ approved, skipped }),
          ),
          catchError((err) =>
            of(
              ApprovalActions.bulkApproveFailure({
                error: err?.error?.message ?? 'Bulk approve failed.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const bulkApproveSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ApprovalActions.bulkApproveSuccess),
      map(({ approved, skipped }) => {
        const msg = skipped.length
          ? `Approved ${approved.length}. Skipped ${skipped.length} (not in submitted status).`
          : `Approved ${approved.length} timesheet(s).`;
        return UiActions.showNotification({ message: msg, kind: 'success' });
      }),
    ),
  { functional: true },
);

export const bulkApproveFailureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ApprovalActions.bulkApproveFailure),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);
