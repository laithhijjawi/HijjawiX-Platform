import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSlcanLine,validateProfile,decodeFrame,csvText} from '../public/ev-diagnostic/can-protocol.mjs';
const read=(x)=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
test('local EV lab is bilingual, explicitly read-only and linked from cloud UI',()=>{
 const html=read('public/ev-diagnostic/local.html');
 const js=read('public/ev-diagnostic/local.js');
 assert.ok(read('public/ev-diagnostic/index.html').includes('/ev-diagnostic/local.html'));
 for(const id of ['connect','disconnect','cells','framesBody','profileFile','language'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(js.includes("await writeCommand('L')"));
 assert.ok(!js.includes("writeCommand('O')"));
 assert.ok(js.includes('SIMULATED'));
 assert.ok(js.includes('Web Serial')||js.includes('serial'));
});
test('SLCAN classic standard/extended frames parse and reject malformed payload',()=>{
 let f=parseSlcanLine('t12321122');
 assert.equal(f.id,0x123);assert.deepEqual(f.data,[0x11,0x22]);
 f=parseSlcanLine('T1ABCDEF1280');
 assert.equal(f.id,0x1ABCDEF1);assert.equal(f.extended,true);assert.deepEqual(f.data,[0x80]);
 assert.equal(parseSlcanLine('t12331122'),null);
 assert.equal(parseSlcanLine('tFFF100'),null);
 assert.equal(parseSlcanLine('S6'),null);
 assert.equal(parseSlcanLine('t1231ZZ'),null);
});
test('read-only generic decoder works without guessing vehicle mappings',()=>{
 const profile=validateProfile({schema:'hxed-can-v1',name:'TEST FIXTURE ONLY',expectedCells:2,frames:[{id:'0x321',signals:[
 {key:'cell',cell:1,module:1,startByte:0,length:2,factor:0.001},
 {key:'cell',cell:2,module:1,startByte:2,length:2,factor:0.001},
 {key:'soc',startByte:4,length:1,factor:0.5}]}]});
 const frame=parseSlcanLine('t32158C0E940E6400');
 const signals=decodeFrame(frame,profile);
 assert.equal(signals[0].value,3.724);assert.equal(signals[1].value,3.732);assert.equal(signals[2].value,50);
 assert.throws(()=>validateProfile({...profile,frames:[{id:'0x321',signals:[{key:'danger',startByte:0,length:1}]}]}));
 assert.throws(()=>validateProfile({...profile,frames:[{id:'0x321',signals:[{key:'cell',cell:1,startByte:63,length:4}]}]}));
});
test('CSV data cannot execute spreadsheet formulas',()=>{
 assert.ok(csvText([['=HYPERLINK("bad")']]).startsWith('"'));
 assert.ok(csvText([['=1+2']]).includes("'=1+2"));
});
