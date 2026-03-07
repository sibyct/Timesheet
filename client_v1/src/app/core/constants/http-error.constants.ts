// http-error.config.ts
export const HTTP_ERRORS = {
  400: 'Bad request — please check your input',
  401: 'Session expired — please login again',
  403: 'You do not have permission to do this',
  404: 'The requested resource was not found',
  408: 'Request timed out — please try again',
  429: 'Too many requests — please slow down',
  500: 'Server error — please try again later',
  502: 'Service unavailable — please try again',
  503: 'Service under maintenance',
  504: 'Gateway timeout — please try again',
} as const;
