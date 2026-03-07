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
import { TimesheetService } from '../../core/services/timesheet.service';
import { UiActions } from '@core/store/ui/ui.actions';
import { TimesheetActions } from './timesheet.actions';
import { selectActiveTimesheet } from './timesheet.selectors';

// ── Load list ─────────────────────────────────────────────────────────────────

export const loadMyTimesheetsEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(TimesheetActions.loadMyTimesheets),
      switchMap(() =>
        svc.list({ limit: 52, sortBy: 'periodStart', order: 'desc' }).pipe(
          map(({ data }) =>
            TimesheetActions.loadMyTimesheetsSuccess({ timesheets: data }),
          ),
          catchError((err) =>
            of(
              TimesheetActions.loadMyTimesheetsFailure({
                error: err?.error?.message ?? 'Failed to load timesheets.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ── Load for week ─────────────────────────────────────────────────────────────

export const loadForWeekEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(TimesheetActions.loadForWeek),
      switchMap(({ periodStart }) =>
        svc.list({ limit: 1, sortBy: 'periodStart', order: 'desc' }).pipe(
          map(({ data }) => {
            const match =
              data.find((t) => t.periodStart.slice(0, 10) === periodStart) ??
              null;
            return TimesheetActions.loadForWeekSuccess({ timesheet: match });
          }),
          catchError((err) =>
            of(
              TimesheetActions.loadForWeekFailure({
                error: err?.error?.message ?? 'Failed to load timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ── Create ────────────────────────────────────────────────────────────────────

export const createEffect_ = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(TimesheetActions.create),
      exhaustMap(({ payload }) =>
        svc.create(payload).pipe(
          map((timesheet) => TimesheetActions.createSuccess({ timesheet })),
          catchError((err) =>
            of(
              TimesheetActions.createFailure({
                error: err?.error?.message ?? 'Failed to create timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const createSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(TimesheetActions.createSuccess),
      map(() =>
        UiActions.showNotification({
          message: 'Timesheet created.',
          kind: 'success',
        }),
      ),
    ),
  { functional: true },
);

// ── Save entries ──────────────────────────────────────────────────────────────

export const saveEntriesEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(TimesheetActions.saveEntries),
      exhaustMap(({ id, entries, notes }) =>
        svc.update(id, { entries, notes }).pipe(
          map((timesheet) =>
            TimesheetActions.saveEntriesSuccess({ timesheet }),
          ),
          catchError((err) =>
            of(
              TimesheetActions.saveEntriesFailure({
                error: err?.error?.message ?? 'Failed to save entries.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const saveEntriesSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(TimesheetActions.saveEntriesSuccess),
      map(() =>
        UiActions.showNotification({
          message: 'Changes saved.',
          kind: 'success',
        }),
      ),
    ),
  { functional: true },
);

export const saveEntriesFailureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(
        TimesheetActions.saveEntriesFailure,
        TimesheetActions.createFailure,
      ),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);

// ── Submit ────────────────────────────────────────────────────────────────────

export const submitEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(TimesheetActions.submit),
      exhaustMap(({ id }) =>
        svc.submit(id).pipe(
          map((timesheet) => TimesheetActions.submitSuccess({ timesheet })),
          catchError((err) =>
            of(
              TimesheetActions.submitFailure({
                error: err?.error?.message ?? 'Failed to submit timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const submitSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(TimesheetActions.submitSuccess),
      map(() =>
        UiActions.showNotification({
          message: 'Timesheet submitted for approval.',
          kind: 'success',
        }),
      ),
    ),
  { functional: true },
);

export const submitFailureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(TimesheetActions.submitFailure),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);

// ── Recall ────────────────────────────────────────────────────────────────────

export const recallEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(TimesheetService)) =>
    actions$.pipe(
      ofType(TimesheetActions.recall),
      exhaustMap(({ id }) =>
        svc.recall(id).pipe(
          map((timesheet) => TimesheetActions.recallSuccess({ timesheet })),
          catchError((err) =>
            of(
              TimesheetActions.recallFailure({
                error: err?.error?.message ?? 'Failed to recall timesheet.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

export const recallSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(TimesheetActions.recallSuccess),
      map(() =>
        UiActions.showNotification({
          message: 'Timesheet recalled to draft.',
          kind: 'info',
        }),
      ),
    ),
  { functional: true },
);

export const recallFailureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(TimesheetActions.recallFailure),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);
