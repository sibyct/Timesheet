import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-timesheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">Admin Timesheet</div>
    <p style="color: var(--ts-text-muted)">Admin timesheet feature — coming soon.</p>
  `,
})
export class AdminTimesheetComponent {}
