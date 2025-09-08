import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEstateNotice } from './estate-notice-parser.js';

test('parseEstateNotice extracts executor contact info', () => {
  const text = 'Estate of John Doe. Executor: Jane Smith, Phone: 555-1234, Email: jane@example.com.';
  const result = parseEstateNotice(text);
  assert.deepEqual(result, {
    executor: 'Jane Smith',
    phone: '555-1234',
    email: 'jane@example.com'
  });
});
