const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GREENACRE_TEST_URL || 'http://127.0.0.1:4174/');
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(()=>document.fonts.ready);
 const snapshot=()=>page.evaluate(()=>({objects:[...document.querySelectorAll('.physical-panel .map-object')].map(o=>({id:o.dataset.objectId,x:parseFloat(o.style.left),y:parseFloat(o.style.top),w:o.style.width,h:o.style.height})),ambience:[...document.querySelectorAll('.ambience-panel .map-object')].map(o=>({id:o.dataset.objectId,x:parseFloat(o.style.left),y:parseFloat(o.style.top),w:o.style.width,h:o.style.height})),backgrounds:[...document.querySelectorAll('.map-background')].map(i=>({src:i.src,rect:JSON.stringify(i.getBoundingClientRect())})),routes:[...document.querySelectorAll('[data-route-id]')].map(p=>p.getAttribute('d'))}));
 const initial=await snapshot();
 // Find an opaque image point rather than grabbing transparent padding.
 async function grabPoint(id){
  await page.locator(`.physical-panel [data-object-id="${id}"]`).focus();
  return page.evaluate(id=>{
   const object=document.querySelector(`.physical-panel [data-object-id="${id}"]`),img=object.querySelector('img'),rect=object.getBoundingClientRect();
   const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
   const scale=Math.min(rect.width/c.width,rect.height/c.height);const w=id==='stream'?rect.width:c.width*scale,h=id==='stream'?rect.height:c.height*scale;
   let point=null,best=Infinity;
   for(let y=0;y<c.height;y+=4)for(let x=0;x<c.width;x+=4){if(pixels[(y*c.width+x)*4+3]<150)continue;const score=(x/c.width-.5)**2+(y/c.height-.5)**2;if(score<best){best=score;point={x:rect.x+(rect.width-w)/2+x/c.width*w,y:rect.y+(rect.height-h)/2+y/c.height*h};}}
   return point;
  },id);
 }
 for(const object of initial.objects){
  await page.getByRole('button',{name:'Reset Arrangement',exact:true}).click();
  const start=await grabPoint(object.id);await page.mouse.move(start.x,start.y);await page.mouse.down();
  // Verify continuous updates before pointerup.
  await page.mouse.move(start.x-12,start.y-8,{steps:5});
  const midway=await snapshot();const moved=midway.objects.find(o=>o.id===object.id);
  assert(moved.x!==object.x||moved.y!==object.y,`${object.id} did not move`);
  assert.deepEqual(midway.objects,midway.ambience,`${object.id} out of sync`);
  assert.deepEqual(midway.objects.filter(o=>o.id!==object.id),initial.objects.filter(o=>o.id!==object.id),'Unrelated object moved');
  assert.deepEqual(midway.backgrounds,initial.backgrounds,'Background moved');assert.notDeepEqual(midway.routes,initial.routes,`${object.id} did not update the trails`);
  assert.equal(moved.w,object.w);assert.equal(moved.h,object.h);
  await page.mouse.move(start.x-22,start.y-14,{steps:5});await page.mouse.up();
  assert.deepEqual((await snapshot()).objects,(await snapshot()).ambience);
  console.log('PASS drag + live sync:',object.id);
 }
 await page.getByRole('button',{name:'Reset Arrangement',exact:true}).click();assert.deepEqual((await snapshot()).objects,initial.objects);assert.deepEqual((await snapshot()).routes,initial.routes);
 // Keyboard keeps every object accessible even with complete overlaps.
 const table=page.locator('.physical-panel [data-object-id="central_seating_01"]');await table.focus();await page.keyboard.press('ArrowRight');
 assert((await snapshot()).objects.find(o=>o.id==='central_seating_01').x>initial.objects.find(o=>o.id==='central_seating_01').x);
 await page.getByRole('button',{name:'Reset Arrangement',exact:true}).click();
 // Pointer capture + bounds: releasing outside the map must stop the drag.
 let start=await grabPoint('tree_cluster_01');await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(-400,-400,{steps:8});await page.mouse.up();
 const clamped=await snapshot();assert(clamped.objects[0].x>=0&&clamped.objects[0].y>=0);await page.mouse.move(500,400);assert.deepEqual((await snapshot()).objects,clamped.objects);
 // Coordinates survive resize, including during an active drag.
 await page.getByRole('button',{name:'Reset Arrangement',exact:true}).click();start=await grabPoint('central_seating_01');await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(start.x+10,start.y+5);
 await page.setViewportSize({width:1000,height:900});await page.mouse.move(300,300);await page.mouse.up();const beforeResize=await snapshot();let positions=beforeResize.objects;
 for(const width of [900,390,1600]){await page.setViewportSize({width,height:1000});const state=await snapshot();assert.deepEqual(state.objects,positions);assert.deepEqual(state.objects,state.ambience);assert.deepEqual(state.routes,beforeResize.routes);}
 await page.getByRole('button',{name:'Reset Arrangement',exact:true}).click();assert.deepEqual((await snapshot()).objects,initial.objects);assert.deepEqual((await snapshot()).routes,initial.routes);
 assert.deepEqual(errors,[]);
 console.log('PASS reset, keyboard, pointer capture, boundaries, dynamic trails, resize synchronization, no browser errors.');
 await browser.close();
})();
