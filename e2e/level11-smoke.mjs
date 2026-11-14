import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const root=process.cwd();
const server=createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost'),file=resolve(root,'.'+u.pathname.replace(/\/$/,'/index.html'));
 if(!file.startsWith(root+'/'))throw Error('Outside repo');
 const data=await readFile(file);res.setHeader('Content-Type',({'.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(data);
}catch{res.writeHead(404).end()}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const engine=process.env.E2E_BROWSER==='webkit'?webkit:chromium;
let browser;
try{
 browser=await engine.launch(engine===webkit?{}:{executablePath:process.env.E2E_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 for(const width of [390,1180]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>window.__CompanionBridge?.read);
  const initial=await page.evaluate(()=>{const s=window.__CompanionBridge.read();return{hp:s.hp,max:s.maxHp,exhaust:s.exhaust,dc:s.relentlessDC}});
  assert.deepEqual(initial,{hp:137,max:137,exhaust:0,dc:10});
  const oldSave=await page.evaluate(()=>{const s=structuredClone(window.__CompanionBridge.read());s.hp=50;s.maxHp=125;s.exhaust=2;s.relentlessDC=15;return JSON.stringify({state:s,journal:''})});
  // Nans autosaves on beforeunload: inject after unload but before application boot.
  await page.addInitScript(raw=>localStorage.setItem('nans-combat-state-v1',raw),oldSave);
  await page.reload();await page.waitForFunction(()=>window.__CompanionBridge?.read);
  const migrated=await page.evaluate(()=>{const s=window.__CompanionBridge.read();return{hp:s.hp,max:s.maxHp,exhaust:s.exhaust,dc:s.relentlessDC}});
  assert.deepEqual(migrated,{hp:62,max:137,exhaust:2,dc:15});
  // Rage implacable stays in the Rage card, but only the player can trigger its save.
  const shortcut=page.locator('#relentlessShortcut'),attempt=page.locator('#relentlessQuickBtn');
  assert.equal(await shortcut.isVisible(),true,'Rage shortcut visible on iPad / iPhone');
  assert.equal(await attempt.isDisabled(),true,'save disabled when conditions are not met');
  assert.match(await page.locator('#relentlessQuickState').textContent(),/DD 15/,'saved DC is displayed');
  await page.evaluate(()=>{const s=window.__CompanionBridge.read();s.hp=0;s.raging=true;render();});
  assert.equal(await attempt.isEnabled(),true,'save enabled at 0 HP during Rage');
  assert.equal(await shortcut.evaluate(el=>el.classList.contains('is-ready')),true);
  await page.evaluate(()=>{window.__relentlessOriginalPrompt=RPGDialogs.prompt;RPGDialogs.prompt=async()=> '15';});
  await attempt.click();
  await page.evaluate(()=>{RPGDialogs.prompt=window.__relentlessOriginalPrompt;});
  assert.equal(await page.evaluate(()=>window.__CompanionBridge.read().relentlessDC),20,'DC increases after the test');
  assert.equal(await page.evaluate(()=>window.__CompanionBridge.read().hp),1,'successful manual CON save restores 1 HP');
  assert.equal(await attempt.isDisabled(),true,'save locks again after returning to 1 HP');
  assert.deepEqual(errors,[],'no browser runtime errors');
  await page.close();
 }
 console.log('Level 11 browser smoke passed:',process.env.E2E_BROWSER||'chromium');
}finally{await browser?.close();await new Promise(ok=>server.close(ok))}
