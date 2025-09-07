import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from './errorHandler';

export function notFound(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path} not found`);
  next(error);
}