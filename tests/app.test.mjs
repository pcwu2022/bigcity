import test from 'node:test';
import assert from 'node:assert/strict';
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,disabled:false,value:id==='meatball-speed'?'10':id==='mall-mass'?'1000000':'',style:{},handlers:{},open:false,showCount:0,showModal(){this.open=true;this.showCount++;},close(){this.open=false;},setAttribute(k,v){this[k]=v;},querySelector(){return element(id+'-span');},addEventListener(name,fn){this.handlers[name]=fn;}});return elements.get(id);}
globalThis.document={getElementById:element,querySelector:element};
let positionCallback,errorCallback,cleared=false;
Object.defineProperty(globalThis,'navigator',{value:{geolocation:{watchPosition(ok,err){positionCallback=ok;errorCallback=err;return 7;},clearWatch(){cleared=true;}}},configurable:true});
globalThis.window={isSecureContext:true,addEventListener(){}};
globalThis.localStorage={getItem(){return null;},setItem(){}};
globalThis.fetch=async()=>({ok:true,json:async()=>({current:{wind_speed_10m:20,wind_direction_10m:225,time:'2026-11-08T10:00'}})});
globalThis.setInterval=()=>0;
await import('../app.js');
await new Promise(resolve=>setTimeout(resolve,0));
test('demo is labeled and preferences recalculate ETA',()=>{assert.equal(element('mode-label').textContent,'DEMO');assert.match(element('motion-tag').textContent,/示範/);const old=element('meatball-eta').textContent;element('meatball-speed').value='20';element('meatball-speed').handlers.input();assert.notEqual(element('meatball-eta').textContent,old);element('meatball-speed').value='0';element('meatball-speed').handlers.input();assert.equal(element('meatball-speed')['aria-invalid'],'true');assert.equal(element('meatball-eta').textContent,'請輸入 1–200');});
test('gravity updates with assumed mass and validates invalid input',()=>{
 const first=element('gravity-force').textContent;
 assert.match(first,/× 10/);assert.equal(element('gravity-unit').hidden,false);
 element('mall-mass').value='2000000';element('mall-mass').handlers.input();
 assert.notEqual(element('gravity-force').textContent,first);
 element('mall-mass').value='';element('mall-mass').handlers.input();
 assert.equal(element('gravity-force').textContent,'—');assert.equal(element('gravity-error').hidden,false);
 element('mall-mass').value='1000000';element('mall-mass').handlers.input();
 assert.equal(element('gravity-force').textContent,first);assert.equal(element('gravity-error').hidden,true);
});
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
