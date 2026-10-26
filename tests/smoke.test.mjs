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

test('Tesla Sound X assets and portal entry exist', () => {
  for (const file of ['public/tesla-sound/index.html','public/tesla-sound/style.css','public/tesla-sound/app.js']) {
    assert.equal(existsSync(new URL('../'+file, import.meta.url)), true, file);
  }
  const html=read('public/tesla-sound/index.html');
  const js=read('public/tesla-sound/app.js');
  const portal=read('public/app.js');
  const headers=read('public/_headers');
  for (const id of ['startButton','gasPedal','brakePedal','gpsMode','demoMode','rpmNumber','languageButton']) assert.ok(html.includes('id="'+id+'"'),id);
  for (const profile of ['v8','v10','v12','flat6','electric','taycan']) assert.ok(js.includes(profile+':{'), profile);
  assert.ok(js.includes('navigator.geolocation.watchPosition'));
  assert.ok(js.includes('new Audio()'),'Audio engine must play real recordings');
  assert.ok(js.includes('URL.createObjectURL'),'Custom imported audio must be playable');
  assert.ok(!js.includes('createOscillator('),'No synthetic oscillator engine should remain');
  assert.ok(html.includes('id="soundFile"'),'Audio import must be available');
  assert.ok(html.includes('tesla-sound-studio-v2'),'Studio version marker must exist');
  assert.ok(headers.includes("media-src 'self' blob: https://upload.wikimedia.org"));
  assert.ok(js.includes('Maserati_GranTurismo_S_Exhaust.ogg'));
  assert.ok(portal.includes("url:'/tesla-sound/'"));
  assert.ok(headers.includes('/tesla-sound/*'));
  assert.ok(headers.includes('geolocation=(self)'));
});
