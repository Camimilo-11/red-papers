// Run after `npm run build` and `npx vite preview --host 127.0.0.1 --port 4173`.
// Set PLAYWRIGHT_MODULE / CHROMIUM_EXECUTABLE when using another local installation.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/THINKPAD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require(process.env.SHARP_MODULE || 'C:/Users/THINKPAD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const executablePath = process.env.CHROMIUM_EXECUTABLE || 'C:/Users/THINKPAD/Documents/Codex/playwright-browsers/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const url = process.env.MOBILE_TEST_URL || 'http://127.0.0.1:4173/';
const sizes = [[360,740],[375,667],[390,844],[412,915],[430,932],[768,1024],[820,1180],[844,390],[915,412]];
const codes = ['ECIAA','ECBI','ECFN','ECTEA','ECMC','ECQI','YTLC'];
const displayCode = code => code === 'ECIAA' ? 'ECAA' : code;
const output = 'test-assets/mobile';
const resultFile = process.env.MOBILE_RESULTS || `${output}/measurements-${Date.now()}.json`;
fs.mkdirSync(output,{recursive:true});
const results = {url, date:new Date().toISOString(), chromium:'', emulation:{isMobile:true,hasTouch:true,deviceScaleFactor:3,cpu:4,network:{name:'Fast 3G (legacy DevTools)',latency:562.5,downloadThroughput:1.6e6/8,uploadThroughput:750e3/8}}, devices:[], failures:[]};
const sleep = ms => new Promise(r=>setTimeout(r,ms));
function check(result, name, pass, detail) { result.checks.push({name,pass:!!pass,detail}); if(!pass) {results.failures.push({device:result.size,name,detail});console.log('FAIL',result.size,name);} }
async function swipe(cdp,x,y,dx,dy,ms=200) {
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,radiusX:4,radiusY:4,force:1}]});
  for(let i=1;i<=10;i++) { await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/10,y:y+dy*i/10,radiusX:4,radiusY:4,force:1}]}); await sleep(ms/10); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
}
async function geometry(page) {
  return page.evaluate(()=>{
    const rect = el => {if(!el)return null;const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};
    const s = document.querySelector('.touch-school-slide[aria-hidden="false"]');
    const title=s?.querySelector('h2'),mascot=s?.querySelector('.touch-school-mascot'),cta=s?.querySelector('button');
    const nav=document.querySelector('.touch-school-navigation'),active=nav?.querySelector('[aria-current]');
    const h=rect(title),m=rect(mascot),b=rect(cta),a=rect(active);
    const collide=(a,b)=>a&&b&&a.x<b.right-1&&a.right>b.x+1&&a.y<b.bottom-1&&a.bottom>b.y+1;
    return {width:innerWidth,height:innerHeight,scrollWidth:document.scrollingElement.scrollWidth,school:document.querySelector('.touch-school-stage')?.getAttribute('data-school'),stage:rect(document.querySelector('.touch-school-stage')),title:h,mascot:m,cta:b,font:title?parseFloat(getComputedStyle(title).fontSize):0,titleOverflow:title?title.scrollWidth>title.clientWidth+1:false,overlap:collide(h,m)||collide(h,b)||collide(m,b),ctaHit:b?document.elementFromPoint(b.x+b.w/2,b.y+b.h/2)?.closest('button')===cta:false,chip:a,chipCenterOffset:a?Math.abs(a.x+a.w/2-innerWidth/2):null,chipSizes:nav?[...nav.querySelectorAll('button')].map(el=>rect(el)):[],images:s?[...s.querySelectorAll('img')].every(el=>el.complete&&el.naturalWidth>0):false,graphCount:document.querySelectorAll('.touch-school-graph').length,graphOpacity:document.querySelector('.touch-school-graph')?getComputedStyle(document.querySelector('.touch-school-graph')).opacity:null};
  });
}
async function contrast(page) {
  const words = await page.evaluate(()=>{
    const spans=[...document.querySelectorAll('.touch-school-slide[aria-hidden="false"] h2 span')];
    return spans.map(el=>{const r=el.getBoundingClientRect();const ctx=document.createElement('canvas').getContext('2d');ctx.fillStyle=getComputedStyle(el).color;ctx.fillRect(0,0,1,1);return {x:r.x,y:r.y,w:r.width,h:r.height,color:[...ctx.getImageData(0,0,1,1).data].slice(0,3)};});
  });
  const probeStyle=await page.addStyleTag({content:'.touch-school-copy h2 { visibility:hidden !important; }'});
  const buffer=await page.screenshot();
  await probeStyle.evaluate(el=>el.remove());
  const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  let ratio=Infinity;
  for(const word of words) {
    const fg=lum(word.color);
    for(let y=Math.max(0,Math.floor(word.y*3));y<Math.min(info.height,(word.y+word.h)*3);y+=9) for(let x=Math.max(0,Math.floor(word.x*3));x<Math.min(info.width,(word.x+word.w)*3);x+=9) {
      const p=(y*info.width+x)*info.channels,bg=lum([data[p],data[p+1],data[p+2]]);
      ratio=Math.min(ratio,(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05));
    }
  }
  return Number(ratio.toFixed(2));
}
async function tapSchool(page,cdp,index,width,height) {
  for(let tries=0;tries<9;tries++) {
    const bounds=await page.locator(`.touch-school-navigation [data-school-index="${index}"]`).boundingBox();
    if(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width) {await page.locator(`.touch-school-navigation [data-school-index="${index}"]`).tap();return;}
    const nav=await page.locator('.touch-school-navigation').boundingBox();
    await swipe(cdp,width*.5,nav.y+nav.height/2,(bounds?.x ?? width)>width/2?-width*.55:width*.55,0,180);
    await sleep(120);
  }
  throw Error(`No se pudo alcanzar el chip ${index} con tacto`);
}
async function waitSchool(page,code) {
  await page.waitForFunction(code=>{const stage=document.querySelector('.touch-school-stage');return stage?.getAttribute('data-school')===code&&Math.abs(stage.getBoundingClientRect().top)<1;},code,{timeout:6000});
}
async function pageWidth(page) {return page.evaluate(()=>({w:innerWidth,sw:document.scrollingElement.scrollWidth}));}

let browser;
(async()=>{
 browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
 results.chromium=browser.version();
 for(const [width,height] of sizes.filter(([w,h])=>!process.env.MOBILE_SIZES||process.env.MOBILE_SIZES.split(',').includes(`${w}x${h}`))) {
  const result={size:`${width}x${height}`,checks:[],schools:[],errors:[]}; results.devices.push(result);
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:'no-preference'});
  const page=await context.newPage(),cdp=await context.newCDPSession(page);
  page.on('pageerror',e=>result.errors.push(e.message));
  await page.addInitScript(()=>{
    window.__mobile={tasks:[],shifts:[],phases:[],frames:[]};
    new PerformanceObserver(list=>list.getEntries().forEach(e=>window.__mobile.tasks.push({start:e.startTime,duration:e.duration}))).observe({type:'longtask',buffered:true});
    new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__mobile.shifts.push({start:e.startTime,value:e.value,sources:e.sources.map(s=>({node:s.node?.outerHTML?.slice(0,180),before:s.previousRect.toJSON(),after:s.currentRect.toJSON()}))});})).observe({type:'layout-shift',buffered:true});
    const observer=new MutationObserver(()=>{
      const startup=document.documentElement.dataset.simapcStartup;
      const startupState=startup?`startup-${startup}`:'';
      if(startupState&&window.__mobile.phases.at(-1)?.cls!==startupState)window.__mobile.phases.push({t:performance.now(),cls:startupState});
      const el=document.querySelector('.institutional-landing');if(el){const cls=el.className;if(window.__mobile.phases.at(-1)?.cls!==cls)window.__mobile.phases.push({t:performance.now(),cls});}
    });
    observer.observe(document,{subtree:true,attributes:true,attributeFilter:['class','data-simapc-startup','data-simapc-logos-ready'],childList:true});
  });
  try {
   await cdp.send('Network.enable'); await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
   await cdp.send('Network.emulateNetworkConditions',{offline:false,...results.emulation.network,name:undefined,connectionType:'cellular3g'});
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#simapc-startup').waitFor({timeout:5000});
   if(width===390&&!process.env.MOBILE_PERF_ONLY) await page.screenshot({path:`${output}/intro.png`});
   await page.waitForFunction(()=>document.documentElement.dataset.simapcStartup==='welcome'&&document.documentElement.dataset.simapcLogosReady==='true',{timeout:30000});
   result.welcomeVisibleMs=await page.evaluate(()=>performance.now());
   if(width===390&&!process.env.MOBILE_PERF_ONLY) await page.screenshot({path:`${output}/390x844-bienvenida-prioridad.png`});
   await page.waitForSelector('.institutional-landing-hero[data-assets-ready="true"]',{timeout:60000});
   await page.locator('.institutional-landing.is-done').waitFor(); await page.waitForTimeout(500);
   result.coldReadyMs=await page.evaluate(()=>performance.now());
   result.phases=await page.evaluate(()=>window.__mobile.phases);
   const intro=result.phases.find(p=>p.cls==='startup-intro'),transition=result.phases.find(p=>p.cls==='startup-welcome');
   check(result,'intro_1500ms',intro&&transition&&transition.t-intro.t>=1400&&transition.t-intro.t<2200,{intro,transition});
   check(result,'welcome_under_4s',result.welcomeVisibleMs<4000,result.welcomeVisibleMs);
   const logos=await page.locator('.institutional-landing-hero-emblem img').evaluateAll(imgs=>imgs.map(el=>{const b=el.getBoundingClientRect();return {loaded:el.complete&&el.naturalWidth>0,x:b.x,y:b.y,r:b.right,b:b.bottom,w:innerWidth,h:innerHeight};}));
   check(result,'welcome_logos',logos.length===7&&logos.every(b=>b.loaded&&b.x>=0&&b.r<=b.w&&b.y>=0&&b.b<=b.h),logos);
   const welcomeWidth=await pageWidth(page);check(result,'welcome_width',welcomeWidth.sw<=welcomeWidth.w,welcomeWidth);
   if(!process.env.MOBILE_PERF_ONLY) await page.screenshot({path:`${output}/${result.size}-bienvenida.png`});
   await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
   await swipe(cdp,width*.5,height*.5,0,-Math.min(200,height*.3)); await waitSchool(page,'ECIAA');
   await page.waitForTimeout(1100);
   check(result,'handoff',await page.locator('.touch-school-slide[aria-hidden="false"] .touch-school-mascot').evaluate(el=>Number(getComputedStyle(el).opacity)===1));
   await page.evaluate(()=>window.__graphIdentity=document.querySelector('.touch-school-graph'));
   if(!process.env.MOBILE_PERF_ONLY) {
   for(let i=0;i<7;i++) {
    if(i) {await swipe(cdp,width*.75,height*.65,0,-Math.min(200,height*.32));await waitSchool(page,codes[i]);await page.waitForTimeout(430);}
    const g=await geometry(page);result.schools.push(g);
    check(result,`${codes[i]}_geometry`,g.scrollWidth<=g.width&&Math.abs(g.stage.y)<1&&g.stage.h===g.height&&g.font>=28&&!g.titleOverflow&&!g.overlap&&g.title.x>=0&&g.title.right<=width&&g.title.y>=0&&g.cta.x>=16&&g.cta.right<=width-16&&g.cta.bottom<=height&&g.cta.h>=48&&g.ctaHit&&(width>height||g.mascot.bottom<=g.cta.y)&&g.images&&g.chipCenterOffset<2&&g.chipSizes.every(b=>b.w>=44&&b.h>=44)&&g.graphCount===1&&Number(g.graphOpacity)===.45,g);
    await page.screenshot({path:`${output}/${result.size}-${displayCode(codes[i]).toLowerCase()}.png`});
    g.contrast=await contrast(page);check(result,`${codes[i]}_contrast`,g.contrast>=4.5,g.contrast);
   }
   for(let i=5;i>=0;i--) {await swipe(cdp,width*.75,height*.4,0,Math.min(180,height*.27));await waitSchool(page,codes[i]);}
   check(result,'swipe_reverse',await page.locator('.touch-school-stage').getAttribute('data-school')==='ECIAA');
   }
   await tapSchool(page,cdp,6,width,height);await waitSchool(page,'YTLC');await page.waitForTimeout(400);
   check(result,'jump_graph_persistent',await page.evaluate(()=>window.__graphIdentity===document.querySelector('.touch-school-graph')));
   await tapSchool(page,cdp,0,width,height);await waitSchool(page,'ECIAA');await page.waitForTimeout(400);
   check(result,'jump_back',true);
   const fpsPromise=page.evaluate(()=>new Promise(resolve=>{
     const start=performance.now(),frames=[];const frame=t=>{frames.push(t);if(t-start<3000)requestAnimationFrame(frame);else{const intervals=frames.slice(1).map((v,i)=>v-frames[i]).sort((a,b)=>a-b);resolve({start,end:t,fps:(frames.length-1)*1000/(t-frames[0]),p95:intervals[Math.floor(intervals.length*.95)]});}};requestAnimationFrame(frame);
   }));
   for(let i=1;i<=5;i++) {await swipe(cdp,width*.75,height*.65,0,-Math.min(180,height*.3),160);await sleep(90);}
   result.performance=await fpsPromise;
   result.performance.tasks=await page.evaluate(({start,end})=>window.__mobile.tasks.filter(t=>t.start>=start&&t.start<end),result.performance);
   check(result,'five_fast_swipes',await page.locator('.touch-school-stage').getAttribute('data-school')==='ECQI');
   check(result,'swipe_no_long_tasks',result.performance.tasks.length===0,result.performance.tasks);
   check(result,'swipe_fps',result.performance.fps>=59.5,result.performance);
   result.shifts=await page.evaluate(()=>window.__mobile.shifts);result.cls=result.shifts.reduce((n,e)=>n+e.value,0);check(result,'cls_zero',result.cls===0,result.cls);
   if(!process.env.MOBILE_QUICK) {
   await tapSchool(page,cdp,0,width,height);await waitSchool(page,'ECIAA');await page.waitForTimeout(400);
   // Every school's CTA, public dashboard and catalog. Navigate through visible controls only.
   for(let i=0;i<7;i++) {
    if(i) {await tapSchool(page,cdp,i,width,height);await waitSchool(page,codes[i]);await page.waitForTimeout(400);}
    await page.locator('.touch-school-slide[aria-hidden="false"] .touch-school-cta').tap();
    await page.locator('.welcome-access').waitFor();
    const accessWidth=await pageWidth(page);check(result,`${codes[i]}_access`,accessWidth.sw<=accessWidth.w,accessWidth);
    await page.locator('.welcome-public').tap();await page.locator('.portal-app').waitFor();await page.waitForTimeout(200);
    const dashboardWidth=await pageWidth(page);check(result,`${codes[i]}_dashboard`,dashboardWidth.sw<=dashboardWidth.w,dashboardWidth);
    if(width===390&&i===4)await page.screenshot({path:`${output}/390x844-panel.png`});
    const menu=page.getByRole('button',{name:'Abrir menú',exact:true});if(await menu.isVisible())await menu.tap();
    await page.getByRole('button',{name:'Publicaciones y proyectos',exact:true}).tap();
    await page.getByRole('heading',{name:'Publicaciones y proyectos',exact:true}).waitFor();
    const catalogWidth=await pageWidth(page);check(result,`${codes[i]}_catalog`,catalogWidth.sw<=catalogWidth.w,catalogWidth);
    const search=page.getByRole('textbox',{name:'Buscar publicaciones y proyectos'});
    check(result,`${codes[i]}_input16`,await search.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16));
    await search.tap();await search.fill('');await page.keyboard.press('Enter');
    await page.getByText('Más filtros',{exact:true}).tap();const filterWidth=await pageWidth(page);check(result,`${codes[i]}_filters`,filterWidth.sw<=filterWidth.w,filterWidth);
    if(width===390&&i===4)await page.screenshot({path:`${output}/390x844-catalogo.png`});
    const detail=page.getByRole('button',{name:/^Ver detalle:/}).first();if(await detail.count()){await detail.tap();await page.getByRole('dialog').waitFor();const dw=await pageWidth(page);check(result,`${codes[i]}_detail`,dw.sw<=dw.w,dw);await page.getByRole('button',{name:'Cerrar detalle del producto'}).tap();}
    let backSteps=0;
    while(!await page.locator('.institutional-landing').count()&&backSteps++<8) {await page.goBack({waitUntil:'domcontentloaded'});await sleep(200);}
    if(!await page.locator('.institutional-landing').count())throw Error('El historial no volvió a la selección de escuelas');
    await page.locator('.institutional-landing-hero[data-assets-ready="true"]').waitFor();
    await page.locator('a[href="#escuelas"]').tap();await waitSchool(page,'ECIAA');await page.waitForTimeout(1000);
   }
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('.institutional-landing').waitFor();
   check(result,'session_intro_once',!await page.locator('.institutional-landing-curtain').count(),await page.locator('.institutional-landing').getAttribute('class'));
   await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.research-stage-selection.is-static').waitFor();
   check(result,'reduced_static',await page.locator('.research-stage-school-card').count()===7&&!await page.locator('.touch-school-stage').count());
   check(result,'reduced_no_animations',await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length===0));
   const staticWidth=await pageWidth(page);check(result,'reduced_width',staticWidth.sw<=staticWidth.w,staticWidth);
   if(width===390)await page.screenshot({path:`${output}/390x844-movimiento-reducido.png`,fullPage:true});
   check(result,'no_page_errors',result.errors.length===0,result.errors);
   }
  } catch(error) {check(result,'flow_completed',false,error.message);console.error(result.size,error.message);await page.screenshot({path:`${output}/${result.size}-error.png`}).catch(()=>{});}
  await context.close();
  fs.writeFileSync(resultFile,JSON.stringify(results,null,2));
  console.log(JSON.stringify({size:result.size,checks:result.checks.length,fail:result.checks.filter(c=>!c.pass).map(c=>c.name),fps:result.performance?.fps,cls:result.cls}));
 }
 await browser.close();
 console.log(`Completed: ${results.failures.length} failures. Measurements: ${resultFile}`);
 process.exitCode=results.failures.length?1:0;
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>browser?.close());
