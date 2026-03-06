import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { Project, CreateProjectPayload, UpdateProjectPayload, ListProjectsParams } from '../../core/models/project.models';
import type { PaginationMeta } from '../../core/models/api.models';

export const ProjectActions = createActionGroup({
  source: 'Project',
  events: {
    // ── List ──────────────────────────────────────────────────────────────────
    'Load':         props<{ params?: ListProjectsParams }>(),
    'Load Success': props<{ projects: Project[]; meta: PaginationMeta }>(),
    'Load Failure': props<{ error: string }>(),

    // ── Create ────────────────────────────────────────────────────────────────
    'Create':         props<{ payload: CreateProjectPayload }>(),
    'Create Success': props<{ project: Project }>(),
    'Create Failure': props<{ error: string }>(),

    // ── Update ────────────────────────────────────────────────────────────────
    'Update':         props<{ id: string; payload: UpdateProjectPayload }>(),
    'Update Success': props<{ project: Project }>(),
    'Update Failure': props<{ error: string }>(),

    // ── Delete ────────────────────────────────────────────────────────────────
    'Delete':         props<{ id: string }>(),
    'Delete Success': props<{ id: string }>(),
    'Delete Failure': props<{ error: string }>(),

    // ── Members ───────────────────────────────────────────────────────────────
    'Add Member':            props<{ projectId: string; userId: string }>(),
    'Add Member Success':    props<{ project: Project }>(),
    'Add Member Failure':    props<{ error: string }>(),
    'Remove Member':         props<{ projectId: string; userId: string }>(),
    'Remove Member Success': props<{ project: Project }>(),
    'Remove Member Failure': props<{ error: string }>(),

    // ── UI ────────────────────────────────────────────────────────────────────
    'Set Active':   props<{ project: Project | null }>(),
    'Clear Active': emptyProps(),
  },
});
