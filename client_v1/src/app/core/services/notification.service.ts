import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { UiActions } from '../../store/ui/ui.actions';
import type { NotificationType } from '../../store/ui/ui.state';

/**
 * Thin facade over the NgRx UI slice for dispatching notifications.
 * Use this in components and effects instead of dispatching UiActions directly.
 *
 * @example
 * this.notify.success('Timesheet submitted successfully.');
 * this.notify.error('Could not connect to server.');
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private store = inject(Store);

  success(message: string): void {
    this.dispatch(message, 'success');
  }

  error(message: string): void {
    this.dispatch(message, 'error');
  }

  warning(message: string): void {
    this.dispatch(message, 'warning');
  }

  info(message: string): void {
    this.dispatch(message, 'info');
  }

  clear(): void {
    this.store.dispatch(UiActions.clearNotification());
  }

  private dispatch(message: string, kind: NotificationType): void {
    this.store.dispatch(UiActions.showNotification({ message, kind }));
  }
}
