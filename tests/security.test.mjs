import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Static assets receive safe Cloudflare security headers',()=>{
  const text=read('public/_headers');
  assert.ok(text.startsWith('# Security defaults'));
  for(const name of ['X-Content-Type-Options: nosniff','X-Frame-Options: DENY',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy:', 'Content-Security-Policy:', 'Strict-Transport-Security:']){
    assert.ok(text.includes(name),'Missing security header: '+name);
  }
  assert.ok(text.includes("script-src 'self'"));
  assert.ok(text.includes("frame-ancestors 'none'"));
  assert.ok(text.includes('https://fonts.googleapis.com'));
  assert.ok(text.includes('https://fonts.gstatic.com'));
  const directives=text.split(/\r?\n/).filter(l=>l.trim().startsWith('Content-Security-Policy:'));
  assert.equal(directives.length,1,'Use exactly one CSP directive');
  assert.ok(!/script-src[^;\n]*'unsafe-inline'/.test(directives[0]),'Never allow inline JavaScript');
});

test('Public portal uses no inline executable scripts or embedded secrets',()=>{
  const html=read('public/index.html');
  const js=read('public/app.js');
  const config=read('wrangler.jsonc');
  assert.ok(!/<script\b(?![^>]*\bsrc=)/i.test(html),'Avoid inline JavaScript that violates CSP');
  assert.ok(!/\beval\s*\(|new\s+Function\s*\(/.test(js),'Avoid dynamic code execution');
  assert.ok(!/(?:BEGIN [A-Z ]*PRIVATE KEY|ghp_[0-9a-z]{20,}|sk_live_[0-9a-z]{12,})/i.test([html,js,config].join('\n')),'Possible credential in public assets');
  assert.ok(!/"main"\s*:/.test(config),'Keep portal static-only with no backend routes');
});
