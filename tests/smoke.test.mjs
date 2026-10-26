import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = file => readFileSync(new URL('../'+file, import.meta.url),'utf8');
test('Portal has all required static assets', () => {
  for (const file of ['public/index.html','public/styles.css','public/app.js','public/logo.svg']) {
    assert.equal(existsSync(new URL('../'+file, import.meta.url)), true, file);
  }
});
test('Portal links match provided static assets', () => {
  const html=read('public/index.html');
  for(const asset of ['/styles.css','/app.js','/logo.svg']) assert.ok(html.includes(asset),asset);
  assert.ok(html.includes('lang="ar"'));
  assert.ok(html.includes('id="categoryGrid"'));
});
test('Portal contains two public apps, seven categories and bilingual UI', () => {
  const app=read('public/app.js');
  for(const appName of ['ayahlak.hijjawix.com','fold-and-fire-online']) assert.ok(app.includes(appName),appName);
  for(const category of ['islamic','engineering','math','entertainment','education','utilities','health']) assert.ok(app.includes("id:'"+category+"'"),category);
  assert.ok(app.includes("ar:{navHome:"));
  assert.ok(app.includes("en:{navHome:"));
});
test('Cloudflare worker is separate and static-only', () => {
  const config=JSON.parse(read('wrangler.jsonc'));
  assert.equal(config.name,'hijjawix-platform');
  assert.equal(config.assets.directory,'./public');
  assert.equal(config.main,undefined);
  assert.equal(config.routes,undefined); // bind domain after first deploy from dashboard
});

test('Mobile category routes replace popups', () => {
 const html=read('public/index.html');
 const js=read('public/app.js');
 const css=read('public/styles.css');
 assert.ok(html.includes('id="categoryRoute"'));
 assert.ok(html.includes('id="routeBack"'));
 assert.ok(!html.includes('<dialog'));
 assert.ok(!js.includes('categoryDialog'));
 assert.ok(js.includes('function syncCategoryRoute()'));
 assert.ok(js.includes("addEventListener('hashchange',syncCategoryRoute)"));
 assert.ok(css.includes('body.category-view-active main > :not(.category-route)'));
 assert.ok(css.includes('.route-empty{'));
 assert.ok(html.includes('hijjawix-mobile-20261024-v2'));
});

test('Tesla Sound X ships a live DSP engine, not prerecorded audio loops', () => {
  for (const file of ['public/tesla-sound/index.html','public/tesla-sound/style.css',
                      'public/tesla-sound/app.js','public/tesla-sound/engine-core.js',
                      'public/tesla-sound/engine-worklet.js']) {
    assert.equal(existsSync(new URL('../'+file, import.meta.url)),true,file);
  }
  const html=read('public/tesla-sound/index.html');
  const js=read('public/tesla-sound/app.js');
  const engine=read('public/tesla-sound/engine-core.js');
  const worklet=read('public/tesla-sound/engine-worklet.js');
  const portal=read('public/app.js');
  const headers=read('public/_headers');
  for(const id of ['startButton','gasPedal','brakePedal','gpsMode','demoMode','rpmNumber',
                   'languageButton','character','crackle','whine','demoRunButton']) {
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  for(const id of ['v8','v10','v12','flat6','supercharged','taycan'])
    assert.ok(engine.includes(id+': {'),id);
  assert.ok(js.includes('AudioWorkletNode'));
  assert.ok(js.includes("import {ENGINE_PRESETS,EngineSynth}"));
  assert.ok(js.includes('navigator.geolocation.watchPosition'));
  assert.ok(worklet.includes("registerProcessor('hijjawix-physics-engine-v3'"));
  assert.ok(engine.includes('this.fireFraction'));
  assert.ok(engine.includes('ModalResonator'));
  assert.ok(!js.includes('new Audio('),'Do not revert to a sample playback engine');
  assert.ok(!js.includes('upload.wikimedia.org'));
  assert.ok(html.includes('tesla-sound-physics-v3'));
  assert.ok(portal.includes("url:'/tesla-sound/'"));
  assert.ok(headers.includes('/tesla-sound/*'));
  assert.ok(headers.includes('geolocation=(self)'));
});
