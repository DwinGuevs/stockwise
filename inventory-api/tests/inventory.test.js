const test=require('node:test');const assert=require('node:assert/strict');
test('stock receipt requires positive integer',()=>{for(const n of [0,-1,1.5,NaN])assert.equal(Number.isInteger(n)&&n>0,false);});
test('positive integer stock receipt is accepted',()=>{assert.equal(Number.isInteger(12)&&12>0,true);});
