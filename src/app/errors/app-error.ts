/**
 * Base class for all *expected* (operational) errors in the app.
 *
 * Carrying `statusCode` on the error itself is the trick that lets the
 * centralized error handler turn any thrown error into the right HTTP
 * response without the controller having to know about `res`.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes "expected" errors from bugs
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** 404 — a resource was requested that doesn't exist. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/** 400 — the client sent something invalid. May carry structured `details`. */
export class BadRequestError extends AppError {
  readonly details?: unknown;

  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400);
    if (details !== undefined) {
      this.details = details;
    }
  }
}
