import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NotificationType } from './ui.state';

export const UiActions = createActionGroup({
  source: 'UI',
  events: {
    // Global loading overlay
    'Show Loading': emptyProps(),
    'Hide Loading': emptyProps(),

    // Inline busy state (form submit, etc.)
    'Set Busy': props<{ busy: boolean }>(),

    // Notifications / toasts
    'Show Notification': props<{ message: string; kind: NotificationType }>(),
    'Clear Notification': emptyProps(),

    // Sidenav
    'Toggle Sidenav': emptyProps(),
    'Set Sidenav Open': props<{ open: boolean }>(),
  },
});
