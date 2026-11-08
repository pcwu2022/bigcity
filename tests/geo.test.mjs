import test from 'node:test';
import assert from 'node:assert/strict';
import {DESTINATION,distanceKm,bearing,projectSpeed,windProjection,driftArrival,duration} from '../geo.js';
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≈ ${b}`);
test('distance and bearings work across quadrants and the date line',()=>{near(distanceKm(DESTINATION),0);near(bearing({lat:0,lon:0},{lat:1,lon:0}),0);near(bearing({lat:0,lon:0},{lat:0,lon:1}),90);near(bearing({lat:0,lon:0},{lat:-1,lon:0}),180);near(bearing({lat:0,lon:0},{lat:0,lon:-1}),270);near(distanceKm({lat:0,lon:179},{lat:0,lon:-179}),222.38985,.001);});
test('velocity projects toward, away, and sideways',()=>{near(projectSpeed(10,30,30),10);near(projectSpeed(10,210,30),-10);near(projectSpeed(10,120,30),0);near(projectSpeed(10,350,10),9.396926,.00001);});
test('meteorological wind reverses source direction',()=>{near(windProjection(20,0,180),20);near(windProjection(20,0,0),-20);near(windProjection(20,90,0),0);});
test('crosswind never claims literal arrival and headwind has no ETA',()=>{const d=driftArrival(10,20,225,0);near(d.minutes,42.4264,.001);near(d.missKm,10);assert.equal(driftArrival(10,20,0,0).minutes,null);assert.equal(driftArrival(10,0,180,0).minutes,null);});
test('ETA formats minute, hour and day intervals',()=>{assert.equal(duration(.2),'< 1 分鐘');assert.equal(duration(7.1),'8 分鐘');assert.equal(duration(80),'1 小時 20 分');assert.equal(duration(1440),'1 天 0 小時');assert.equal(duration(Infinity),'—');});
