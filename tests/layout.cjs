const { chromium }=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage();await page.goto(process.env.GREENACRE_TEST_URL||'http://127.0.0.1:4174/');await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.evaluate(()=>document.fonts.ready);
 for(const width of [1600,1024,900,760,390,320]){
  await page.setViewportSize({width,height:1100});
  const layout=await page.evaluate(()=>{
   const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   return {physical:box('.physical-panel .map-canvas'),sensory:box('.ambience-panel .map-canvas'),reading:box('.atmosphere-profile'),key:box('.sensory-key'),overflow:document.documentElement.scrollWidth>innerWidth,checkboxes:document.querySelectorAll('.sensory-key input').length,fonts:document.fonts.check('500 16px "Cormorant Garamond"')&&document.fonts.check('400 16px "DM Sans"')};
  });
  assert(Math.abs(layout.physical.width-layout.sensory.width)<.05);assert(Math.abs(layout.physical.height-layout.sensory.height)<.05);assert(!layout.overflow,`Overflow at ${width}`);assert.equal(layout.checkboxes,8);assert(layout.fonts);
  if(width>760){assert.equal(layout.physical.y,layout.sensory.y);assert.equal(layout.reading.y,layout.key.y);assert(layout.reading.y>layout.physical.bottom);assert(layout.key.x>layout.reading.x);}
  else {assert(layout.sensory.y>layout.physical.bottom);assert(layout.reading.y>layout.sensory.bottom);assert(layout.key.y>layout.reading.bottom);}
  console.log('PASS editorial layout',width);
  if(process.env.GREENACRE_SCREENSHOTS&&[1600,390].includes(width))await page.screenshot({path:`/tmp/greenacre-qa/editorial-${width}.png`,fullPage:true});
 }
}finally{await browser.close()}})();
