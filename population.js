// Official population weights, with deliberately coarse, ASSUMED residential
// circles. Circle centers/radii are design assumptions, not census geometries.
// City: 2024-11; County: 2024-12. See the linked sources in the UI and README.
import {distanceKm,DESTINATION} from './geo.js';
export const POPULATION_AREAS = [
 {name:'東區',population:224100,lat:24.790,lon:120.997,radiusKm:3.5},
 {name:'北區',population:153918,lat:24.817,lon:120.953,radiusKm:3},
 {name:'香山區',population:79310,lat:24.770,lon:120.927,radiusKm:4},
 {name:'竹北市',population:219605,lat:24.833,lon:121.015,radiusKm:4},
 {name:'竹東鎮',population:97733,lat:24.744,lon:121.080,radiusKm:4},
 {name:'新埔鎮',population:33464,lat:24.829,lon:121.073,radiusKm:3},
 {name:'關西鎮',population:26388,lat:24.791,lon:121.177,radiusKm:4},
 {name:'湖口鄉',population:83748,lat:24.883,lon:121.030,radiusKm:4},
 {name:'新豐鄉',population:59336,lat:24.895,lon:120.986,radiusKm:3.5},
 {name:'芎林鄉',population:20404,lat:24.774,lon:121.078,radiusKm:2.5},
 {name:'橫山鄉',population:11990,lat:24.717,lon:121.124,radiusKm:4},
 {name:'北埔鄉',population:8396,lat:24.700,lon:121.057,radiusKm:3},
 {name:'寶山鄉',population:14534,lat:24.755,lon:120.997,radiusKm:4},
 {name:'峨眉鄉',population:5081,lat:24.685,lon:121.020,radiusKm:3},
 {name:'尖石鄉',population:9523,lat:24.650,lon:121.240,radiusKm:9},
 {name:'五峰鄉',population:4439,lat:24.600,lon:121.130,radiusKm:6}
];
export const TOTAL_POPULATION=POPULATION_AREAS.reduce((sum,area)=>sum+area.population,0);
// Fraction of a residential circle falling inside a mall-centered distance ring.
// Exact circle intersection keeps the percentile continuous (no random samples).
export function circleFractionWithin(distance,radius,separation){
 if(![distance,radius,separation].every(Number.isFinite)||distance<0||radius<=0||separation<0)return null;
 if(distance===0||distance<=separation-radius)return 0;
 if(distance>=separation+radius)return 1;
 if(separation===0||distance<=radius-separation)return Math.min(1,(distance/radius)**2);
 const clamp=n=>Math.max(-1,Math.min(1,n));
 const a=Math.acos(clamp((separation**2+radius**2-distance**2)/(2*separation*radius)));
 const b=Math.acos(clamp((separation**2+distance**2-radius**2)/(2*separation*distance)));
 const lens=radius**2*a+distance**2*b-.5*Math.sqrt(Math.max(0,(-separation+radius+distance)*(separation+radius-distance)*(separation-radius+distance)*(separation+radius+distance)));
 return Math.max(0,Math.min(1,lens/(Math.PI*radius**2)));
}
const model=POPULATION_AREAS.map(area=>({...area,separation:distanceKm(area,DESTINATION)}));
export function populationComparison(distance){
 if(!Number.isFinite(distance)||distance<0)return null;
 const closer=model.reduce((sum,area)=>sum+area.population*circleFractionWithin(distance,area.radiusKm,area.separation),0);
 const farther=Math.max(0,Math.min(TOTAL_POPULATION,TOTAL_POPULATION-closer));
 return {total:TOTAL_POPULATION,closer:TOTAL_POPULATION-farther,farther,percent:farther/TOTAL_POPULATION*100};
}
