const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const classes=()=>({set:new Set(),add(x){this.set.add(x)},remove(x){this.set.delete(x)},toggle(x,on){if(on===undefined)on=!this.set.has(x);on?this.set.add(x):this.set.delete(x);return on},contains(x){return this.set.has(x)}});
function el(){return {classList:classes(),style:{},value:'0',innerHTML:'',textContent:'',children:[],disabled:false,appendChild(c){this.children.push(c)},prepend(c){this.children.unshift(c)},remove(){},animate(){return {}},querySelector(){return null},getBoundingClientRect(){return {left:0,top:0,width:120,height:60}},addEventListener(){},setAttribute(){}}}
const elements=Object.fromEntries(ids.map(id=>[id,el()]));
const body=el(),fxClasses=[];elements.fx.appendChild=c=>fxClasses.push(c.className);
const store=new Map();
const document={body,getElementById:id=>elements[id]||null,querySelector:s=>s==='.shell'?elements.shell||el():null,querySelectorAll:()=>[],createElement:()=>el(),addEventListener(){}};
const ctx=vm.createContext({document,window:{addEventListener(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console,Math,Date,JSON,Number,String,setTimeout:()=>0,clearTimeout(){},innerWidth:1024,innerHeight:768,confirm:()=>true,prompt:()=>null,matchMedia:()=>({matches:true})});
vm.runInContext(inline,ctx);
const get=expr=>vm.runInContext(expr,ctx),run=src=>vm.runInContext(src,ctx);
const state=()=>get('S');
function attack(hit=true){run("S.eco.action=false;S.attacksLeft=2;S.rollMode='manual'");run("rollAttack=()=>({a:10,b:null,raw:10,total:19,crit:false,bonus:9})");run('smartAttack()');assert(state().pending);run(`confirmHit(${hit})`)}
assert.equal(state().mode,'sword');assert.equal(state().hits,0);
attack(false);assert.equal(state().hits,0,'miss must not charge');
for(let i=1;i<=3;i++){attack();assert.equal(state().hits,i)}
assert.equal(elements.chargeLabel.textContent.startsWith('3 / 5'),true);
run('S.eco.bonus=false;transferEnergy()');assert.equal(state().stored,'yellow');assert(body.classList.contains('volto-yellow'));
run('S.eco.bonus=false;toggleWeaponMode()');assert.equal(state().mode,'axe');assert.equal(state().stored,'yellow');
run("S.eco.action=false;chargedImpact()");assert(state().pending);run('confirmHit(true)');assert(fxClasses.some(x=>x==='fx-impact-flash'));
run('clearVolto()');assert.equal(state().stored,'none');assert(!body.classList.contains('volto-yellow'));
run('S.eco.bonus=false;toggleWeaponMode()');assert.equal(state().mode,'sword');
for(let i=1;i<=5;i++)attack();assert.equal(state().hits,5);
run('S.eco.bonus=false;transferEnergy()');assert.equal(state().stored,'red');assert(body.classList.contains('volto-red'));
run('S.eco.bonus=false;toggleWeaponMode()');assert.equal(state().mode,'axe');
run('S.eco.action=false;chargedImpact()');run('confirmHit(true)');assert(fxClasses.some(x=>x==='fx-impact-flash red'));
run('clearVolto()');assert.equal(state().stored,'none');
for(let i=0;i<4;i++){run('S.eco.bonus=false;toggleWeaponMode()')}assert.equal(state().mode,'axe');
run("S.temp=12;S.tempSource='Autre effet';S.barkReady=true;S.eco.bonus=false");ctx.confirm=()=>false;run('useBark()');assert.equal(state().temp,12);assert.equal(state().barkReady,true);
ctx.confirm=()=>true;run('useBark()');assert.equal(state().temp,20);assert.equal(state().tempSource,'Écorce');
elements.incomingDamage.value='25';run('applyDamage()');assert.equal(state().temp,0);assert.equal(state().tempSource,'');assert.equal(state().barkActive,false);
assert(store.has('nans-combat-state-v1'));
console.log('Volto charge, miss, yellow/red, transfer, switch, impact, purge, temp replacement and absorption: OK');
// Other combat resources and turn accounting.
run("S.mode='axe';S.gwm=true;S.ring=true;S.hp=60;S.eco={action:false,bonus:false,reaction:false};S.attacksLeft=2");
assert.equal(get('attackBonus()'),4,'Cogneur lourd attack penalty');
run("rollAttack=()=>({a:20,b:2,raw:20,total:24,crit:true,bonus:4})");
run('smartAttack()');assert.equal(state().pending,null,'natural 20 confirms automatically');assert.equal(state().gwmBonus,true,'natural 20 grants bonus attack');
run('S.eco.bonus=false;S.rages=4;S.raging=false;toggleRage()');assert.equal(state().rages,3);assert.equal(state().eco.bonus,true);
run('S.frenzy=true;nextTurn()');assert.equal(get('bonusAttackAvailable()'),true,'frenzy bonus after initial round');
run('S.eco.action=false;S.horn=3;hornPower("crash",1,"action")');assert.equal(state().horn,2);assert.equal(state().eco.action,true);
run("S.eco.action=false;S.hornState='awakened';S.hornMax=5;S.horn=5;hornPower('ancestors',3,'action',true)");assert.equal(state().ancReady,false);assert.equal(state().horn,2);
run('hornRest()');assert.equal(state().horn,5);assert.equal(state().ancReady,true);
run('longRest()');assert.equal(state().hp,state().maxHp);assert.equal(state().rages,4);
console.log('Critical, GWM, ring, rage, frenzy, horn, rest: OK');
// Ordinary results collapse to Pik-like badge; hit confirmation stays modal.
run("S.pending=null;ribbon('Essai','14 dégâts')");assert(elements.ribbon.classList.contains('show'));assert(!elements.ribbon.classList.contains('question'));
run('collapseRibbon()');assert(!elements.ribbon.classList.contains('show'));assert.equal(elements.resultBadge.hidden,false);
run('expandRibbon()');assert(elements.ribbon.classList.contains('show'));assert.equal(elements.resultBadge.hidden,true);
run("ribbon('Attaque','d20 12 + 9 = 21',true)");assert(elements.ribbon.classList.contains('question'));
run("S.pending={roll:{raw:12}};collapseRibbon()");assert(elements.ribbon.classList.contains('show'),'pending confirmation cannot collapse');
console.log('Bottom result ribbon, recall badge, center confirmation: OK');
