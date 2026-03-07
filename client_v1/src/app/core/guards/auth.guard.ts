import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectIsLoggedIn } from '../store/auth/auth.selectors';
import { ROUTES } from '@core/constants/routes-path.constants';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsLoggedIn).pipe(
    take(1),
    map((loggedIn) => loggedIn || router.createUrlTree([`/${ROUTES.LOGIN}`])),
  );
};
