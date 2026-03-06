import type { DashboardStats } from '../../core/models/dashboard.models';

export interface DashboardState {
  stats:   DashboardStats | null;
  loading: boolean;
  error:   string | null;
}

export const initialDashboardState: DashboardState = {
  stats:   null,
  loading: false,
  error:   null,
};
