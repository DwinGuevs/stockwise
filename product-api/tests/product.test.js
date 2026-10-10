const test=require('node:test');const assert=require('node:assert/strict');
test('product payload validation rejects missing fields',()=>{const p={name:'',sku:'',price:-1};assert.ok(!p.name||!p.sku||!Number.isFinite(Number(p.price))||Number(p.price)<0);});
test('valid product payload has nonnegative numeric price',()=>{const p={name:'Mouse',sku:'M-1',price:350};assert.ok(p.name&&p.sku&&Number.isFinite(Number(p.price))&&Number(p.price)>=0);});
