import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectAuthState } from '../store/auth/auth.selectors';

export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthState).pipe(
    take(1),
    map(({ token, user }) => {
      if (token && user?.role === 'admin') return true;
      return router.createUrlTree(['/timesheet']);
    }),
  );
};
