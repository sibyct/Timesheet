import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimesheetStatus, EntryStatus } from '../../../core/models/timesheet.models';

type AnyStatus = TimesheetStatus | EntryStatus;

interface BadgeConfig {
  label:   string;
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const STATUS_MAP: Record<AnyStatus, BadgeConfig> = {
  draft:     { label: 'Draft',     variant: 'neutral'  },
  submitted: { label: 'Submitted', variant: 'info'     },
  approved:  { label: 'Approved',  variant: 'success'  },
  rejected:  { label: 'Rejected',  variant: 'error'    },
};

@Component({
  selector:    'app-status-badge',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  readonly status = input.required<AnyStatus>();

  readonly config = computed<BadgeConfig>(
    () => STATUS_MAP[this.status()] ?? { label: this.status(), variant: 'neutral' },
  );
}
