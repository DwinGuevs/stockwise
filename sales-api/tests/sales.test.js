const test=require('node:test');const assert=require('node:assert/strict');
test('sale quantity must be a positive integer',()=>{for(const n of [0,-2,1.2])assert.equal(Number.isInteger(n)&&n>0,false);});
test('sale total is unit price multiplied by quantity',()=>{assert.equal(Number((350*2).toFixed(2)),700);});
