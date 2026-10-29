const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:900},isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto(process.env.GREENACRE_TEST_URL||'http://127.0.0.1:4174/');await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(()=>document.fonts.ready);
 const seat=page.locator('.physical-panel [data-object-id="central_seating_01"]');await seat.focus();const before=await seat.getAttribute('style'),rect=await seat.boundingBox();const x=rect.x+rect.width/2,y=rect.y+rect.height/2;
 const session=await context.newCDPSession(page);await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+i*3,y:y+i*2}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const after=await seat.getAttribute('style');assert.notEqual(after,before);assert.equal(after,await page.locator('.ambience-panel [data-object-id="central_seating_01"]').getAttribute('style'));
 await page.getByRole('button',{name:'Reset Arrangement',exact:true}).click();assert.equal(await seat.getAttribute('style'),before);console.log('PASS mobile touch drag, synchronized sensory layer, reset.');
}finally{await browser.close()}})();
