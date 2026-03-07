import { InjectionToken } from '@angular/core';
import { APP_CONSTANTS } from './app.config';

export const APP_CONFIG = new InjectionToken<typeof APP_CONSTANTS>(
  'APP_CONFIG',
);
// export const LOGGER_CONFIG = new InjectionToken<LoggerConfig>('LOGGER_CONFIG');
// export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG');
// export const CACHE_CONFIG = new InjectionToken<CacheConfig>('CACHE_CONFIG');
// export const HTTP_CONFIG = new InjectionToken<HttpConfig>('HTTP_CONFIG');
