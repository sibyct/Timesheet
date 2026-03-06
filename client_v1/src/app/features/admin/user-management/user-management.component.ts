import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  take,
} from 'rxjs/operators';
import { Subject } from 'rxjs';

import { UserActions } from '../../../store/user/user.actions';
import {
  selectUserList,
  selectUserMeta,
  selectUserLoading,
  selectUserSaving,
} from '../../../store/user/user.selectors';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserFormDialogComponent } from './user-form-dialog/user-form-dialog.component';
import type {
  UserFormDialogData,
  UserFormDialogResult,
} from './user-form-dialog/user-form-dialog.component';
import type {
  User,
  UserRole,
  CreateUserPayload,
  UpdateUserPayload,
} from '../../../core/models/user.models';

const USER_ROLES: UserRole[] = ['employee', 'manager', 'admin'];

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatPaginatorModule,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  private store = inject(Store);
  private dialog = inject(MatDialog);

  readonly displayedColumns = [
    'avatar',
    'name',
    'email',
    'role',
    'department',
    'rate',
    'status',
    'lastLogin',
    'actions',
  ];

  readonly users = toSignal(this.store.select(selectUserList), {
    initialValue: [] as User[],
  });
  readonly meta = toSignal(this.store.select(selectUserMeta), {
    initialValue: null,
  });
  readonly loading = toSignal(this.store.select(selectUserLoading), {
    initialValue: false,
  });
  readonly saving = toSignal(this.store.select(selectUserSaving), {
    initialValue: false,
  });

  readonly roles = USER_ROLES;

  readonly searchValue = signal<string>('');
  readonly roleFilter = signal<UserRole | ''>('');

  private page = 1;
  private limit = 20;
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page = 1;
        this.loadUsers();
      });
    this.loadUsers();
  }

  private loadUsers(): void {
    this.store.dispatch(
      UserActions.load({
        params: {
          page: this.page,
          limit: this.limit,
          role: this.roleFilter() || undefined,
          search: this.searchValue() || undefined,
          sortBy: 'lastName',
          order: 'asc',
        },
      }),
    );
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.search$.next(value);
  }

  onRoleChange(): void {
    this.page = 1;
    this.loadUsers();
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadUsers();
  }

  // ── Create ────────────────────────────────────────────────────────────────

  openCreate(): void {
    const ref = this.dialog.open<
      UserFormDialogComponent,
      UserFormDialogData,
      UserFormDialogResult
    >(UserFormDialogComponent, { data: {}, width: '560px' });
    ref
      .afterClosed()
      .pipe(take(1), filter(Boolean))
      .subscribe((payload) => {
        this.store.dispatch(
          UserActions.create({ payload: payload as CreateUserPayload }),
        );
      });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  openEdit(user: User): void {
    const ref = this.dialog.open<
      UserFormDialogComponent,
      UserFormDialogData,
      UserFormDialogResult
    >(UserFormDialogComponent, { data: { user }, width: '560px' });
    ref
      .afterClosed()
      .pipe(take(1), filter(Boolean))
      .subscribe((payload) => {
        this.store.dispatch(
          UserActions.update({
            id: user._id,
            payload: payload as UpdateUserPayload,
          }),
        );
      });
  }

  // ── Deactivate ────────────────────────────────────────────────────────────

  confirmDeactivate(user: User): void {
    const ref = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, {
      data: {
        title: 'Deactivate User',
        message: `Deactivate ${user.firstName} ${user.lastName}? They will no longer be able to log in.`,
        confirmLabel: 'Deactivate',
        danger: true,
      },
      width: '420px',
    });
    ref
      .afterClosed()
      .pipe(take(1), filter(Boolean))
      .subscribe(() => {
        this.store.dispatch(UserActions.deactivate({ id: user._id }));
      });
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  initials(user: User): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  formatRole(role: UserRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  formatDate(iso: string | null): string {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  }

  formatRate(n: number): string {
    return (
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(n) + '/h'
    );
  }
}
