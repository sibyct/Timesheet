import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReportService } from '../../core/services/report.service';
import { UiActions } from '@core/store/ui/ui.actions';
import { ReportActions } from './report.actions';

// ── Utilization ───────────────────────────────────────────────────────────────

export const loadUtilizationEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ReportService)) =>
    actions$.pipe(
      ofType(ReportActions.loadUtilization),
      exhaustMap(({ filters }) =>
        svc.getUtilization(filters).pipe(
          map((rows) => ReportActions.loadUtilizationSuccess({ rows })),
          catchError((err) =>
            of(
              ReportActions.loadUtilizationFailure({
                error:
                  err?.error?.message ?? 'Failed to load utilization report.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ── Billing ───────────────────────────────────────────────────────────────────

export const loadBillingEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ReportService)) =>
    actions$.pipe(
      ofType(ReportActions.loadBilling),
      exhaustMap(({ filters }) =>
        svc.getBilling(filters).pipe(
          map((rows) => ReportActions.loadBillingSuccess({ rows })),
          catchError((err) =>
            of(
              ReportActions.loadBillingFailure({
                error: err?.error?.message ?? 'Failed to load billing report.',
              }),
            ),
          ),
        ),
      ),
    ),
  { functional: true },
);

// ── Failures ──────────────────────────────────────────────────────────────────

export const failureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(
        ReportActions.loadUtilizationFailure,
        ReportActions.loadBillingFailure,
      ),
      map(({ error }) =>
        UiActions.showNotification({ message: error, kind: 'error' }),
      ),
    ),
  { functional: true },
);
