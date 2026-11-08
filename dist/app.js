import {gravitationalForce,scientificForce,ARRIVAL_RADIUS_KM,DEPARTURE_RADIUS_KM,DESTINATION,distanceKm,bearing,projectSpeed,windProjection,driftArrival,duration,cardinal,normalize} from './geo.js';
const $=id=>document.getElementById(id);
const demo={lat:24.8016,lon:120.9716};
let position={...demo},mode='demo',watchId=null,previous=null,speed=4.2,heading=bearing(demo),fixTime=Date.now(),accuracy=null;
let wind=null,weatherTime=null,weatherController=null,weatherVersion=0,lastWeatherPosition=null,lastWeatherFetch=0;
let compassHeading=null,compassTime=0,orientationEnabled=false;
let welcomedThisVisit=false;
function checkArrival(){
 // Only fresh, reasonably accurate real GPS fixes can trigger or reset a visit.
 if(mode!=='live'||Date.now()-fixTime>=30000||!Number.isFinite(accuracy)||accuracy<0||accuracy>80)return;
 const distance=distanceKm(position);
 if(distance>DEPARTURE_RADIUS_KM){welcomedThisVisit=false;return;}
 if(distance<=ARRIVAL_RADIUS_KM&&!welcomedThisVisit){
  welcomedThisVisit=true;
  if(!$('welcome-dialog').open)$('welcome-dialog').showModal();
 }
}
const notice=text=>{$('notice').textContent=text;$('notice').hidden=!text;};
function resetDemo(){
 if(watchId!==null)navigator.geolocation.clearWatch(watchId);
 watchId=null;mode='demo';position={...demo};speed=4.2;heading=bearing(demo);previous=null;accuracy=null;
 $('locate-btn').disabled=false;$('locate-btn').querySelector('span').textContent='使用我的位置';
 notice('已停止定位，回到示範位置與示範移動速度。');render();fetchWeather();
}
function render(){
 const distance=distanceKm(position),target=bearing(position),arrived=distance<=ARRIVAL_RADIUS_KM;
 const fresh=mode==='demo'||Date.now()-fixTime<30000;
 const projected=fresh&&speed!==null&&heading!==null?projectSpeed(speed,heading,target):speed===0&&fresh?0:null;
 $('mode-label').textContent=mode==='demo'?'DEMO':mode==='loading'?'GPS…':fresh?'GPS':'STALE';
 $('location-label').textContent=mode==='demo'?'探索模式 · 新竹火車站附近':mode==='loading'?'正在尋找你的位置…':!fresh?'定位已過期 · 等待新的位置':`目前位置 · ${position.lat.toFixed(4)}, ${position.lon.toFixed(4)}${accuracy!==null?' · ±'+Math.round(accuracy)+'m':''}`;
 $('distance').textContent=distance<1?Math.round(distance*1000).toString():distance.toFixed(2);
 $('distance-unit').textContent=distance<1?'m':'km';
 $('maps-link').href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(`${DESTINATION.lat},${DESTINATION.lon}`)+(mode==='live'&&fresh?'&origin='+encodeURIComponent(`${position.lat},${position.lon}`):'');
 const compassFresh=compassHeading!==null&&Date.now()-compassTime<20000;
 const angle=normalize(target-(compassFresh?compassHeading:0));
 $('orbit').style.transform=`rotate(${angle}deg)`;
 document.querySelector('.mall-marker').style.transform=`rotate(${-angle}deg)`;
 const windVisible=wind!==null&&wind.speed>0;
 $('wind-orbit').hidden=!windVisible;
 if(windVisible)$('wind-orbit').style.transform=`rotate(${normalize(wind.from+180-(compassFresh?compassHeading:0))}deg)`;
 $('compass').setAttribute('aria-label',`巨城方位 ${Math.round(target)} 度；${windVisible?`${cardinal(wind.from)}風 ${wind.speed.toFixed(1)} 公里每小時，往${cardinal(wind.from+180)}吹`:wind?'目前無風':'風況尚未取得'}`);
 // Cardinal letters stay meaningful as the phone rotates.
 const northRotation=compassFresh?-compassHeading:0;
 for(const [key,offset] of [['n',0],['e',90],['s',180],['w',270]]){
 const el=document.querySelector('.direction.'+key),a=(offset+northRotation)*Math.PI/180;
 el.style.left=`${50+43*Math.sin(a)}%`;el.style.top=`${50-43*Math.cos(a)}%`;el.style.right='auto';el.style.bottom='auto';el.style.transform='translate(-50%,-50%)';
 }
 $('compass-mode').textContent=compassFresh?'手機朝向 · 近似北方':'北方朝上';
 $('bearing-value').textContent=arrived?'巨城就在這裡！':`${cardinal(target)}方 ${Math.round(target)}°`;
 $('toward-speed').textContent=projected===null?'—':`${projected>0?'+':''}${projected.toFixed(1)}`;
 $('motion-tag').textContent=mode==='demo'?'示範移動':!fresh?'定位已過期':speed===null?'等待移動':'即時移動';
 let movingText='等待可靠的移動資料',eta='暫時無法估算';
 if(arrived&&fresh){movingText='◎ 你已抵達巨城附近';eta='抵達啦！';}
 else if(projected!==null){if(projected>.5){movingText='↗ 正在靠近巨城';eta=duration(distance/projected*60)+'抵達';}else if(projected<-.5){movingText='↙ 正在遠離巨城';eta='先轉個方向吧';}else {movingText=speed<.5?'◎ 目前停留中':'→ 幾乎沒有靠近巨城';eta='等你朝巨城出發';}}
 $('motion-direction').textContent=movingText;$('motion-eta').textContent=eta;
 $('motion-note').textContent=mode==='demo'?'示範速度；啟用定位後，以 GPS 速度投影計算。':!fresh?'位置超過 30 秒未更新，暫停速度與估時。':'GPS 可能有誤差；速度為朝巨城的向量分量。';
 const bar=$('speed-bar'),fraction=Math.min(50,Math.abs(projected??0)/15*50);
 bar.style.left=projected<0?`${50-fraction}%`:'50%';bar.style.width=fraction+'%';bar.style.background=projected<0?'#bf2730':'#8a9375';
 const force=gravitationalForce(distance*1000);
 const usablePosition=mode==='demo'||(mode==='live'&&fresh&&Number.isFinite(accuracy)&&accuracy>=0&&accuracy<=80);
 $('gravity-force').textContent=usablePosition?scientificForce(force):'—';
 $('gravity-unit').hidden=force===null||!usablePosition;
 $('gravity-note').textContent=!usablePosition?'等待準確、即時的定位資料，再計算引力。':arrived?'已進入巨城範圍；近場需要建築物質量分布，不適用點質量估算。':mode==='demo'?'使用示範位置與假設質量估算；單位為牛頓。':'使用目前直線距離與假設質量估算；單位為牛頓。';
 const meatball=Number($('meatball-speed').value),valid=Number.isFinite(meatball)&&meatball>=1&&meatball<=200;
 $('meatball-speed').setAttribute('aria-invalid',String(!valid));
 $('meatball-eta').textContent=!valid?'請輸入 1–200':arrived?'抵達啦！':duration(distance/meatball*60)+'抵達';
 if(wind){
 const drift=driftArrival(distance,wind.speed,wind.from,target);
 $('wind-speed').textContent=wind.speed.toFixed(1);
 $('wind-direction').textContent=wind.speed===0?'目前無風':`${cardinal(wind.from)}風 ${Math.round(wind.from)}° · 往${cardinal(wind.from+180)}吹`;
 $('wind-eta').textContent=arrived?'抵達啦！':drift.minutes===null?'風沒有往巨城吹':duration(drift.minutes)+'（投影）';
 $('wind-note').textContent=arrived?'巨城就在附近，不需要搭風了。':drift.minutes===null?`朝巨城分量 ${drift.toward.toFixed(1)} km/h；今天的風不順路。`:`朝巨城分量 +${drift.toward.toFixed(1)} km/h；側風偏移約 ${drift.missKm.toFixed(1)} km，未必抵達。`;
 $('weather-source').textContent=`Open-Meteo · ${weatherTime?.replace('T',' ')??''} 台灣時間 ↗`;
 }
}
async function fetchWeather(){
 const version=++weatherVersion;weatherController?.abort();weatherController=new AbortController();
 const timer=setTimeout(()=>weatherController?.abort(),12000);
 $('weather-refresh').disabled=true;$('weather-refresh').textContent='取得風況…';
 lastWeatherPosition={...position};lastWeatherFetch=Date.now();
 wind=null;render();$('wind-speed').textContent='—';$('wind-eta').textContent='等待風來';$('wind-direction').textContent='正在取得當地風況…';$('wind-note').textContent='風向為風吹來的方向。';$('weather-source').textContent='Open-Meteo · 模型風況 ↗';
 try {
 const url=new URL('https://api.open-meteo.com/v1/forecast');
 url.search=new URLSearchParams({latitude:String(position.lat),longitude:String(position.lon),current:'wind_speed_10m,wind_direction_10m',wind_speed_unit:'kmh',timezone:'Asia/Taipei',forecast_days:'1'});
 const response=await fetch(url,{signal:weatherController.signal});if(!response.ok)throw Error('Weather unavailable');const data=await response.json();if(version!==weatherVersion)return;
 const current=data.current;if(!current||!Number.isFinite(current.wind_speed_10m)||!Number.isFinite(current.wind_direction_10m))throw Error('Invalid wind data');
 wind={speed:current.wind_speed_10m,from:current.wind_direction_10m};weatherTime=current.time;lastWeatherPosition={...position};lastWeatherFetch=Date.now();render();
 }catch(error){if(version!==weatherVersion)return;$('wind-direction').textContent='風況暫時無法取得';$('wind-eta').textContent='等風，也等網路';$('wind-note').textContent='請檢查網路，點「更新風況」重試。';}
 finally{clearTimeout(timer);if(version===weatherVersion){$('weather-refresh').disabled=false;$('weather-refresh').textContent='更新風況 ↻';}}
}
function onPosition(result){
 const c=result.coords,next={lat:c.latitude,lon:c.longitude};
 if(!Number.isFinite(next.lat)||!Number.isFinite(next.lon))return;
 mode='live';accuracy=c.accuracy;position=next;fixTime=result.timestamp||Date.now();speed=null;heading=null;
 const reliable=c.accuracy<=80;
 if(reliable&&Number.isFinite(c.speed)&&c.speed>=0){speed=c.speed*3.6;heading=Number.isFinite(c.heading)?normalize(c.heading):null;if(speed<.5)speed=0;}
 if(reliable&&speed===null&&previous){
 const seconds=(fixTime-previous.time)/1000,d=distanceKm(previous.position,next)*1000;
 if(seconds>=4&&seconds<=30&&previous.accuracy<=80&&d>Math.max(8,(c.accuracy+previous.accuracy)*.75)){
 const estimate=d/seconds*3.6;if(estimate<=180){speed=estimate;heading=bearing(previous.position,next);}
 }
 }
 if(!previous||fixTime-previous.time>=4000)previous={position:{...position},time:fixTime,accuracy:c.accuracy};
 $('locate-btn').disabled=false;$('locate-btn').querySelector('span').textContent='停止定位';
 notice(reliable?'':'定位誤差較大，暫停移動速度估算。請到視野開闊處再試。');render();checkArrival();
 if(!lastWeatherPosition||distanceKm(lastWeatherPosition,position)>2||Date.now()-lastWeatherFetch>600000)fetchWeather();
}
function handleLocation(){
 if(watchId!==null){resetDemo();return;}
 if(!navigator.geolocation){notice('此瀏覽器不支援定位，仍可使用示範模式。');return;}
 if(!window.isSecureContext){notice('定位需要 HTTPS 或 localhost。請透過本機伺服器開啟此頁面。');return;}
 mode='loading';speed=null;heading=null;$('locate-btn').disabled=true;notice('請允許瀏覽器存取位置。位置僅在本頁計算，當地風況由 Open-Meteo 提供。');render();
 watchId=navigator.geolocation.watchPosition(onPosition,error=>{
 if(watchId!==null)navigator.geolocation.clearWatch(watchId);watchId=null;mode='demo';position={...demo};speed=4.2;heading=bearing(demo);previous=null;
 $('locate-btn').disabled=false;$('locate-btn').querySelector('span').textContent='使用我的位置';
 notice(({1:'位置權限未開啟，請在瀏覽器設定中允許定位。',2:'暫時找不到 GPS 位置，請移至視野開闊處重試。',3:'定位等待逾時，請再試一次。'}[error.code]||'定位失敗。')+' 目前顯示示範資料。');render();fetchWeather();
 },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
}
$('locate-btn').addEventListener('click',handleLocation);
$('permission-enable').addEventListener('click',()=>{
 $('location-permission-dialog').close();
 handleLocation();
});
$('permission-demo').addEventListener('click',()=>{$('location-permission-dialog').close();});
function orientation(event){
 let value=null;
 if(Number.isFinite(event.webkitCompassHeading)&&(!Number.isFinite(event.webkitCompassAccuracy)||(event.webkitCompassAccuracy>=0&&event.webkitCompassAccuracy<=40)))value=event.webkitCompassHeading;
 else if(event.absolute&&Number.isFinite(event.alpha))value=normalize(360-event.alpha+(screen.orientation?.angle??0));
 if(value!==null){compassHeading=normalize(value);compassTime=Date.now();render();}
}
$('compass-btn').addEventListener('click',async()=>{
 try{
 if(!window.DeviceOrientationEvent){notice('此裝置沒有可用的羅盤。圖上的 N 朝向北方，巨城方位仍可正常使用。');return;}
 if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted'){notice('羅盤權限未開啟，目前使用北方朝上的方位圖。');return;}
 if(!orientationEnabled){window.addEventListener('deviceorientationabsolute',orientation);window.addEventListener('deviceorientation',orientation);orientationEnabled=true;}
 notice('請將手機平放。取得可靠的羅盤讀數後，方向圖會隨手機轉動；未支援的裝置維持北方朝上。');
 }catch{notice('無法啟用手機羅盤，請使用北方朝上的方位圖。');}
});
$('meatball-speed').addEventListener('input',render);
$('weather-refresh').addEventListener('click',fetchWeather);
setInterval(()=>{render();if(Date.now()-lastWeatherFetch>600000&&!$('weather-refresh').disabled)fetchWeather();},5000);
window.addEventListener('pagehide',()=>{if(watchId!==null)navigator.geolocation.clearWatch(watchId);});
try{const saved=localStorage.getItem('bigcity-meatball-speed');if(saved&&Number(saved)>=1&&Number(saved)<=200)$('meatball-speed').value=saved;}catch{}
$('meatball-speed').addEventListener('change',()=>{const v=Number($('meatball-speed').value);if(v>=1&&v<=200)try{localStorage.setItem('bigcity-meatball-speed',String(v));}catch{}});
render();fetchWeather();

// Explain location access on every page load; the browser prompt waits for a click.
$('location-permission-dialog').showModal();
