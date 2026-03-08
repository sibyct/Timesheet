import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthUser } from './auth.state';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // Login flow
    Login: props<{ username: string; password: string }>(),
    'Login Success': props<{ token: string; user: AuthUser }>(),
    'Login Failure': props<{ error: string }>(),

    // Logout
    Logout: emptyProps(),

    // Token refresh (bootstrap from localStorage)
    'Restore Session': props<{ token: string }>(),

    // Silent token refresh (triggered by auth interceptor on 401)
    'Refresh Token Success': props<{ token: string }>(),
    'Refresh Token Failure': emptyProps(),

    // Clear transient error
    'Clear Error': emptyProps(),
  },
});
