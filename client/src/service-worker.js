// TODO: what is this file used for?

// eslint-disable-next-line no-undef
workbox.core.setCacheNameDetails({ prefix: 'survey-stack' });

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.__precacheManifest = [].concat(self.__precacheManifest || []);
// eslint-disable-next-line no-undef
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
