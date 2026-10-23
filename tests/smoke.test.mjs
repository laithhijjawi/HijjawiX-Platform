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
