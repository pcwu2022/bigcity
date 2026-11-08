import test from 'node:test';
import assert from 'node:assert/strict';
import {POPULATION_AREAS,TOTAL_POPULATION,circleFractionWithin,populationComparison} from '../population.js';
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≈ ${expected}`);
test('population weights reproduce the historical official totals',()=>{
 assert.equal(POPULATION_AREAS.length,16);
 assert.equal(POPULATION_AREAS.slice(0,3).reduce((s,a)=>s+a.population,0),457328);
 assert.equal(POPULATION_AREAS.slice(3).reduce((s,a)=>s+a.population,0),594641);
 assert.equal(TOTAL_POPULATION,1051969);
});
test('circle overlap covers disjoint, contained, centered and partial cases',()=>{
 near(circleFractionWithin(1,2,4),0);
 near(circleFractionWithin(7,2,4),1);
 near(circleFractionWithin(5,10,0),.25);
 near(circleFractionWithin(2,10,3),.04);
 near(circleFractionWithin(1,1,1),(2*Math.PI/3-Math.sqrt(3)/2)/Math.PI);
});
test('population comparison is bounded and gets worse with increasing distance',()=>{
 assert.equal(populationComparison(0).farther,TOTAL_POPULATION);
 assert.equal(populationComparison(1000).farther,0);
 let previous=100;
 for(const km of [.1,.5,1,2,3,5,10,20,50]){
  const result=populationComparison(km);
  assert.ok(result.percent>=0&&result.percent<=previous);previous=result.percent;
  near(result.closer+result.farther,result.total);
 }
 assert.equal(populationComparison(-1),null);
 assert.equal(populationComparison(NaN),null);
 assert.equal(populationComparison(Infinity),null);
});
test('overlap stays continuous at both circle tangencies',()=>{
 near(circleFractionWithin(2-1e-9,3,5),circleFractionWithin(2+1e-9,3,5));
 near(circleFractionWithin(8-1e-9,3,5),circleFractionWithin(8+1e-9,3,5));
 assert.equal(circleFractionWithin(1,0,3),null);
});
