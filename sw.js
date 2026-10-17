// Guarda la app en el teléfono para que abra sin señal.
// Con señal busca la versión nueva (espera hasta 4 segundos); sin señal usa la guardada.
const CACHE = "bitacora-v2-1";
const FILES = ["./", "index.html", "manifest.json", "icon.svg"];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e)=>{
  const url = new URL(e.request.url);
  if(e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async ()=>{
    const cache = await caches.open(CACHE);
    try{
      const net = await Promise.race([
        fetch(e.request),
        new Promise((_, rej)=>setTimeout(()=>rej(new Error("lento")), 4000))
      ]);
      if(net && net.ok) cache.put(e.request, net.clone());
      return net;
    }catch(_){
      return (await cache.match(e.request, {ignoreSearch:true})) ||
             (e.request.mode === "navigate" ? await cache.match("index.html") : Response.error());
    }
  })());
});
