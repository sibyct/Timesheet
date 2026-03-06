import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { DashboardState } from './dashboard.state';

export const selectDashboardState = createFeatureSelector<DashboardState>('dashboard');

export const selectDashboardStats   = createSelector(selectDashboardState, (s) => s.stats);
export const selectDashboardLoading = createSelector(selectDashboardState, (s) => s.loading);
export const selectDashboardError   = createSelector(selectDashboardState, (s) => s.error);
