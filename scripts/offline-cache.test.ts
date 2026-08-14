import assert from 'node:assert/strict';
import type { Query } from '@tanstack/react-query';
import {
  QUERY_CACHE_MAX_AGE,
  requireOnline,
  shouldPersistQuery,
  shouldRemoveForAccount,
} from '../src/lib/query/config';

const query = (status: 'success' | 'error', meta?: Record<string, unknown>) => ({
  state: { status },
  meta,
}) as unknown as Query;

assert.equal(QUERY_CACHE_MAX_AGE, 86_400_000, 'cache expiry must be exactly 24 hours');
assert.equal(shouldPersistQuery(query('success', { persist: true })), true);
assert.equal(shouldPersistQuery(query('error', { persist: true })), false);
assert.equal(shouldPersistQuery(query('success')), false);

assert.equal(shouldRemoveForAccount(query('success', { accountScoped: true, accountId: 'a' }), 'a'), false);
assert.equal(shouldRemoveForAccount(query('success', { accountScoped: true, accountId: 'a' }), 'b'), true);
assert.equal(shouldRemoveForAccount(query('success', { accountScoped: true, accountId: 'a' }), null), true);
assert.equal(shouldRemoveForAccount(query('success', { persist: true }), null), false);

assert.doesNotThrow(() => requireOnline(true));
assert.throws(() => requireOnline(false), /Connect to the internet/);

console.log('Offline cache policy tests passed.');
