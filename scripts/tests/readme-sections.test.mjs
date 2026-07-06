import assert from 'node:assert/strict';
import { replaceBetweenMarkers } from '../lib/readmeSections.mjs';

const input = 'a\n<!-- START: X -->\nold\n<!-- END: X -->\nz';
assert.equal(
  replaceBetweenMarkers(
    input,
    '<!-- START: X -->',
    '<!-- END: X -->',
    '<!-- START: X -->\nnew\n<!-- END: X -->'
  ),
  'a\n<!-- START: X -->\nnew\n<!-- END: X -->\nz'
);
assert.throws(
  () => replaceBetweenMarkers(input, '<!-- START: Y -->', '<!-- END: Y -->', 'nope'),
  /missing or out of order/
);
console.log('✓ readme section marker replacement tests passed');
