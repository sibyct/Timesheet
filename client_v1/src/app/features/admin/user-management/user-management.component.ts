import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">User Management</div>
    <p style="color: var(--ts-text-muted)">User management feature — coming soon.</p>
  `,
})
export class UserManagementComponent {}
