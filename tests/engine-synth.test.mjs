import test from 'node:test';
import assert from 'node:assert/strict';
import {EngineSynth,ENGINE_PRESETS} from '../public/tesla-sound/engine-core.js';

function capture(profile,rpm,load,options={}){
 const sr=48000,engine=new EngineSynth(sr);
 engine.setState({profile,active:true,rpm,load,character:.82,crackle:.6,whine:.7,...options});
 const frames=sr,chunk=256;
 let count=0,sum=0,peak=0,finite=true;
 const snippet=[];
 for(let i=0;i<frames;i+=chunk){
  const n=Math.min(chunk,frames-i);
  const a=new Float32Array(n),b=new Float32Array(n);
  engine.render(a,b);
  for(let j=0;j<n;j++){
   const v=(a[j]+b[j])*.5;
   finite=finite&&Number.isFinite(v);
   if(i>sr/5){sum+=v*v;count++}
   peak=Math.max(peak,Math.abs(a[j]),Math.abs(b[j]));
   if(i>sr/3&&snippet.length<768)snippet.push(v);
  }
 }
 return {rms:Math.sqrt(sum/count),peak,finite,snippet};
}
test('Every sound model produces a bounded non-silent live signal',()=>{
 for(const key of Object.keys(ENGINE_PRESETS)){
  const stats=capture(key,3800,.78);
  assert.ok(stats.finite,key+' must never produce NaN / infinite audio');
  assert.ok(stats.peak<=.431,key+' must be soft-clipped');
  assert.ok(stats.rms>.00008,key+' must emit audible nonzero signal; '+stats.rms);
 }
});
test('Distinct engine profiles yield distinct generated waveforms',()=>{
 const v8=capture('v8',4600,.85);
 const flat6=capture('flat6',4600,.85);
 const v12=capture('v12',4600,.85);
 const ev=capture('taycan',4600,.85);
 function difference(a,b){
  return Math.sqrt(a.snippet.reduce((sum,v,i)=>sum+(v-b.snippet[i])**2,0)/a.snippet.length);
 }
 assert.ok(difference(v8,flat6)>.001,'V8 and flat-six must not sound identical');
 assert.ok(difference(v12,ev)>.001,'V12 and electric must not sound identical');
});
test('Engine simulator responds to throttle and shut-off',()=>{
 const engine=new EngineSynth(48000);
 engine.setState({profile:'v8',active:true,rpm:900,load:.1});
 for(let i=0;i<32;i++)engine.render(new Float32Array(256),new Float32Array(256));
 engine.setState({rpm:6200,load:1,shift:'up'});
 for(let i=0;i<32;i++)engine.render(new Float32Array(256),new Float32Array(256));
 assert.ok(engine.rpm>900,'Engine RPM must rise dynamically');
 engine.setState({active:false,rpm:0,load:0});
 for(let i=0;i<128;i++)engine.render(new Float32Array(256),new Float32Array(256));
 assert.ok(engine.rpm<6200,'Audio must coast down when stopped');
});
