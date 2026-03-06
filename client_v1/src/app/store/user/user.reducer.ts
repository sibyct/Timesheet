import { createReducer, on } from '@ngrx/store';
import { initialUserState, type UserState } from './user.state';
import { UserActions } from './user.actions';

export const userReducer = createReducer<UserState>(
  initialUserState,

  on(UserActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(UserActions.loadSuccess, (state, { users, meta }) => ({
    ...state, loading: false, list: users, meta,
  })),
  on(UserActions.loadFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(UserActions.create, (state) => ({ ...state, saving: true, error: null })),
  on(UserActions.createSuccess, (state, { user }) => ({
    ...state, saving: false, list: [user, ...state.list],
  })),
  on(UserActions.createFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(UserActions.update, (state) => ({ ...state, saving: true, error: null })),
  on(UserActions.updateSuccess, (state, { user }) => ({
    ...state,
    saving: false,
    list:   state.list.map((u) => u._id === user._id ? user : u),
    active: state.active?._id === user._id ? user : state.active,
  })),
  on(UserActions.updateFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(UserActions.deactivate, (state) => ({ ...state, saving: true, error: null })),
  on(UserActions.deactivateSuccess, (state, { user }) => ({
    ...state,
    saving: false,
    list:   state.list.map((u) => u._id === user._id ? user : u),
    active: state.active?._id === user._id ? user : state.active,
  })),
  on(UserActions.deactivateFailure, (state, { error }) => ({ ...state, saving: false, error })),

  on(UserActions.setActive, (state, { user }) => ({ ...state, active: user })),
  on(UserActions.clearActive, (state) => ({ ...state, active: null })),
);
