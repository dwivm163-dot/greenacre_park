const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1600,height:1000}});await p.goto(process.env.GREENACRE_TEST_URL || 'http://127.0.0.1:4174/');await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await p.evaluate(()=>document.fonts.ready);
 const obj=id=>p.locator(`.physical-panel [data-object-id="${id}"]`);
 const selected=()=>p.locator('.physical-panel [aria-pressed="true"]').getAttribute('data-object-id');
 await obj('central_seating_02').focus();for(let i=0;i<9;i++)await p.keyboard.press('Shift+ArrowLeft');
 const a=await obj('central_seating_01').boundingBox(),z=await obj('central_seating_02').boundingBox();assert(Math.abs(a.x-z.x)<.1&&Math.abs(a.y-z.y)<.1);
 await p.keyboard.down('Alt');await p.mouse.click(z.x+z.width/2,z.y+z.height/2);await p.keyboard.up('Alt');assert.equal(await selected(),'central_seating_01');
 await p.keyboard.down('Alt');await p.mouse.click(z.x+z.width/2,z.y+z.height/2);await p.keyboard.up('Alt');assert.equal(await selected(),'central_seating_02');
 // A cancelled pointer cannot leave the map stuck in dragging mode.
 await p.mouse.move(z.x+z.width/2,z.y+z.height/2);await p.mouse.down();await p.mouse.move(z.x+z.width/2+10,z.y+z.height/2+10);await p.locator('.physical-panel .map-canvas').dispatchEvent('pointercancel',{pointerId:1});assert.equal(await p.locator('.physical-panel .is-dragging').count(),0);await p.mouse.up();
 await p.getByRole('button',{name:'Reset Arrangement',exact:true}).click();
 // Push every object to both extremes via the same clamp used by pointer moves.
 const ids=await p.locator('.physical-panel .map-object').evaluateAll(os=>os.map(o=>o.dataset.objectId));
 for(const id of ids){await obj(id).focus();for(const key of ['Shift+ArrowLeft','Shift+ArrowUp','Shift+ArrowRight','Shift+ArrowDown'])for(let i=0;i<90;i++)await p.keyboard.press(key);
  const visible=await obj(id).evaluate(o=>{
   const image=o.querySelector('img'),r=o.getBoundingClientRect(),parent=o.closest('.map-canvas').getBoundingClientRect();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
   let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>=8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1)}
   const scale=Math.min(r.width/c.width,r.height/c.height),w=o.dataset.objectId==='stream'?r.width:c.width*scale,h=o.dataset.objectId==='stream'?r.height:c.height*scale;
   return {left:((r.x-parent.x)+(r.width-w)/2+left/c.width*w)/parent.width*1658,top:((r.y-parent.y)+(r.height-h)/2+top/c.height*h)/parent.height*949,right:((r.x-parent.x)+(r.width-w)/2+right/c.width*w)/parent.width*1658,bottom:((r.y-parent.y)+(r.height-h)/2+bottom/c.height*h)/parent.height*949};
  });assert(visible.left>=369.8&&visible.top>=109.8&&visible.right<=1295.2&&visible.bottom<=740.2,`${id} outside usable courtyard: ${JSON.stringify(visible)}`);
 }
 await p.getByRole('button',{name:'Reset Arrangement',exact:true}).click();console.log('PASS Alt-click cycles fully overlapping seats; pointer cancellation stops drag; all 17 visible illustrations stay within the usable courtyard at extreme bounds.');await b.close();
})();
