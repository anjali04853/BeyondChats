import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  operation: string;
  error: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  statusCode: number;
  error: string;
  operation: string;

  constructor(
    message: string,
    statusCode: number,
    error: string = 'Error',
    operation: string = 'unknown'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.operation = operation;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized logging function
export const logError = (entry: LogEntry): void => {
  const logMessage = JSON.stringify({
    level: 'error',
    ...entry,
  });
  console.error(logMessage);
};

export const logInfo = (operation: string, message: string, details?: Record<string, unknown>): void => {
  const logMessage = JSON.stringify({
    level: 'info',
    timestamp: new Date().toISOString(),
    operation,
    message,
    details,
  });
  console.log(logMessage);
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const error = err instanceof AppError ? err.error : 'Internal Server Error';
  const operation = err instanceof AppError ? err.operation : req.method + ' ' + req.path;

  const response: ErrorResponse = {
    error,
    message: err.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
  };

  // Log the error with full details
  logError({
    timestamp: response.timestamp,
    operation,
    error: err.message,
    details: {
      statusCode,
      path: req.path,
      method: req.method,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });

  res.status(statusCode).json(response);
};
