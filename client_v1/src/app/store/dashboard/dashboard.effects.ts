import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { DashboardService } from '../../core/services/dashboard.service';
import { UiActions } from '../ui/ui.actions';
import { DashboardActions } from './dashboard.actions';

export const loadEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(DashboardService)) =>
    actions$.pipe(
      ofType(DashboardActions.load),
      exhaustMap(() =>
        svc.getStats().pipe(
          map((stats) => DashboardActions.loadSuccess({ stats })),
          catchError((err) => of(DashboardActions.loadFailure({
            error: err?.error?.message ?? 'Failed to load dashboard.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const failureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(DashboardActions.loadFailure),
      map(({ error }) => UiActions.showNotification({ message: error, kind: 'error' })),
    ),
  { functional: true },
);
