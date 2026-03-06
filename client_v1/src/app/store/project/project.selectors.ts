import { createFeatureSelector, createSelector } from '@ngrx/store';
import type { ProjectState } from './project.state';

export const selectProjectState   = createFeatureSelector<ProjectState>('project');

export const selectProjectList    = createSelector(selectProjectState, (s) => s.list);
export const selectProjectMeta    = createSelector(selectProjectState, (s) => s.meta);
export const selectActiveProject  = createSelector(selectProjectState, (s) => s.active);
export const selectProjectLoading = createSelector(selectProjectState, (s) => s.loading);
export const selectProjectSaving  = createSelector(selectProjectState, (s) => s.saving);
export const selectProjectError   = createSelector(selectProjectState, (s) => s.error);

export const selectProjectCount = createSelector(
  selectProjectList,
  (list) => list.length,
);
