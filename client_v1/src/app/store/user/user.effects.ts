import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { UiActions } from '../ui/ui.actions';
import { UserActions } from './user.actions';

// ── Load ──────────────────────────────────────────────────────────────────────

export const loadEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.load),
      switchMap(({ params }) =>
        svc.list(params ?? {}).pipe(
          map(({ data, meta }) => UserActions.loadSuccess({ users: data, meta })),
          catchError((err) => of(UserActions.loadFailure({
            error: err?.error?.message ?? 'Failed to load users.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

// ── Create ────────────────────────────────────────────────────────────────────

export const createEffect_ = createEffect(
  (actions$ = inject(Actions), svc = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.create),
      exhaustMap(({ payload }) =>
        svc.create(payload).pipe(
          map((user) => UserActions.createSuccess({ user })),
          catchError((err) => of(UserActions.createFailure({
            error: err?.error?.message ?? 'Failed to create user.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const createSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(UserActions.createSuccess),
      map(() => UiActions.showNotification({ message: 'User created.', kind: 'success' })),
    ),
  { functional: true },
);

// ── Update ────────────────────────────────────────────────────────────────────

export const updateEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.update),
      exhaustMap(({ id, payload }) =>
        svc.update(id, payload).pipe(
          map((user) => UserActions.updateSuccess({ user })),
          catchError((err) => of(UserActions.updateFailure({
            error: err?.error?.message ?? 'Failed to update user.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(UserActions.updateSuccess),
      map(() => UiActions.showNotification({ message: 'User updated.', kind: 'success' })),
    ),
  { functional: true },
);

// ── Deactivate ────────────────────────────────────────────────────────────────

export const deactivateEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(UserService)) =>
    actions$.pipe(
      ofType(UserActions.deactivate),
      exhaustMap(({ id }) =>
        svc.deactivate(id).pipe(
          map((user) => UserActions.deactivateSuccess({ user })),
          catchError((err) => of(UserActions.deactivateFailure({
            error: err?.error?.message ?? 'Failed to deactivate user.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const deactivateSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(UserActions.deactivateSuccess),
      map(() => UiActions.showNotification({ message: 'User deactivated.', kind: 'success' })),
    ),
  { functional: true },
);

// ── Failures ──────────────────────────────────────────────────────────────────

export const failureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(
        UserActions.loadFailure,
        UserActions.createFailure,
        UserActions.updateFailure,
        UserActions.deactivateFailure,
      ),
      map(({ error }) => UiActions.showNotification({ message: error, kind: 'error' })),
    ),
  { functional: true },
);
