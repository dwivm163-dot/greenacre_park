const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1600,height:1100}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.GREENACRE_TEST_URL||'http://127.0.0.1:4174/');await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await p.evaluate(()=>document.fonts.ready);
 const positions=()=>p.locator('.physical-panel .map-object').evaluateAll(os=>os.map(o=>o.getAttribute('style')));
 const profile=()=>p.locator('.atmosphere-profile').innerText();
 const initial=await positions(),initialProfile=await profile();const timeProfiles={};
 for(const [time,count,echoes] of [['Morning',4,0],['Afternoon',12,1],['Evening',6,0]]){
  await p.getByRole('button',{name:time,exact:true}).click();assert.equal(await p.locator('.visitor-count').getAttribute('data-visitors'),String(count));assert.equal(await p.locator('[data-conversation-echo]').count(),echoes);assert.equal(await p.locator('[data-conversation-cluster]').count(),count);assert.deepEqual(await positions(),initial);timeProfiles[time]=await profile();
 }
 assert.notEqual(timeProfiles.Morning,timeProfiles.Afternoon);assert.notEqual(timeProfiles.Evening,timeProfiles.Afternoon);

 const labels={traffic:'Traffic Noise',waterfall:'Waterfall Sound',stream:'Flowing Water',conversations:'Conversations',movement:'Movement',trees:'Tree Shade',pergola:'Pergola Shade',greenery:'Smell / Greenery'};
 const scores=()=>p.locator('.atmosphere-scores meter').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.getAttribute('aria-label'),Number(e.value)])));
 const beforeToggle=await profile(), fullScores=await scores();
 for(const [key,label]of Object.entries(labels)){
  await p.getByRole('checkbox',{name:label,exact:true}).uncheck();
  const hidden=await p.locator(`.ambience-panel .map-canvas [data-sensory-layer="${key}"]`).evaluateAll(es=>es.length>0&&es.every(e=>getComputedStyle(e).visibility==='hidden'));assert(hidden,label+' not fully hidden');
  for(const other of Object.keys(labels).filter(k=>k!==key))assert(await p.locator(`.ambience-panel .map-canvas [data-sensory-layer="${other}"]`).evaluateAll(es=>es.every(e=>getComputedStyle(e).visibility==='visible')),`${label} hid ${other}`);
  assert.deepEqual(await positions(),initial);assert.notEqual(await profile(),beforeToggle);
  const changed=await scores();assert.notDeepEqual(changed,fullScores,label+' must change scores');
  if(key==='traffic'){assert(changed.Noise<fullScores.Noise);assert(changed.Calm>fullScores.Calm);}
  if(key==='waterfall'){assert(changed.Noise>fullScores.Noise);assert(changed.Calm<fullScores.Calm);}
  if(key==='greenery')assert(changed.Calm<fullScores.Calm);
  await p.getByRole('checkbox',{name:label,exact:true}).check();
 }
 // Move a hidden table after a time change; state, intensity, and trails survive.
 await p.getByRole('button',{name:'Morning',exact:true}).click();await p.getByRole('checkbox',{name:'Conversations',exact:true}).uncheck();await p.getByRole('checkbox',{name:'Movement',exact:true}).uncheck();
 const oldRoutes=await p.locator('[data-route-id]').evaluateAll(es=>es.map(e=>e.getAttribute('d')));
 const seat=p.locator('.physical-panel [data-object-id="central_seating_01"]');await seat.focus();for(let i=0;i<4;i++)await p.keyboard.press('Shift+ArrowRight');
 assert.equal(await p.locator('.ambience-panel [data-object-id="central_seating_01"]').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 assert.equal(await p.locator('[data-conversation-period="Morning"]').count(),4);
 const newRoutes=await p.locator('[data-route-id]').evaluateAll(es=>es.map(e=>e.getAttribute('d')));assert.notDeepEqual(newRoutes,oldRoutes);assert.equal(await p.locator('.ambience-movement').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 assert.notDeepEqual(await positions(),initial);assert.equal((await scores())['Social Activity'],0);
 const silentProfile=await profile();await p.getByRole('checkbox',{name:'Conversations',exact:true}).check();assert.notEqual(await profile(),silentProfile);
 // Other hidden sources also stay hidden when their physical object moves.
 for(const [layer,id]of [['waterfall','waterfall'],['stream','stream'],['trees','tree_cluster_01'],['pergola','pergola_upper']]){
  await p.getByRole('checkbox',{name:labels[layer],exact:true}).uncheck();await p.locator(`.physical-panel [data-object-id="${id}"]`).focus();await p.keyboard.press('Shift+ArrowLeft');assert.equal(await p.locator(`.ambience-panel [data-object-id="${id}"]`).evaluate(e=>getComputedStyle(e).visibility),'hidden');
 }
 await p.getByRole('button',{name:'Reset Arrangement',exact:true}).click();assert.deepEqual(await positions(),initial);assert.equal(await profile(),initialProfile);assert.equal(await p.getByRole('button',{name:'Afternoon',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await p.getByRole('checkbox',{checked:true}).count(),8);
 assert(await p.locator('.ambience-panel .map-background').evaluate(e=>getComputedStyle(e).maskImage.includes('linear-gradient')));
 for(const width of [900,390,1600]){await p.setViewportSize({width,height:1100});assert(await p.getByRole('button',{name:'Morning',exact:true}).isVisible());assert(await p.locator('.atmosphere-profile').isVisible());assert.equal(await p.locator('.physical-panel .map-object').count(),17);}
 assert.deepEqual(errors,[]);console.log('PASS time/count/intensity, all 8 independent layers, hidden-object movement, hidden live routes, layer-aware atmospheric reading, full reset, responsive controls.');
}finally{await b.close()}})();
