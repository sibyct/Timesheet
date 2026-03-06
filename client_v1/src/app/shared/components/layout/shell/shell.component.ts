import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../../core/services/auth.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    HeaderComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  auth = inject(AuthService);

  get isAdmin(): boolean {
    return this.auth.role === 0;
  }

  navItems = [
    { label: 'Timesheet', icon: 'schedule', route: '/timesheet' },
    { label: 'Profile', icon: 'person_outline', route: '/profile' },
  ];

  adminNavItems = [
    { label: 'Users', icon: 'manage_accounts', route: '/admin/users' },
    {
      label: 'Admin Timesheet',
      icon: 'admin_panel_settings',
      route: '/admin/timesheet',
    },
  ];
}
