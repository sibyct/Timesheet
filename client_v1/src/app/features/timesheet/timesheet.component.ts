import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-title">My Timesheet</div>
    <p style="color: var(--ts-text-muted)">Timesheet feature — coming soon.</p>
  `,
})
export class TimesheetComponent {}
