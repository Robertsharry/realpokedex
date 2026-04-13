import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache PokeAPI responses for offline use
    {
      matcher: /^https:\/\/pokeapi\.co\/api\/v2\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "pokeapi-cache",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 500,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          }),
        ],
      }),
    },
    // Cache Pokemon sprites and artwork
    {
      matcher: /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/.*/i,
      handler: new CacheFirst({
        cacheName: "pokemon-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 2000,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          }),
        ],
      }),
    },
    // Default caching for everything else
    ...defaultCache,
  ],
});

serwist.addEventListeners();
