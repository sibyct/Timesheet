// core/interceptors/base-url.interceptor.ts
import { inject, isDevMode } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { ENVIRONMENT } from '@core/config/app.tokens';
import { LoggerService } from '@core/services/logger.service';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(ENVIRONMENT);
  const logger = inject(LoggerService).withContext('BaseUrlInterceptor');

  // ✅ Pass through absolute URLs unchanged
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  // ✅ Clean slash handling — no double slashes
  const base = env.baseUrl.endsWith('/')
    ? env.baseUrl.slice(0, -1)
    : env.baseUrl;

  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;

  const apiReq = req.clone({ url: `${base}${path}` });

  // ✅ Dev visibility
  if (isDevMode()) {
    logger.debug('Base URL applied', {
      original: req.url,
      resolved: apiReq.url,
    });
  }

  return next(apiReq);
};
