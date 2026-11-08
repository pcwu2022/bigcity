export const DESTINATION = {lat:24.81000,lon:120.97750};
// Approximate mall-block arrival area; larger exit radius prevents GPS jitter repeats.
export const ARRIVAL_RADIUS_KM = .2;
export const DEPARTURE_RADIUS_KM = .3;
const rad = n => n*Math.PI/180;
export const normalize = n => (n%360+360)%360;
export function distanceKm(a,b=DESTINATION) {
 const dLat=rad(b.lat-a.lat),dLon=rad(b.lon-a.lon);
 const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(Math.min(1,h)),Math.sqrt(Math.max(0,1-h)));
}
export function bearing(a,b=DESTINATION) {
 const dLon=rad(b.lon-a.lon),p1=rad(a.lat),p2=rad(b.lat);
 return normalize(Math.atan2(Math.sin(dLon)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dLon))*180/Math.PI);
}
export const projectSpeed=(speed,heading,target)=>speed*Math.cos(rad(heading-target));
export function windProjection(speed,from,target){return projectSpeed(speed,normalize(from+180),target);}
export function driftArrival(distance,speed,from,target){
 const toward=windProjection(speed,from,target);
 const cross=Math.abs(speed*Math.sin(rad(normalize(from+180)-target)));
 return {toward,cross,minutes:toward>0.1?distance/toward*60:null,missKm:toward>0.1?distance*cross/toward:null};
}
export function duration(minutes){
 if(!Number.isFinite(minutes)||minutes<0)return '—';
 if(minutes<1)return '< 1 分鐘';
 const m=Math.ceil(minutes);if(m<60)return `${m} 分鐘`;
 if(m<1440)return `${Math.floor(m/60)} 小時 ${m%60} 分`;
 return `${Math.floor(m/1440)} 天 ${Math.floor(m%1440/60)} 小時`;
}
export const cardinal=deg=>['北','東北','東','東南','南','西南','西','西北'][Math.round(normalize(deg)/45)%8];

export const GRAVITATIONAL_CONSTANT = 6.67430e-11; // m³ kg⁻¹ s⁻²
export const PERSON_MASS_KG = 80;
export const MALL_MASS_KG = 1e9; // Fixed hypothetical mall mass: 1 million tonnes.
// The mall is approximated as a point mass at DESTINATION. Suppress near-field
// results: a building's actual mass distribution is needed inside the block.
export function gravitationalForce(distanceMeters,mallMassKg=MALL_MASS_KG){
 if(!Number.isFinite(distanceMeters)||distanceMeters<=ARRIVAL_RADIUS_KM*1000||!Number.isFinite(mallMassKg)||mallMassKg<=0)return null;
 return GRAVITATIONAL_CONSTANT*PERSON_MASS_KG*mallMassKg/distanceMeters**2;
}
export function scientificForce(force){
 if(!Number.isFinite(force)||force<=0)return '—';
 const [coefficient,exponent]=force.toExponential(2).split('e');
 const superscripts={'-':'⁻','+':'','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
 return `${coefficient} × 10${[...exponent].map(c=>superscripts[c]).join('')}`;
}
