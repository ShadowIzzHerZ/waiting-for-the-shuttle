const C="carts-v8",F=["./","index.html","drawings/drawing.js","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
// network first so a new drawing or app version shows at once; the cache is the offline copy
self.addEventListener("fetch",e=>{if(e.request.method!="GET")return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request)))});
