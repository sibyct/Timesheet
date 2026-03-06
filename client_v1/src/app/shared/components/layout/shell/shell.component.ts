import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, map, distinctUntilChanged, tap } from 'rxjs/operators';
import { UiActions } from '../../../../store/ui/ui.actions';
import {
  selectSidenavOpen,
  selectNotification,
} from '../../../../store/ui/ui.selectors';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, MatSidenavModule, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private store = inject(Store);
  private snackBar = inject(MatSnackBar);
  private bp = inject(BreakpointObserver);
  private destroyRef = inject(DestroyRef);

  readonly sidenavOpen = toSignal(this.store.select(selectSidenavOpen), {
    initialValue: true,
  });

  /** 'side' on desktop, 'over' on mobile */
  readonly sidenavMode = toSignal(
    this.bp
      .observe(Breakpoints.Handset)
      .pipe(map((r) => (r.matches ? 'over' : 'side') as 'side' | 'over')),
    { initialValue: 'side' as 'side' | 'over' },
  );

  ngOnInit(): void {
    // On mobile, collapse sidenav when breakpoint becomes handset
    this.bp
      .observe(Breakpoints.Handset)
      .pipe(
        filter((r) => r.matches),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.store.dispatch(UiActions.setSidenavOpen({ open: false }));
      });

    // Show Material snackbar whenever a notification appears in the store
    this.store
      .select(selectNotification)
      .pipe(
        filter(Boolean),
        distinctUntilChanged(
          (a, b) => a.message === b.message && a.kind === b.kind,
        ),
        tap((n) => {
          this.snackBar.open(n.message, 'Dismiss', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
            panelClass: [`snack--${n.kind}`],
          });
          setTimeout(
            () => this.store.dispatch(UiActions.clearNotification()),
            4100,
          );
        }, takeUntilDestroyed(this.destroyRef)),
      )
      .subscribe();
  }

  onBackdropClick(): void {
    this.store.dispatch(UiActions.setSidenavOpen({ open: false }));
  }
}
