import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ status: 'Not Found', path: req.path });
}

export function errorHandler(
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err instanceof AppError ? err.statusCode : (err.status ?? 500);
  if (statusCode >= 500) console.error(err.stack);
  res.status(statusCode).json({ status: err.message });
}
