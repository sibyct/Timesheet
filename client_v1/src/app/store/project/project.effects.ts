import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProjectService } from '../../core/services/project.service';
import { UiActions } from '../ui/ui.actions';
import { ProjectActions } from './project.actions';

// ── Load ──────────────────────────────────────────────────────────────────────

export const loadEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.load),
      switchMap(({ params }) =>
        svc.list(params ?? {}).pipe(
          map(({ data, meta }) => ProjectActions.loadSuccess({ projects: data, meta })),
          catchError((err) => of(ProjectActions.loadFailure({
            error: err?.error?.message ?? 'Failed to load projects.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

// ── Create ────────────────────────────────────────────────────────────────────

export const createEffect_ = createEffect(
  (actions$ = inject(Actions), svc = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.create),
      exhaustMap(({ payload }) =>
        svc.create(payload).pipe(
          map((project) => ProjectActions.createSuccess({ project })),
          catchError((err) => of(ProjectActions.createFailure({
            error: err?.error?.message ?? 'Failed to create project.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const createSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ProjectActions.createSuccess),
      map(() => UiActions.showNotification({ message: 'Project created.', kind: 'success' })),
    ),
  { functional: true },
);

// ── Update ────────────────────────────────────────────────────────────────────

export const updateEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.update),
      exhaustMap(({ id, payload }) =>
        svc.update(id, payload).pipe(
          map((project) => ProjectActions.updateSuccess({ project })),
          catchError((err) => of(ProjectActions.updateFailure({
            error: err?.error?.message ?? 'Failed to update project.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const updateSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ProjectActions.updateSuccess),
      map(() => UiActions.showNotification({ message: 'Project updated.', kind: 'success' })),
    ),
  { functional: true },
);

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.delete),
      exhaustMap(({ id }) =>
        svc.delete(id).pipe(
          map(() => ProjectActions.deleteSuccess({ id })),
          catchError((err) => of(ProjectActions.deleteFailure({
            error: err?.error?.message ?? 'Failed to delete project.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const deleteSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ProjectActions.deleteSuccess),
      map(() => UiActions.showNotification({ message: 'Project deleted.', kind: 'success' })),
    ),
  { functional: true },
);

// ── Members ───────────────────────────────────────────────────────────────────

export const addMemberEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.addMember),
      exhaustMap(({ projectId, userId }) =>
        svc.addMember(projectId, userId).pipe(
          map((project) => ProjectActions.addMemberSuccess({ project })),
          catchError((err) => of(ProjectActions.addMemberFailure({
            error: err?.error?.message ?? 'Failed to add member.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const removeMemberEffect = createEffect(
  (actions$ = inject(Actions), svc = inject(ProjectService)) =>
    actions$.pipe(
      ofType(ProjectActions.removeMember),
      exhaustMap(({ projectId, userId }) =>
        svc.removeMember(projectId, userId).pipe(
          map((project) => ProjectActions.removeMemberSuccess({ project })),
          catchError((err) => of(ProjectActions.removeMemberFailure({
            error: err?.error?.message ?? 'Failed to remove member.',
          }))),
        ),
      ),
    ),
  { functional: true },
);

export const memberSuccessEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(ProjectActions.addMemberSuccess, ProjectActions.removeMemberSuccess),
      map(({ project }) =>
        UiActions.showNotification({
          message: `Members updated for "${project.name}".`,
          kind: 'success',
        }),
      ),
    ),
  { functional: true },
);

// ── Failures ──────────────────────────────────────────────────────────────────

export const failureEffect = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(
        ProjectActions.loadFailure,
        ProjectActions.createFailure,
        ProjectActions.updateFailure,
        ProjectActions.deleteFailure,
        ProjectActions.addMemberFailure,
        ProjectActions.removeMemberFailure,
      ),
      map(({ error }) => UiActions.showNotification({ message: error, kind: 'error' })),
    ),
  { functional: true },
);
