import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError, BadRequestError, NotFoundError } from './app-error.js';

test('AppError carries its status code and is operational', () => {
  const err = new AppError('boom', 503);
  assert.equal(err.statusCode, 503);
  assert.equal(err.isOperational, true);
  assert.equal(err.name, 'AppError');
});

test('NotFoundError defaults to 404', () => {
  const err = new NotFoundError();
  assert.equal(err.statusCode, 404);
  assert.ok(err instanceof AppError);
});

test('BadRequestError defaults to 400 and keeps optional details', () => {
  const err = new BadRequestError('nope', { field: 'id' });
  assert.equal(err.statusCode, 400);
  assert.deepEqual(err.details, { field: 'id' });
});
