import assert from 'node:assert/strict';
import { basketSchema, refundSchema } from '../src/features/ordering/validation';

const id='10000000-0000-4000-8000-000000000001';
assert.equal(basketSchema.safeParse([{menuItemId:id,quantity:1}]).success,true);
assert.equal(basketSchema.safeParse([{menuItemId:id,quantity:0}]).success,false);
assert.equal(basketSchema.safeParse([{menuItemId:id,quantity:100}]).success,false);
assert.equal(basketSchema.safeParse([{menuItemId:id,quantity:1},{menuItemId:id,quantity:2}]).success,false);
assert.equal(refundSchema.safeParse({amountPence:1,reason:'Customer request'}).success,true);
assert.equal(refundSchema.safeParse({amountPence:0,reason:'No'}).success,false);
console.log('Payment validation tests passed.');
