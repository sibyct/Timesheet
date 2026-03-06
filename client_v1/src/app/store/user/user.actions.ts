import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { User, CreateUserPayload, UpdateUserPayload, ListUsersParams } from '../../core/models/user.models';
import type { PaginationMeta } from '../../core/models/api.models';

export const UserActions = createActionGroup({
  source: 'User',
  events: {
    // ── List ──────────────────────────────────────────────────────────────────
    'Load':         props<{ params?: ListUsersParams }>(),
    'Load Success': props<{ users: User[]; meta: PaginationMeta }>(),
    'Load Failure': props<{ error: string }>(),

    // ── Create ────────────────────────────────────────────────────────────────
    'Create':         props<{ payload: CreateUserPayload }>(),
    'Create Success': props<{ user: User }>(),
    'Create Failure': props<{ error: string }>(),

    // ── Update ────────────────────────────────────────────────────────────────
    'Update':         props<{ id: string; payload: UpdateUserPayload }>(),
    'Update Success': props<{ user: User }>(),
    'Update Failure': props<{ error: string }>(),

    // ── Deactivate ────────────────────────────────────────────────────────────
    'Deactivate':         props<{ id: string }>(),
    'Deactivate Success': props<{ user: User }>(),
    'Deactivate Failure': props<{ error: string }>(),

    // ── UI ────────────────────────────────────────────────────────────────────
    'Set Active':   props<{ user: User | null }>(),
    'Clear Active': emptyProps(),
  },
});
