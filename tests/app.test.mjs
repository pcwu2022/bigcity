import test from 'node:test';
import assert from 'node:assert/strict';
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,disabled:false,value:id==='meatball-speed'?'10':'',style:{},handlers:{},open:false,showCount:0,showModal(){this.open=true;this.showCount++;},close(){this.open=false;},setAttribute(k,v){this[k]=v;},querySelector(){return element(id+'-span');},addEventListener(name,fn){this.handlers[name]=fn;}});return elements.get(id);}
globalThis.document={getElementById:element,querySelector:element};
let positionCallback,errorCallback,cleared=false,watchCalls=0;
Object.defineProperty(globalThis,'navigator',{value:{geolocation:{watchPosition(ok,err){watchCalls++;positionCallback=ok;errorCallback=err;return 7;},clearWatch(){cleared=true;}}},configurable:true});
const orientationHandlers={};
globalThis.DeviceOrientationEvent={};
globalThis.window={isSecureContext:true,DeviceOrientationEvent,addEventListener(name,handler){orientationHandlers[name]=handler;}};
globalThis.localStorage={getItem(){return null;},setItem(){}};
globalThis.fetch=async()=>({ok:true,json:async()=>({current:{wind_speed_10m:20,wind_direction_10m:225,time:'2026-11-08T10:00'}})});
globalThis.setInterval=()=>0;
await import('../app.js');
await new Promise(resolve=>setTimeout(resolve,0));
test('startup dialog explains access without automatically requesting GPS',()=>{
 const dialog=element('location-permission-dialog');
 assert.equal(dialog.open,true);assert.equal(dialog.showCount,1);assert.equal(watchCalls,0);
 element('permission-demo').handlers.click();
 assert.equal(dialog.open,false);assert.equal(watchCalls,0);assert.equal(element('mode-label').textContent,'DEMO');
});
test('demo is labeled and preferences recalculate ETA',()=>{assert.equal(element('mode-label').textContent,'DEMO');assert.match(element('motion-tag').textContent,/示範/);const old=element('meatball-eta').textContent;element('meatball-speed').value='20';element('meatball-speed').handlers.input();assert.notEqual(element('meatball-eta').textContent,old);element('meatball-speed').value='0';element('meatball-speed').handlers.input();assert.equal(element('meatball-speed')['aria-invalid'],'true');assert.equal(element('meatball-eta').textContent,'請輸入 1–200');});
test('location tracks arrival, away motion, stale GPS and stop',()=>{element('locate-btn').handlers.click();assert.equal(element('mode-label').textContent,'GPS…');positionCallback({timestamp:Date.now(),coords:{latitude:24.81,longitude:120.9775,accuracy:10,speed:0,heading:null}});assert.equal(element('motion-eta').textContent,'抵達啦！');assert.equal(element('gravity-force').textContent,'—');assert.match(element('gravity-note').textContent,/近場/);assert.equal(element('mode-label').textContent,'GPS');positionCallback({timestamp:Date.now(),coords:{latitude:24.80,longitude:120.9775,accuracy:10,speed:2,heading:180}});assert.match(element('motion-direction').textContent,/遠離/);assert.equal(element('motion-eta').textContent,'先轉個方向吧');assert.match(element('maps-link').href,/origin=/);positionCallback({timestamp:Date.now()-60000,coords:{latitude:24.80,longitude:120.9775,accuracy:10,speed:2,heading:0}});assert.equal(element('toward-speed').textContent,'—');assert.equal(element('mode-label').textContent,'STALE');assert.equal(element('gravity-force').textContent,'—');element('locate-btn').handlers.click();assert.equal(cleared,true);assert.equal(element('mode-label').textContent,'DEMO');assert.ok(!element('maps-link').href.includes('origin='));});
test('denied location restores explicit demo state',()=>{element('locate-btn').handlers.click();errorCallback({code:1});assert.equal(element('mode-label').textContent,'DEMO');assert.match(element('notice').textContent,/權限/);assert.equal(element('locate-btn').disabled,false);});

test('welcome appears once per visit and ignores noisy or stale GPS fixes',()=>{
 const dialog=element('welcome-dialog'),before=dialog.showCount;
 dialog.close();element('locate-btn').handlers.click();
 const fix=(lat,accuracy=10,age=0)=>positionCallback({timestamp:Date.now()-age,coords:{latitude:lat,longitude:120.9775,accuracy,speed:0,heading:null}});
 // Establish a reliable position outside, then enter near the edge of the block.
 fix(24.814);fix(24.8115,150);fix(24.8115,10,60000);
 assert.equal(dialog.showCount,before);
 fix(24.8115);assert.equal(dialog.showCount,before+1);assert.equal(dialog.open,true);
 dialog.close();fix(24.81);element('meatball-speed').handlers.input();
 assert.equal(dialog.showCount,before+1);assert.equal(dialog.open,false);
 // Moving just outside the arrival radius, or a bad distant fix, must not rearm.
 fix(24.812);fix(24.814,150);fix(24.814,10,60000);fix(24.8115);
 assert.equal(dialog.showCount,before+1);
 // A confirmed departure permits a second welcome on re-entry.
 fix(24.814);fix(24.8115);
 assert.equal(dialog.showCount,before+2);assert.equal(dialog.open,true);
 dialog.close();element('locate-btn').handlers.click();
 assert.equal(dialog.showCount,before+2);
});

test('startup enable button closes explanation and requests location',()=>{
 const before=watchCalls,dialog=element('location-permission-dialog');
 dialog.showModal();element('permission-enable').handlers.click();
 assert.equal(dialog.open,false);assert.equal(watchCalls,before+1);assert.equal(element('mode-label').textContent,'GPS…');
 errorCallback({code:1});assert.equal(element('mode-label').textContent,'DEMO');
});

test('shared compass converts wind FROM to flow TO and rotates both bearings with the phone',async()=>{
 await element('weather-refresh').handlers.click();
 assert.equal(element('wind-orbit').hidden,false);
 assert.equal(element('wind-orbit').style.transform,'rotate(45deg)');
 const originalMall=Number(element('orbit').style.transform.match(/rotate\((.*)deg\)/)[1]);
 await element('compass-btn').handlers.click();
 orientationHandlers.deviceorientation({webkitCompassHeading:90,webkitCompassAccuracy:10});
 assert.equal(element('wind-orbit').style.transform,'rotate(315deg)');
 const rotatedMall=Number(element('orbit').style.transform.match(/rotate\((.*)deg\)/)[1]);
 assert.ok(Math.abs(rotatedMall-(originalMall+270)%360)<1e-8);
 assert.match(element('compass')['aria-label'],/西南風.*往東北吹/);
});
test('refresh, weather failure and calm conditions hide the wind sector',async()=>{
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error('offline');};
 const pending=element('weather-refresh').handlers.click();
 assert.equal(element('wind-orbit').hidden,true);
 await pending;assert.equal(element('wind-orbit').hidden,true);
 assert.match(element('wind-direction').textContent,/無法取得/);
 globalThis.fetch=async()=>({ok:true,json:async()=>({current:{wind_speed_10m:0,wind_direction_10m:225,time:'2026-11-08T10:00'}})});
 await element('weather-refresh').handlers.click();
 assert.equal(element('wind-orbit').hidden,true);assert.equal(element('wind-direction').textContent,'目前無風');
 globalThis.fetch=originalFetch;
});

test('phone compass starts automatically and falls back on stale or unsupported sensors',async()=>{
 // Listeners exist on load without pressing the compass button.
 assert.equal(typeof orientationHandlers.deviceorientation,'function');
 window.screen={orientation:{angle:90}};
 orientationHandlers.deviceorientation({webkitCompassHeading:30,webkitCompassAccuracy:10});
 assert.equal(element('compass-mode').textContent,'手機指北針');
 assert.equal(element('compass-btn')['aria-pressed'],'true');
 const mallWithPhone=element('orbit').style.transform;
 const now=Date.now;
 try{Date.now=()=>now()+21000;element('meatball-speed').handlers.input();}
 finally{Date.now=now;}
 assert.equal(element('compass-mode').textContent,'預設方位');
 assert.notEqual(element('orbit').style.transform,mallWithPhone);
 const sensor=window.DeviceOrientationEvent;delete window.DeviceOrientationEvent;
 await element('compass-btn').handlers.click();
 assert.equal(element('compass-mode').textContent,'預設方位');
 const fixed=element('orbit').style.transform;
 orientationHandlers.deviceorientation({absolute:false,alpha:42});
 assert.equal(element('orbit').style.transform,fixed);
 window.DeviceOrientationEvent=sensor;window.screen={orientation:{angle:0}};
});
test('iOS waits for a gesture, requests compass with location, and handles denied access',async()=>{
 let requests=0;
 window.DeviceOrientationEvent={requestPermission:async()=>{requests++;return 'denied';}};
 await import('../app.js?ios-permission-test');
 assert.equal(requests,0);assert.equal(element('compass-mode').textContent,'啟用指北針');
 element('permission-enable').handlers.click();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(requests,1);assert.equal(element('compass-mode').textContent,'預設方位');
 window.DeviceOrientationEvent.requestPermission=async()=>{requests++;return 'granted';};
 await element('compass-btn').handlers.click();
 orientationHandlers.deviceorientation({absolute:true,alpha:270});
 assert.equal(element('compass-mode').textContent,'手機指北針');
 assert.equal(element('compass-btn')['aria-pressed'],'true');
});
