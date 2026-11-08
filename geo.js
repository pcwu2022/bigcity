export const DESTINATION = {lat:24.81000,lon:120.97750};
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
