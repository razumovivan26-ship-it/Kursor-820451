const CACHE='kursor-public-shell-v4-4-0';
const FILES=['./index.html','./kursor.js?v=4.4.0','./kursor.css?v=4.4.0','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const scope=new URL(self.registration.scope);
const url=x=>new URL(x,scope).href;
const shell=url('./index.html');
const assets=new Set(FILES.slice(1).map(url));
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Preload only the public shell. Activation follows a complete core download.
  await cache.addAll(FILES.map(x=>new Request(url(x),{cache:'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('kursor-public-shell-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const r=event.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==scope.origin||r.headers.has('Authorization'))return;
  const navigation=r.mode==='navigate'&&(u.pathname===scope.pathname||u.pathname===new URL(shell).pathname);
  if(!navigation&&!assets.has(u.href))return;
  event.respondWith((async()=>{
    const c=await caches.open(CACHE);
    if(!navigation){const hit=await c.match(u.href);if(hit)return hit;const res=await fetch(r);if(res.ok)await c.put(u.href,res.clone());return res;}
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),6000);
    try{const res=await fetch(r,{cache:'no-cache',signal:ctrl.signal});if(!res.ok)throw Error('HTTP '+res.status);await c.put(shell,res.clone());return res;}
    catch{return (await c.match(shell))||Response.error();}finally{clearTimeout(timer);}
  })());
});
