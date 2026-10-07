/* Small adapters invoke each character's real melee engine. */
(()=>{'use strict';const b=window.__CompanionBridge;if(!b||!window.RPGReactions)return;
 const configs=window.RPGOpportunityConfig||[];
 if(!configs.length){const button=document.createElement('button');button.type='button';button.dataset.opportunity='native';button.textContent='Attaque d’opportunité';button.className='rpg-group-launch';const group=document.querySelector('.rpg-group-launch');group?.after(button);if(!b.nativeReactionAttack){button.disabled=true;button.title='Aucune attaque de mêlée personnelle définie dans cette fiche';const text=document.createElement('small');text.textContent='Opportunité : attaque de mêlée à définir';button.after(text)}else{button.onclick=()=>b.nativeReactionAttack();configs.push({id:'opportunity-native',label:'Attaque d’opportunité',selector:'[data-opportunity=native]'})}}
 window.RPGOpportunityConfig=configs;
})();
