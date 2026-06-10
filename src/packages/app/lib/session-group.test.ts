import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../errors/app-error.js';
import { assertGroupMember } from './session-group.js';

// assertGroupMember is the pure row-level-security check behind the optional
// ?userId= query param: a target id is addressable only if it's in the caller's
// blend roster. Kept pure (no Redis) so it's hermetically testable.

test('assertGroupMember allows a member of the group', () => {
  assert.doesNotThrow(() => assertGroupMember(['userA', 'userB'], 'userB'));
});

test('assertGroupMember rejects a non-member with a 403', () => {
  try {
    assertGroupMember(['userA', 'userB'], 'stranger');
    assert.fail('expected a 403 to be thrown');
  } catch (err) {
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 403);
  }
});

test('assertGroupMember rejects against an empty roster', () => {
  assert.throws(() => assertGroupMember([], 'userA'), AppError);
});
