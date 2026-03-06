import { createReducer, on } from '@ngrx/store';
import { initialProjectState, type ProjectState } from './project.state';
import { ProjectActions } from './project.actions';

export const projectReducer = createReducer<ProjectState>(
  initialProjectState,

  on(ProjectActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(ProjectActions.loadSuccess, (state, { projects, meta }) => ({
    ...state, loading: false, list: projects, meta,
  })),
  on(ProjectActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(ProjectActions.create, (state) => ({ ...state, saving: true, error: null })),
  on(ProjectActions.createSuccess, (state, { project }) => ({
    ...state, saving: false, list: [project, ...state.list],
  })),
  on(ProjectActions.createFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(ProjectActions.update, (state) => ({ ...state, saving: true, error: null })),
  on(ProjectActions.updateSuccess, (state, { project }) => ({
    ...state,
    saving: false,
    list:   state.list.map((p) => p._id === project._id ? project : p),
    active: state.active?._id === project._id ? project : state.active,
  })),
  on(ProjectActions.updateFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(ProjectActions.delete, (state) => ({ ...state, saving: true, error: null })),
  on(ProjectActions.deleteSuccess, (state, { id }) => ({
    ...state,
    saving:  false,
    list:    state.list.filter((p) => p._id !== id),
    active:  state.active?._id === id ? null : state.active,
  })),
  on(ProjectActions.deleteFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(ProjectActions.addMember, (state) => ({ ...state, saving: true, error: null })),
  on(ProjectActions.addMemberSuccess, (state, { project }) => ({
    ...state,
    saving: false,
    list:   state.list.map((p) => p._id === project._id ? project : p),
    active: state.active?._id === project._id ? project : state.active,
  })),
  on(ProjectActions.addMemberFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(ProjectActions.removeMember, (state) => ({ ...state, saving: true, error: null })),
  on(ProjectActions.removeMemberSuccess, (state, { project }) => ({
    ...state,
    saving: false,
    list:   state.list.map((p) => p._id === project._id ? project : p),
    active: state.active?._id === project._id ? project : state.active,
  })),
  on(ProjectActions.removeMemberFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(ProjectActions.setActive, (state, { project }) => ({ ...state, active: project })),
  on(ProjectActions.clearActive, (state) => ({ ...state, active: null })),
);
