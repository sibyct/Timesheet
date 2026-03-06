import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor }        from './core/interceptors/auth.interceptor';
import { errorInterceptor }       from './core/interceptors/error.interceptor';
import { loggingInterceptor }     from './core/interceptors/logging.interceptor';
import { apiResponseInterceptor } from './core/interceptors/api-response.interceptor';
import { reducers, metaReducers } from './store';
import * as authEffects      from './store/auth/auth.effects';
import * as approvalEffects  from './store/approval/approval.effects';
import * as timesheetEffects from './store/timesheet/timesheet.effects';
import * as projectEffects   from './store/project/project.effects';
import * as userEffects      from './store/user/user.effects';
import * as reportEffects     from './store/report/report.effects';
import * as dashboardEffects  from './store/dashboard/dashboard.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([
      loggingInterceptor,       // 1st — measures total round-trip time
      authInterceptor,          // 2nd — attaches Bearer token
      apiResponseInterceptor,   // 3rd — unwraps { success, message, data } envelope
      errorInterceptor,         // 4th — catches errors after response
    ])),
    provideAnimationsAsync(),

    // NgRx
    provideStore(reducers, { metaReducers }),
    provideEffects(authEffects, approvalEffects, timesheetEffects, projectEffects, userEffects, reportEffects, dashboardEffects),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
    }),
  ],
};
