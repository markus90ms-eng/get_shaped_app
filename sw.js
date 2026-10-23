/* Get Shaped PWA v21 – aktuelle Dateien vor Offline-Cache bevorzugen */
const CACHE='get-shaped-pages-v21';
const FILES=['./','./index.html','./initial_data.js','./nutrition.js?v=18','./foodindex.js?v=19','./backup-reminder.js?v=19','./water-fiber.js?v=20','./presets-activities.js?v=21','./voice.js?v=18','./intake-smart.js?v=18','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>Promise.allSettled(FILES.map(file=>cache.add(file)))).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('get-shaped-pages-v')&&key!==CACHE).map(key=>caches.delete(key))))
 .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 event.respondWith(
   fetch(request,{cache:'no-store'}).then(response=>{
     if(response.ok){
       const copy=response.clone();
       event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));
     }
     return response;
   }).catch(async()=>{
     const cached=await caches.match(request);
     if(cached)return cached;
     if(request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
     return Response.error();
   })
 );
});
