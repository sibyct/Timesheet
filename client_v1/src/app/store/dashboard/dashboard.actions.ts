import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { DashboardStats } from '../../core/models/dashboard.models';

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    'Load':         emptyProps(),
    'Load Success': props<{ stats: DashboardStats }>(),
    'Load Failure': props<{ error: string }>(),
  },
});
