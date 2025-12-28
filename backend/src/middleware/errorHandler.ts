import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export class AppError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode: number, error: string = 'Error') {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const error = err instanceof AppError ? err.error : 'Internal Server Error';

  const response: ErrorResponse = {
    error,
    message: err.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
  };

  console.error(`[${response.timestamp}] ${error}: ${err.message}`);

  res.status(statusCode).json(response);
};
