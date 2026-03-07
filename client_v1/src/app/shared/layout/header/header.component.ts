import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthActions } from '../../../../store/auth/auth.actions';
import { UiActions } from '../../../../store/ui/ui.actions';
import {
  selectUserInitials,
  selectUserFullName,
  selectAuthUser,
} from '../../../../store/auth/auth.selectors';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private store = inject(Store);

  readonly initials = toSignal(this.store.select(selectUserInitials), { initialValue: '' });
  readonly fullName = toSignal(this.store.select(selectUserFullName), { initialValue: '' });
  readonly user     = toSignal(this.store.select(selectAuthUser),     { initialValue: null });

  toggleSidenav(): void {
    this.store.dispatch(UiActions.toggleSidenav());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
