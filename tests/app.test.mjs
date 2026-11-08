import test from 'node:test';
import assert from 'node:assert/strict';
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{textContent:'',hidden:true,disabled:false,value:id==='meatball-speed'?'10':'',style:{},handlers:{},setAttribute(k,v){this[k]=v;},querySelector(){return element(id+'-span');},addEventListener(name,fn){this.handlers[name]=fn;}});return elements.get(id);}
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
test('location tracks arrival, away motion, stale GPS and stop',()=>{element('locate-btn').handlers.click();assert.equal(element('mode-label').textContent,'GPS…');positionCallback({timestamp:Date.now(),coords:{latitude:24.81,longitude:120.9775,accuracy:10,speed:0,heading:null}});assert.equal(element('motion-eta').textContent,'抵達啦！');assert.equal(element('mode-label').textContent,'GPS');positionCallback({timestamp:Date.now(),coords:{latitude:24.80,longitude:120.9775,accuracy:10,speed:2,heading:180}});assert.match(element('motion-direction').textContent,/遠離/);assert.equal(element('motion-eta').textContent,'先轉個方向吧');assert.match(element('maps-link').href,/origin=/);positionCallback({timestamp:Date.now()-60000,coords:{latitude:24.80,longitude:120.9775,accuracy:10,speed:2,heading:0}});assert.equal(element('toward-speed').textContent,'—');assert.equal(element('mode-label').textContent,'STALE');element('locate-btn').handlers.click();assert.equal(cleared,true);assert.equal(element('mode-label').textContent,'DEMO');assert.ok(!element('maps-link').href.includes('origin='));});
test('denied location restores explicit demo state',()=>{element('locate-btn').handlers.click();errorCallback({code:1});assert.equal(element('mode-label').textContent,'DEMO');assert.match(element('notice').textContent,/權限/);assert.equal(element('locate-btn').disabled,false);});
