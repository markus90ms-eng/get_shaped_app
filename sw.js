const CACHE='get-shaped-pages-v12';
const FILES=['./','./index.html','./manifest.webmanifest','./initial_data.js','./nutrition.js','./voice.js','./intake.js','./icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{
 const req=e.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 if(req.mode==='navigate'||url.pathname.endsWith('/index.html')){
   e.respondWith(fetch(req).then(response=>{
      if(response.ok){const copy=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}));}
      return response;
    }).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
   return;
 }
 e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}));}
   return response;
 })));
});