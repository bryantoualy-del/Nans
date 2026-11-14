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
  await page.waitForFunction(()=>window.CompanionDiceEngine?.roll && window.RPGGroupView?.open);
  await page.evaluate(()=>{
   window.__relentlessOriginalPrompt=RPGDialogs.prompt;
   window.__relentlessOriginalDiceRoll=CompanionDiceEngine.roll;
   window.__relentlessDiceSpy=[];
   CompanionDiceEngine.roll=async opts=>{window.__relentlessDiceSpy.push(opts)};
   RPGDialogs.prompt=async()=> '15';
   window.__CompanionBridge.read().rollMode='manual';render();
   ribbon('Rage implacable','0 PV : tenter le JdS CON.');
  });
  await attempt.click();
  assert.equal(await page.evaluate(()=>window.__CompanionBridge.read().relentlessDC),20,'DC increases after the test');
  assert.equal(await page.evaluate(()=>window.__CompanionBridge.read().hp),1,'successful manual CON save restores 1 HP');
  assert.equal(await attempt.isDisabled(),true,'save locks again after returning to 1 HP');
  const manualResult=await page.evaluate(()=>({roll:window.__relentlessDiceSpy.at(-1),ribbon:document.querySelector('#ribbon').classList.contains('show'),badge:document.querySelector('#resultBadge').hidden,last:window.__CompanionBridge.read().lastResult}));
  assert.deepEqual(manualResult.roll.rolls,[15],'manual save uses the same face in the 3D engine');
  assert.equal(manualResult.roll.total,22,'the dice overlay includes the +7 CON save');
  assert.match(manualResult.roll.verdict,/réussi/,'overlay shows save outcome');
  assert.equal(manualResult.ribbon,false,'the old top banner is dismissed as soon as the save resolves');
  assert.equal(manualResult.badge,true,'no stale result badge after the save');
  assert.equal(manualResult.last,null,'no stale top result retained');
  await page.evaluate(()=>{
   const s=window.__CompanionBridge.read();s.hp=0;s.raging=true;s.relentlessDC=10;s.rollMode='auto';
   window.__relentlessOriginalRandom=Math.random;Math.random=()=>0;render();
  });
  await attempt.click();
  const autoResult=await page.evaluate(()=>({s:window.__CompanionBridge.read(),roll:window.__relentlessDiceSpy.at(-1),ribbon:document.querySelector('#ribbon').classList.contains('show')}));
  assert.deepEqual(autoResult.roll.rolls,[1],'automatic save rolls a d20 through the companion dice presentation');
  assert.match(autoResult.roll.verdict,/raté/,'failed save outcome is visible in the dice engine');
  assert.equal(autoResult.s.hp,0,'failed save leaves Nans at 0 HP');
  assert.equal(autoResult.s.relentlessDC,15,'DC rises even after failure');
  assert.equal(autoResult.ribbon,false,'failed save also clears the stale banner');
  await page.evaluate(()=>{
   Math.random=window.__relentlessOriginalRandom;
   RPGDialogs.prompt=window.__relentlessOriginalPrompt;
   CompanionDiceEngine.roll=window.__relentlessOriginalDiceRoll;
   RPGGroupView.open();
   document.querySelector('#v3-notes').hidden=false;
  });
  assert.equal(await page.locator('#rpgGroupView').isVisible(),true,'the group view opens');
  assert.equal(await page.locator('#rpgGroupView .rpg-unified-journal').count(),0,'group view is only the initiative roster');
  assert.equal(await page.locator('#v3-notes').isVisible(),false,'the journal never leaks into the group view');
  await page.evaluate(()=>{document.querySelector('#v3-notes').hidden=true;RPGGroupView.close()});
  assert.deepEqual(errors,[],'no browser runtime errors');
  await page.close();
 }
 console.log('Level 11 browser smoke passed:',process.env.E2E_BROWSER||'chromium');
}finally{await browser?.close();await new Promise(ok=>server.close(ok))}
