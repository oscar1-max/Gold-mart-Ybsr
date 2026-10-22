const CACHE="goldmart-shell-v1";
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(["/","/offline"])).then(()=>self.skipWaiting()));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==="navigate"){event.respondWith(fetch(event.request).catch(async()=>await caches.match("/offline")||Response.error()));}
});
