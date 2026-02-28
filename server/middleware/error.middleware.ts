import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ status: 'Not Found', path: req.path });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err.stack);
  res.status(500).json({ status: 'Internal Server Error', message: err.message });
}
