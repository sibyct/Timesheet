import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../core/services/user.service';
import { ProjectActions } from '../../../../store/project/project.actions';
import {
  selectActiveProject,
  selectProjectSaving,
} from '../../../../store/project/project.selectors';
import type { Project } from '../../../../core/models/project.models';
import type { User } from '../../../../core/models/user.models';

export interface MembersDialogData {
  project: Project;
}

@Component({
  selector: 'app-members-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './members-dialog.component.html',
  styleUrl: './members-dialog.component.scss',
})
export class MembersDialogComponent implements OnInit {
  readonly data: MembersDialogData = inject(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<MembersDialogComponent>);
  private store = inject(Store);
  private userSvc = inject(UserService);

  // Live project from store (updated as members are added/removed)
  readonly project = toSignal(this.store.select(selectActiveProject), {
    initialValue: this.data.project,
  });
  readonly saving = toSignal(this.store.select(selectProjectSaving), {
    initialValue: false,
  });

  readonly allUsers = signal<User[]>([]);
  readonly searchQuery = signal<string>('');
  readonly loadingUsers = signal<boolean>(false);

  readonly memberIds = computed(() => new Set(this.project()?.members ?? []));

  readonly filteredUsers = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.allUsers().filter((u) =>
          `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q),
        )
      : this.allUsers();
  });

  ngOnInit(): void {
    // Set the current project as active so store updates sync back
    this.store.dispatch(
      ProjectActions.setActive({ project: this.data.project }),
    );
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loadingUsers.set(true);
    this.userSvc.list({ limit: 200, isActive: true }).subscribe({
      next: ({ data }) => {
        this.allUsers.set(data);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
  }

  isMember(userId: string): boolean {
    return this.memberIds().has(userId);
  }

  toggleMember(user: User): void {
    const projectId = this.project()!._id;
    if (this.isMember(user._id)) {
      this.store.dispatch(
        ProjectActions.removeMember({ projectId, userId: user._id }),
      );
    } else {
      this.store.dispatch(
        ProjectActions.addMember({ projectId, userId: user._id }),
      );
    }
  }

  initials(user: User): string {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }

  close(): void {
    this.store.dispatch(ProjectActions.clearActive());
    this.ref.close();
  }
}
