import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processEstateNotice, scoreExecutorContact } from './estate-sales.js';

const sample = 'Estate of John Doe. Executor: Jane Smith, Phone: 555-1234, Email: jane@example.com.';

test('processEstateNotice returns parsed contact with confidence score', () => {
  const result = processEstateNotice(sample);
  assert.equal(result.executor, 'Jane Smith');
  assert.equal(result.phone, '555-1234');
  assert.equal(result.email, 'jane@example.com');
  assert(result.confidence > 0.8);
});

test('scoreExecutorContact lowers confidence when info missing', () => {
  const score = scoreExecutorContact({ executor: null, phone: null, email: null });
  assert(score < 0.5);
});
