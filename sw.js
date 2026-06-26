const CACHE_NAME = 'protein-planner-v0.5.5';

const APP_SHELL = [
  './',
  './index.html',
  './js/storage.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(names=>Promise.all(names.filter(name=>name!==CACHE_NAME).map(name=>caches.delete(name))))
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});
