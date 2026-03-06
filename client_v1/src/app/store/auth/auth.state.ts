export interface AuthUser {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      string;
}

export interface AuthState {
  user:    AuthUser | null;
  token:   string | null;
  loading: boolean;
  error:   string | null;
}

export const initialAuthState: AuthState = {
  user:    null,
  token:   localStorage.getItem('timesheet_token'),
  loading: false,
  error:   null,
};
