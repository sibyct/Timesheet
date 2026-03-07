import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { selectIsAdmin } from '../../../../store/auth/auth.selectors';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private store = inject(Store);

  readonly isAdmin = toSignal(this.store.select(selectIsAdmin), { initialValue: false });

  readonly navItems: NavItem[] = [
    { label: 'Timesheet', icon: 'schedule',       route: '/timesheet' },
    { label: 'Profile',   icon: 'person_outline',  route: '/profile'   },
  ];

  readonly adminNavItems: NavItem[] = [
    { label: 'Dashboard',       icon: 'dashboard',             route: '/admin/dashboard'  },
    { label: 'Users',           icon: 'manage_accounts',      route: '/admin/users'      },
    { label: 'Projects',        icon: 'folder_open',           route: '/admin/projects'   },
    { label: 'Approvals',       icon: 'pending_actions',       route: '/admin/approvals'  },
    { label: 'Admin Timesheet', icon: 'admin_panel_settings',  route: '/admin/timesheet'  },
    { label: 'Reports',         icon: 'bar_chart',             route: '/admin/reports'    },
  ];
}
