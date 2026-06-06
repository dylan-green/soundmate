import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, BadRequestError, NotFoundError } from '../errors/app-error.js';

/**
 * Catches requests that matched no route and converts them into a
 * NotFoundError, so they flow through the same handler as everything else.
 * Mount this AFTER all routes.
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
};

/**
 * The single place that turns a thrown error into an HTTP response.
 *
 * Express recognizes this as an error handler ONLY because it declares
 * four parameters (err, req, res, next). Mount it LAST.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // If a response was already partially sent, hand off to Express's default.
  if (res.headersSent) {
    return next(err);
  }

  // Expected, operational errors: trust their status + message.
  if (err instanceof AppError) {
    const body: { error: string; details?: unknown } = { error: err.message };
    if (err instanceof BadRequestError && err.details !== undefined) {
      body.details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Anything else is an unexpected bug: log it, hide details from the client.
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};
