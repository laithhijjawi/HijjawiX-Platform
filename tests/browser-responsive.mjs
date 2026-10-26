import { strict as assert } from 'node:assert';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root=path.resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const uri=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
  const file=path.resolve(root,'.'+uri);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  try{
    const data=await readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  }catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const rootUrl='http://127.0.0.1:'+port+'/';
const widths=[320,360,390,414,768,1280];
const screenshotDir=path.resolve('browser-screenshots');
await mkdir(screenshotDir,{recursive:true});
let browser;
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
  for(const width of widths){
    const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
    await page.goto(rootUrl,{waitUntil:'domcontentloaded'});
    await page.waitForTimeout(140);
    const start=await page.evaluate(()=>{
      const r=sel=>{const el=document.querySelector(sel);if(!el)return null;const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,width:b.width,height:b.height}};
      return {viewport:window.innerWidth,htmlWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,hero:r('.hero'),header:r('.site-header'),brand:r('.brand'),menu:r('.mobile-menu-toggle'),category:r('.category-card'),gridCols:getComputedStyle(document.querySelector('.category-grid')).gridTemplateColumns};
    });
    console.log('INITIAL '+width+'px '+JSON.stringify(start));
    if(start.htmlWidth>width+2){
      const offenders=await page.evaluate(()=>{
        return [...document.querySelectorAll('*')].map(el=>{
          const r=el.getBoundingClientRect();const s=getComputedStyle(el);
          return {selector:el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'?'.'+el.className.trim().replace(/\s+/g,'.'):''),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),scroll:el.scrollWidth,overflowX:s.overflowX,position:s.position};
        }).filter(x=>x.right>innerWidth+3||x.left< -3).sort((a,b)=>b.right-a.right).slice(0,18);
      });
      console.log('HORIZONTAL_OFFENDERS '+width+'px '+JSON.stringify(offenders));
    }
    assert.equal(start.viewport,width,'Unexpected viewport width');
    assert.ok(start.htmlWidth<=width+2,'Document horizontally overflows at '+width+'px: '+start.htmlWidth);
    assert.ok(start.category&&start.category.left>=-2&&start.category.right<=width+2,'Category card offscreen at '+width+'px');
    assert.ok(start.brand&&start.brand.left>=-2&&start.brand.right<=width+2,'Header brand offscreen at '+width+'px');
    if(width<=640){
      assert.ok(start.menu&&start.menu.width>=40,'Menu missing on phone');
      await page.screenshot({path:path.join(screenshotDir,'home-'+width+'.png'),fullPage:true});
    }
    if(width===360){
      await page.locator('.mobile-menu-toggle').click();
      assert.equal(await page.locator('.nav-links').evaluate(el=>el.classList.contains('is-open')),true,'Mobile menu must open');
      await page.locator('.mobile-menu-toggle').click();
      assert.equal(await page.locator('.nav-links').evaluate(el=>el.classList.contains('is-open')),false,'Mobile menu must close');
    }
    await page.locator('[data-category="islamic"]').click();
    assert.ok(page.url().includes('#category/islamic'),'Category route hash missing');
    assert.equal(await page.locator('#categoryRoute').getAttribute('hidden'),null,'Category detail should be visible');
    assert.equal(await page.locator('dialog').count(),0,'Old native dialog must be removed');
    assert.ok(await page.locator('#routeApps .route-app').count()>0,'Islamic apps missing');
    const opened=await page.evaluate(()=>{
      const r=document.querySelector('#categoryRoute').getBoundingClientRect();
      return {left:r.left,right:r.right,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
    });
    console.log('OPEN_CATEGORY '+width+'px '+JSON.stringify(opened));
    assert.ok(opened.left>=-2&&opened.right<=width+2,'Category detail clipped at '+width+'px');
    assert.ok(opened.scrollWidth<=width+2,'Category detail causes horizontal overflow at '+width+'px');
    if(width<=640)await page.screenshot({path:path.join(screenshotDir,'category-'+width+'.png'),fullPage:true});
    await page.locator('#routeBack').click();
    assert.ok(page.url().includes('#explore'),'Back navigation failed at '+width+'px');
    assert.notEqual(await page.locator('#categoryRoute').getAttribute('hidden'),null,'Category detail should hide when returning');
    await page.locator('[data-category="engineering"]').click();
    assert.ok(await page.locator('#routeApps .route-empty').count()===1,'Empty category not shown at '+width+'px');
    if(width<=640)await page.screenshot({path:path.join(screenshotDir,'empty-'+width+'.png'),fullPage:true});
    if(width===390){
      await page.locator('#langToggle').click();
      assert.equal(await page.locator('#routeTitle').textContent(),'Engineering','Language switch failed in category page');
      await page.goBack({waitUntil:'domcontentloaded'});
      assert.ok(page.url().includes('#explore'),'Browser Back should restore categories');
    }
    await page.close();
  }
  // Tesla Sound X: actual app layout and interactive simulation regression.
  for (const width of [360,1280]) {
    const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
    await page.goto(rootUrl+'tesla-sound/',{waitUntil:'domcontentloaded'});
    assert.ok(await page.locator('#revMode').isVisible(),'Park Rev selector must exist');
    assert.ok(await page.locator('#driveMode').isVisible(),'Drive selector must exist');
    assert.ok(!(await page.locator('#sourceSetting').isVisible()),'Drive inputs must hide in parked rev');
    await page.locator('#startButton').click();
    assert.equal((await page.locator('#gearDisplay').textContent()).trim(),'P','Park Rev must show P gear');
    await page.locator('#gasPedal').hover();
    await page.mouse.down();
    await page.waitForTimeout(650);
    const rpm=Number((await page.locator('#rpmNumber').textContent()).trim());
    const speed=Number((await page.locator('#speedNumber').textContent()).trim());
    await page.mouse.up();
    assert.ok(rpm>1000,'Park Rev should change RPM with on-screen pedal: '+rpm);
    assert.equal(speed,0,'Park Rev must not move virtual vehicle');
    await page.locator('#driveMode').click();
    assert.ok(await page.locator('#sourceSetting').isVisible(),'Driving source choices must show');
    await page.locator('#gasPedal').hover();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    const driveSpeed=Number((await page.locator('#speedNumber').textContent()).trim());
    await page.mouse.up();
    assert.ok(driveSpeed>0,'Drive demo should accelerate with on-screen pedal');
    await page.locator('#gpsMode').click();
    assert.ok(!(await page.locator('#demoPedals').isVisible()),'Manual pedals must hide for GPS');
    const htmlWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    assert.ok(htmlWidth<=width+2,'Tesla Sound page must not overflow at '+width+'px');
    await page.screenshot({path:path.join(screenshotDir,'tesla-sound-'+width+'.png'),fullPage:true});
    await page.close();
  }
  console.log('PASS: mobile, desktop, category navigation and Tesla Sound X parked/driving controls.');
}finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
