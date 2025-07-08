// Performance optimization utilities

// Debounce function for search and input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoization utility
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Image preloader
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Batch DOM updates
export const batchUpdates = (callback: () => void) => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};

// Memory usage monitor
export const getMemoryUsage = () => {
  if ("memory" in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
  }
  return null;
};

// Performance timing
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Lazy loading utility
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit,
) => {
  if ("IntersectionObserver" in window) {
    return new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: "50px",
      ...options,
    });
  }
  return null;
};

// Resource hints
export const addResourceHint = (
  href: string,
  rel: "preload" | "prefetch" | "dns-prefetch",
) => {
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (rel === "preload") {
    link.as = "fetch";
    link.crossOrigin = "anonymous";
  }
  document.head.appendChild(link);
};

// Service Worker registration
export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered: ", registration);
      return registration;
    } catch (registrationError) {
      console.log("SW registration failed: ", registrationError);
    }
  }
};

// Cache management
export const clearOldCaches = async () => {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter((name) => !name.includes("v1"));
    await Promise.all(oldCaches.map((name) => caches.delete(name)));
  }
};
