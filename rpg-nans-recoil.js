/* Nans ring recoil: Encounter owns real and temporary HP in connected combat. */
(()=>{'use strict';
 const api=window.CompanionAPI,bridge=window.__CompanionBridge;
 if(!api||bridge?.id!=='nans')return;
 const key='rpg-nans-recoil:v1',copy=x=>JSON.parse(JSON.stringify(x));
 let ledger={};try{ledger=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 const persist=()=>{const entries=Object.entries(ledger);if(entries.length>80)ledger=Object.fromEntries(entries.slice(-80));localStorage.setItem(key,JSON.stringify(ledger))};
 const context=()=>window.RPGHealth?.getContext?.()||{};
 const online=()=>!!(window.RPGConnect?.getStatus?.().connected&&context().combatId);
 function send(item){if(item.ack||!online()||item.request.combatId!==context().combatId)return;api.emitLocal('damage:self-request',item.request,item.request.actionId+':request')}
 function submit(attackId,amount){
  if(!online()||!attackId||!Number.isInteger(amount)||amount<1||amount>4)return false;
  const combatId=context().combatId,actionId=String(attackId)+':ring-recoil';
  if(!ledger[actionId]){ledger[actionId]={request:{actionId,attackId:String(attackId),combatId,amount,source:'Anneau de la Surcharge Furieuse'},ack:false};persist()}
  send(ledger[actionId]);return true;
 }
 api.subscribe(event=>{
  if(event.type!=='message:gm'||!event.payload?.recoilResult)return;
  const r=event.payload.recoilResult,item=ledger[r.actionId];
  if(!item||item.request.combatId!==r.combatId)return;
  item.ack=true;item.result=copy(r);persist();
  window.CompanionFeedback?.show?.(r.ok?'Contrecoup de Surcharge résolu':'Contrecoup refusé',r.ok?r.amount+' dégâts force : '+r.effective+' effectifs':r.error);
 });
 setInterval(()=>{for(const item of Object.values(ledger))send(item)},3000);
 window.RPGRingRecoil={online,submit,pending:()=>copy(Object.values(ledger).filter(i=>!i.ack))};
})();
