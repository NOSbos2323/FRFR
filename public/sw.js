// Enhanced Service Worker for Amino Gym PWA with performance optimizations
const CACHE_NAME = "amino-gym-v2";
const STATIC_CACHE = "amino-gym-static-v2";
const DYNAMIC_CACHE = "amino-gym-dynamic-v2";
const IMAGE_CACHE = "amino-gym-images-v2";

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  "/",
  "/home",
  "/login",
  "/yacin-gym-logo.png",
  "/success-sound.mp3",
];

// Static assets that rarely change
const STATIC_ASSETS = ["/manifest.json"];

// Install event - cache critical resources with performance optimization
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Caching critical resources");
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),
    ]).then(() => {
      console.log("Service Worker installed successfully");
      return self.skipWaiting();
    }),
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              ![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(
                cacheName,
              )
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ]).then(() => {
      console.log("Service Worker activated successfully");
    }),
  );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith("/api/")) {
    // API requests - Network First with fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else if (request.destination === "image") {
    // Images - Cache First with network fallback
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (url.pathname.match(/\.(js|css|woff2?)$/)) {
    // Static assets - Cache First
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    // HTML pages - Network First with cache fallback
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  }
});

// Network First strategy - try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      return caches.match("/") || new Response("Offline", { status: 503 });
    }

    throw error;
  }
}

// Cache First strategy - try cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background if resource is older than 1 hour
    const cacheDate = new Date(cachedResponse.headers.get("date") || 0);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;

    if (now - cacheDate > oneHour) {
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(cacheName).then((cache) => {
              cache.put(request, response);
            });
          }
        })
        .catch(() => {});
    }

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Failed to fetch resource:", request.url);
    throw error;
  }
}

// Background sync for offline data synchronization
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log("Starting background sync...");

    // Sync offline data when connection is restored
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "BACKGROUND_SYNC",
        payload: { status: "started" },
      });
    });

    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 1000));

    clients.forEach((client) => {
      client.postMessage({
        type: "BACKGROUND_SYNC",
        payload: { status: "completed" },
      });
    });

    console.log("Background sync completed");
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// Enhanced push notifications
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Amino Gym",
    body: "إشعار من Amino Gym",
    icon: "/yacin-gym-logo.png",
    badge: "/yacin-gym-logo.png",
  };

  if (event.data) {
    try {
      notificationData = { ...notificationData, ...event.data.json() };
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: Date.now(),
      url: notificationData.url || "/",
    },
    actions: [
      {
        action: "open",
        title: "فتح التطبيق",
        icon: "/yacin-gym-logo.png",
      },
      {
        action: "close",
        title: "إغلاق",
      },
    ],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options),
  );
});

// Handle notification clicks with better navigation
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if (client.navigate) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Message handling for communication with main app
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync (if supported)
if ("periodicSync" in self.registration) {
  self.addEventListener("periodicsync", (event) => {
    if (event.tag === "background-sync") {
      event.waitUntil(doBackgroundSync());
    }
  });
}

console.log("Service Worker loaded successfully");
