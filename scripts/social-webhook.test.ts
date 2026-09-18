import assert from 'node:assert/strict';

import { revokedExternalAccountIds } from '../supabase/functions/meta-webhook/events';

assert.deepEqual(
  revokedExternalAccountIds({
    object: 'page',
    entry: [{ id: 'page-1', changes: [{ field: 'feed', value: { item: 'post' } }] }],
  }),
  [],
  'routine Page events must not revoke a connection',
);

assert.deepEqual(
  revokedExternalAccountIds({
    object: 'instagram',
    entry: [{ id: 'ig-1', changes: [{ field: 'comments', value: { text: 'Hello' } }] }],
  }),
  [],
  'routine Instagram events must not revoke a connection',
);

assert.deepEqual(
  revokedExternalAccountIds({
    object: 'page',
    entry: [{ id: 'page-1', changes: [{ field: 'permissions', value: { verb: 'add' } }] }],
  }),
  [],
  'permission grants must not revoke a connection',
);

assert.deepEqual(
  revokedExternalAccountIds({
    object: 'page',
    entry: [
      {
        id: 'page-1',
        changes: [{ field: 'permissions', value: { verb: 'remove', user_id: 'user-1' } }],
      },
    ],
  }),
  ['page-1'],
  'permission removal must revoke only the affected external account',
);

assert.deepEqual(
  revokedExternalAccountIds({
    object: 'instagram',
    entry: [{ id: 123, changes: [{ field: 'deauthorization', value: {} }] }],
  }),
  ['123'],
  'explicit deauthorization must revoke the affected external account',
);

console.log('Social webhook tests passed.');
