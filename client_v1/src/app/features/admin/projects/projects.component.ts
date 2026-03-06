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
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { ProjectActions } from '../../../store/project/project.actions';
import {
  selectProjectList,
  selectProjectMeta,
  selectProjectLoading,
  selectProjectSaving,
} from '../../../store/project/project.selectors';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProjectFormDialogComponent } from './project-form-dialog/project-form-dialog.component';
import type { ProjectFormDialogData, ProjectFormDialogResult } from './project-form-dialog/project-form-dialog.component';
import { MembersDialogComponent } from './members-dialog/members-dialog.component';
import type { MembersDialogData } from './members-dialog/members-dialog.component';
import type { Project, ProjectStatus, CreateProjectPayload, UpdateProjectPayload } from '../../../core/models/project.models';

const PROJECT_STATUSES: ProjectStatus[] = ['active', 'on_hold', 'completed', 'archived'];

@Component({
  selector:    'app-projects',
  standalone:  true,
  imports:     [
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
  templateUrl: './projects.component.html',
  styleUrl:    './projects.component.scss',
})
export class ProjectsComponent implements OnInit {
  private store  = inject(Store);
  private dialog = inject(MatDialog);

  readonly displayedColumns = ['code', 'name', 'status', 'members', 'budget', 'dates', 'actions'];

  readonly projects = toSignal(this.store.select(selectProjectList),    { initialValue: [] as Project[] });
  readonly meta     = toSignal(this.store.select(selectProjectMeta),    { initialValue: null });
  readonly loading  = toSignal(this.store.select(selectProjectLoading), { initialValue: false });
  readonly saving   = toSignal(this.store.select(selectProjectSaving),  { initialValue: false });

  readonly statuses = PROJECT_STATUSES;

  readonly searchValue  = signal<string>('');
  readonly statusFilter = signal<ProjectStatus | ''>('');

  private page  = 1;
  private limit = 20;
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.loadProjects();
    });
    this.loadProjects();
  }

  private loadProjects(): void {
    this.store.dispatch(ProjectActions.load({
      params: {
        page:   this.page,
        limit:  this.limit,
        status: this.statusFilter() || undefined,
        search: this.searchValue()  || undefined,
        isActive: true,
        sortBy: 'name',
        order:  'asc',
      },
    }));
  }

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.search$.next(value);
  }

  onStatusChange(): void {
    this.page = 1;
    this.loadProjects();
  }

  onPage(event: PageEvent): void {
    this.page  = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.loadProjects();
  }

  // ── Create ────────────────────────────────────────────────────────────────

  openCreate(): void {
    const ref = this.dialog.open<ProjectFormDialogComponent, ProjectFormDialogData, ProjectFormDialogResult>(
      ProjectFormDialogComponent,
      { data: {}, width: '560px' },
    );
    ref.afterClosed().pipe(take(1), filter(Boolean)).subscribe((payload) => {
      this.store.dispatch(ProjectActions.create({ payload: payload as CreateProjectPayload }));
    });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  openEdit(project: Project): void {
    const ref = this.dialog.open<ProjectFormDialogComponent, ProjectFormDialogData, ProjectFormDialogResult>(
      ProjectFormDialogComponent,
      { data: { project }, width: '560px' },
    );
    ref.afterClosed().pipe(take(1), filter(Boolean)).subscribe((payload) => {
      this.store.dispatch(ProjectActions.update({
        id:      project._id,
        payload: payload as UpdateProjectPayload,
      }));
    });
  }

  // ── Members ───────────────────────────────────────────────────────────────

  openMembers(project: Project): void {
    this.dialog.open<MembersDialogComponent, MembersDialogData>(
      MembersDialogComponent,
      { data: { project }, width: '480px', disableClose: false },
    );
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  confirmDelete(project: Project): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title:        'Delete Project',
          message:      `Delete "${project.name}" (${project.code})? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger:       true,
        },
        width: '420px',
      },
    );
    ref.afterClosed().pipe(take(1), filter(Boolean)).subscribe(() => {
      this.store.dispatch(ProjectActions.delete({ id: project._id }));
    });
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }

  formatBudget(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  }
}
