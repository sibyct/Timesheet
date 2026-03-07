export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  message: string;
  kind:    NotificationType;
}

export interface UiState {
  /** Global full-page loading overlay (e.g. initial data fetch). */
  loading:      boolean;
  /** Inline operation loading (e.g. form submit spinner). */
  busy:         boolean;
  /** Transient snackbar / toast notification. */
  notification: Notification | null;
  /** Sidenav open state (for mobile responsive toggle). */
  sidenavOpen:  boolean;
}

export const initialUiState: UiState = {
  loading:      false,
  busy:         false,
  notification: null,
  sidenavOpen:  true,
};
