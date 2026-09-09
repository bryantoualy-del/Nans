from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = "body.raging{background:"
css = r'''/* VOLTO LIGHTNING FX */
#axeCard{position:relative;overflow:hidden;isolation:isolate}
#axeCard:after{content:'';position:absolute;inset:-35%;pointer-events:none;opacity:0;z-index:-1;background:conic-gradient(from 0deg,transparent 0 18%,rgba(255,235,125,.26) 20%,transparent 23% 48%,rgba(255,110,70,.24) 50%,transparent 54%);transform:rotate(0deg)}
body.volto-yellow #axeCard{animation:voltoYellowPulse 1.8s ease-in-out infinite;box-shadow:0 0 20px rgba(255,210,70,.28),inset 0 0 18px rgba(255,210,70,.08)}
body.volto-yellow #axeCard:after{opacity:.34;animation:chargeOrbit 5s linear infinite}
body.volto-red #axeCard{animation:voltoRedPulse .85s ease-in-out infinite;box-shadow:0 0 28px rgba(255,70,35,.42),inset 0 0 25px rgba(255,70,35,.14)}
body.volto-red #axeCard:after{opacity:.68;animation:chargeOrbit 2.2s linear infinite}
#impactBtn.charged-yellow{border-color:#f2cf57;box-shadow:0 0 13px rgba(255,211,70,.28);animation:impactReadyYellow 1.55s ease-in-out infinite}
#impactBtn.charged-red{border-color:#ff6842;background:linear-gradient(#7c2516,#35100b);box-shadow:0 0 20px rgba(255,77,40,.46);animation:impactReadyRed .72s ease-in-out infinite}
.fx-bolt{position:fixed;height:3px;transform-origin:0 50%;border-radius:999px;opacity:0;pointer-events:none;z-index:9100;background:linear-gradient(90deg,transparent,#fff,#ffe570,#fff,transparent);box-shadow:0 0 7px #fff,0 0 15px #ffd54f}
.fx-bolt.red{background:linear-gradient(90deg,transparent,#fff,#ff784d,#fff,transparent);box-shadow:0 0 8px #fff,0 0 18px #ff4a2b}
.fx-spark{position:fixed;width:5px;height:5px;border-radius:50%;pointer-events:none;z-index:9120;background:#fff7b0;box-shadow:0 0 8px #ffd84c}
.fx-spark.red{background:#fff;box-shadow:0 0 9px #ff5c36,0 0 16px #ff301b}
.fx-impact-flash{position:fixed;inset:0;pointer-events:none;z-index:9090;opacity:0;background:#eefcff}
.fx-impact-flash.red{background:#fff1e8}
.fx-impact-wave{position:fixed;left:50%;top:50%;width:80px;height:80px;margin:-40px;border:5px solid #fff7a8;border-radius:50%;pointer-events:none;z-index:9095;opacity:0;box-shadow:0 0 20px #ffd84f}
.fx-impact-wave.red{border-color:#ffbd9f;box-shadow:0 0 24px #ff4c28}
.shell.fx-impact-shake{animation:impactShake .64s cubic-bezier(.36,.07,.19,.97)}
@keyframes chargeOrbit{to{transform:rotate(360deg)}}
@keyframes voltoYellowPulse{50%{filter:brightness(1.09);box-shadow:0 0 30px rgba(255,210,70,.42),inset 0 0 22px rgba(255,210,70,.12)}}
@keyframes voltoRedPulse{0%,100%{transform:translateX(0)}45%{filter:brightness(1.12)}50%{transform:translateX(.7px)}55%{transform:translateX(-.7px)}}
@keyframes impactReadyYellow{50%{box-shadow:0 0 24px rgba(255,211,70,.52);filter:brightness(1.08)}}
@keyframes impactReadyRed{50%{box-shadow:0 0 34px rgba(255,70,35,.72);filter:brightness(1.18)}}
@keyframes impactShake{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}
@media(prefers-reduced-motion:reduce){body.volto-yellow #axeCard,body.volto-red #axeCard,#impactBtn.charged-yellow,#impactBtn.charged-red,.shell.fx-impact-shake{animation:none!important}}
'''
if '/* VOLTO LIGHTNING FX */' not in s:
    if marker not in s:
        raise SystemExit('CSS marker not found')
    s = s.replace(marker, css + marker, 1)

js = r'''
function makeBolt(x1,y1,x2,y2,red=false,duration=260,delay=0){
 const el=document.createElement('div');el.className='fx-bolt'+(red?' red':'');
 const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI;
 el.style.left=x1+'px';el.style.top=y1+'px';el.style.width=len+'px';el.style.transform='rotate('+ang+'deg) scaleX(.15)';$('fx').appendChild(el);
 el.animate([{opacity:0,transform:'rotate('+ang+'deg) scaleX(.12)'},{opacity:1,offset:.25,transform:'rotate('+ang+'deg) scaleX(1)'},{opacity:0,transform:'rotate('+ang+'deg) scaleX(.72)'}],{duration,delay,easing:'cubic-bezier(.2,.8,.2,1)'});
 setTimeout(()=>el.remove(),duration+delay+60)
}
function scatterSparks(cx,cy,red=false,count=10){for(let i=0;i<count;i++){const el=document.createElement('div');el.className='fx-spark'+(red?' red':'');el.style.left=cx+'px';el.style.top=cy+'px';$('fx').appendChild(el);const a=Math.random()*Math.PI*2,r=35+Math.random()*150,dx=Math.cos(a)*r,dy=Math.sin(a)*r;el.animate([{opacity:1,transform:'translate(0,0) scale(1.2)'},{opacity:0,transform:'translate('+dx+'px,'+dy+'px) scale(.2)'}],{duration:420+Math.random()*260,easing:'cubic-bezier(.15,.8,.3,1)'});setTimeout(()=>el.remove(),760)}}
function syncVoltoFx(){
 document.body.classList.toggle('volto-yellow',S.stored==='yellow');document.body.classList.toggle('volto-red',S.stored==='red');
 const ib=$('impactBtn');if(ib){ib.classList.toggle('charged-yellow',S.stored==='yellow');ib.classList.toggle('charged-red',S.stored==='red')}
}
function fxTransfer(level){
 const red=level==='red',a=$('swordView')?.getBoundingClientRect(),b=$('axeView')?.getBoundingClientRect();
 const x1=a?a.left+a.width*.72:innerWidth*.32,y1=a?a.top+a.height*.45:innerHeight*.46,x2=b?b.left+b.width*.45:innerWidth*.68,y2=b?b.top+b.height*.42:innerHeight*.46;
 for(let i=0;i<(red?7:4);i++){let jitter=(Math.random()-.5)*34;makeBolt(x1,y1+jitter,x2,y2-jitter,red,250+Math.random()*140,i*45)}
 scatterSparks(x2,y2,red,red?18:10);fx(red?'flash':'ring');
}
function fxLightningHit(level='yellow'){
 const red=level==='red',r=$('attackBtn')?.getBoundingClientRect(),cx=r?r.left+r.width/2:innerWidth/2,cy=r?r.top+r.height/2:innerHeight/2;
 for(let i=0;i<(red?5:3);i++){const x=cx+(Math.random()-.5)*90;makeBolt(x,Math.max(0,cy-170-Math.random()*90),cx+(Math.random()-.5)*30,cy,red,180+Math.random()*100,i*35)}
 scatterSparks(cx,cy,red,red?12:7)
}
function fxChargedImpact(level){
 const red=level==='red',cx=innerWidth/2,cy=innerHeight/2;
 const flash=document.createElement('div');flash.className='fx-impact-flash'+(red?' red':'');$('fx').appendChild(flash);flash.animate([{opacity:0},{opacity:.96,offset:.12},{opacity:.1,offset:.42},{opacity:.62,offset:.52},{opacity:0}],{duration:red?900:720});setTimeout(()=>flash.remove(),950);
 for(let w=0;w<(red?3:2);w++){const wave=document.createElement('div');wave.className='fx-impact-wave'+(red?' red':'');$('fx').appendChild(wave);wave.animate([{opacity:.95,transform:'scale(.15)'},{opacity:0,transform:'scale('+(red?11:8)+')'}],{duration:650+w*120,delay:w*90,easing:'cubic-bezier(.05,.7,.2,1)'});setTimeout(()=>wave.remove(),1100)}
 for(let i=0;i<(red?14:9);i++){const a=Math.random()*Math.PI*2,r=(red?Math.max(innerWidth,innerHeight)*.72:Math.max(innerWidth,innerHeight)*.58),x2=cx+Math.cos(a)*r,y2=cy+Math.sin(a)*r;makeBolt(cx,cy,x2,y2,red,260+Math.random()*240,i*18)}
 scatterSparks(cx,cy,red,red?32:20);document.querySelector('.shell')?.classList.add('fx-impact-shake');setTimeout(()=>document.querySelector('.shell')?.classList.remove('fx-impact-shake'),700);fx('shock');
}
'''
if 'function fxChargedImpact(' not in s:
    key = 'function useEco(k)'
    if key not in s:
        raise SystemExit('JS insertion marker not found')
    s = s.replace(key, js + '\n' + key, 1)

s = s.replace("fx('ring');ribbon('Énergie transférée'", "fxTransfer(S.stored);ribbon('Énergie transférée'", 1)
s = s.replace("let dice=crit?3:1,total=0,parts=[];", "let dice=crit?3:1,total=0,parts=[],lightningUsed=false;", 1)
s = s.replace("S.energyUsedTurn=true}", "S.energyUsedTurn=true;lightningUsed=true}", 1)
s = s.replace("return{total,txt}}", "return{total,txt,lightningUsed}}", 1)
old = "fx(p.impact?'shock':'slash');ribbon(p.impact?'💥 IMPACT CHARGÉ — TOUCHE':'TOUCHE !'"
new = "if(p.impact){fxChargedImpact(p.stored)}else{fx('slash');if(dmg.lightningUsed)fxLightningHit(S.stored==='red'?'red':'yellow')}ribbon(p.impact?'💥 IMPACT CHARGÉ — TOUCHE':'TOUCHE !'"
s = s.replace(old, new, 1)
render_marker = "const axeCard=$('axeCard');axeCard.classList.toggle('charge-yellow',S.stored==='yellow');axeCard.classList.toggle('charge-red',S.stored==='red');"
if render_marker in s and 'syncVoltoFx();' not in s[s.find(render_marker):s.find(render_marker)+len(render_marker)+80]:
    s = s.replace(render_marker, render_marker + 'syncVoltoFx();', 1)

# Upgrade first-hit 1d6 lightning proc visibility without competing with Charged Impact.
upgrade_css = r'''
/* VOLTO PROC FX BOOST */
.fx-proc-flash{position:fixed;inset:0;pointer-events:none;z-index:9092;opacity:0;background:radial-gradient(circle at 50% 52%,rgba(255,255,255,.52),rgba(255,232,120,.20) 22%,transparent 58%)}
.fx-proc-flash.red{background:radial-gradient(circle at 50% 52%,rgba(255,255,255,.58),rgba(255,105,65,.24) 24%,transparent 60%)}
.fx-proc-ring{position:fixed;left:50%;top:50%;width:96px;height:96px;margin:-48px;border:4px solid #fff1a3;border-radius:50%;pointer-events:none;z-index:9110;opacity:0;box-shadow:0 0 18px #fff,0 0 34px #ffd653}
.fx-proc-ring.red{border-color:#ffd1be;box-shadow:0 0 18px #fff,0 0 36px #ff5a35}
#axeCard.fx-proc-card,#attackBtn.fx-proc-card{animation:voltoProcKick .42s cubic-bezier(.2,.8,.2,1)}
.shell.fx-proc-shake{animation:voltoProcShake .20s linear}
@keyframes voltoProcKick{0%{filter:brightness(1)}18%{filter:brightness(1.5);box-shadow:0 0 28px rgba(255,235,120,.70),0 0 48px rgba(110,220,255,.30)}100%{filter:brightness(1)}}
@keyframes voltoProcShake{0%,100%{transform:translate(0,0)}25%{transform:translate(-2px,1px)}50%{transform:translate(2px,-1px)}75%{transform:translate(-1px,0)}}
@media(prefers-reduced-motion:reduce){#axeCard.fx-proc-card,#attackBtn.fx-proc-card,.shell.fx-proc-shake{animation:none!important}}
'''
if '/* VOLTO PROC FX BOOST */' not in s:
    pos=s.find('</style>')
    if pos==-1: raise SystemExit('style end not found')
    s=s[:pos]+upgrade_css+s[pos:]

old_fx = r'''function fxLightningHit(level='yellow'){
 const red=level==='red',r=$('attackBtn')?.getBoundingClientRect(),cx=r?r.left+r.width/2:innerWidth/2,cy=r?r.top+r.height/2:innerHeight/2;
 for(let i=0;i<(red?5:3);i++){const x=cx+(Math.random()-.5)*90;makeBolt(x,Math.max(0,cy-170-Math.random()*90),cx+(Math.random()-.5)*30,cy,red,180+Math.random()*100,i*35)}
 scatterSparks(cx,cy,red,red?12:7)
}'''
new_fx = r'''function fxLightningHit(level='yellow'){
 const red=level==='red',r=$('attackBtn')?.getBoundingClientRect(),cx=r?r.left+r.width/2:innerWidth/2,cy=r?r.top+r.height/2:innerHeight/2;
 const flash=document.createElement('div');flash.className='fx-proc-flash'+(red?' red':'');$('fx').appendChild(flash);
 flash.animate([{opacity:0},{opacity:.88,offset:.13},{opacity:.22,offset:.42},{opacity:0}],{duration:520,easing:'ease-out'});setTimeout(()=>flash.remove(),580);
 const ring=document.createElement('div');ring.className='fx-proc-ring'+(red?' red':'');ring.style.left=cx+'px';ring.style.top=cy+'px';$('fx').appendChild(ring);
 ring.animate([{opacity:.95,transform:'scale(.25)'},{opacity:.55,offset:.35,transform:'scale(1.25)'},{opacity:0,transform:'scale(2.7)'}],{duration:560,easing:'cubic-bezier(.05,.7,.2,1)'});setTimeout(()=>ring.remove(),620);
 for(let i=0;i<(red?9:7);i++){const topX=cx+(Math.random()-.5)*(red?180:150),topY=Math.max(0,cy-230-Math.random()*150),endX=cx+(Math.random()-.5)*42,endY=cy+(Math.random()-.5)*16;makeBolt(topX,topY,endX,endY,red,240+Math.random()*130,i*22)}
 for(let i=0;i<(red?4:3);i++){const a=Math.random()*Math.PI*2,len=100+Math.random()*120;makeBolt(cx,cy,cx+Math.cos(a)*len,cy+Math.sin(a)*len,red,210+Math.random()*90,70+i*28)}
 scatterSparks(cx,cy,red,red?22:16);
 const card=$('axeCard'),btn=$('attackBtn'),shell=document.querySelector('.shell');card?.classList.add('fx-proc-card');btn?.classList.add('fx-proc-card');shell?.classList.add('fx-proc-shake');
 setTimeout(()=>{card?.classList.remove('fx-proc-card');btn?.classList.remove('fx-proc-card');shell?.classList.remove('fx-proc-shake')},460)
}'''
if old_fx in s:
    s=s.replace(old_fx,new_fx,1)
elif new_fx not in s:
    raise SystemExit('fxLightningHit marker not found')

p.write_text(s, encoding='utf-8')
