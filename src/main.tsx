import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { registerServiceWorker, clearOldCaches } from "./utils/performance";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

const basename = import.meta.env.BASE_URL;

// Enhanced service worker registration with performance optimizations
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await registerServiceWorker();
      await clearOldCaches();

      // Preload critical resources
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          // Preload critical images
          const criticalImages = ["/yacin-gym-logo.png"];

          criticalImages.forEach((src) => {
            // Check if link already exists to prevent duplicates
            const existingLink = document.querySelector(
              `link[rel="preload"][href="${src}"]`,
            );
            if (!existingLink && document.head) {
              try {
                const link = document.createElement("link");
                link.rel = "preload";
                link.as = "image";
                link.href = src;
                link.onerror = () => {
                  // Remove the link if it fails to load
                  try {
                    if (link.parentNode && link.parentNode === document.head) {
                      document.head.removeChild(link);
                    }
                  } catch (removeError) {
                    // Silently handle removal errors
                    console.warn(
                      "Could not remove failed preload link:",
                      removeError,
                    );
                  }
                };
                document.head.appendChild(link);
              } catch (error) {
                console.warn("Failed to preload image:", src, error);
              }
            }
          });
        });
      }
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}

// Network status context with enhanced offline detection
const createNetworkStatusContext = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
};

export const NetworkStatusContext = React.createContext({
  isOnline: navigator.onLine,
});

const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const networkStatus = createNetworkStatusContext();
  return (
    <NetworkStatusContext.Provider value={networkStatus}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

// Performance monitoring
if (process.env.NODE_ENV === "development") {
  // Monitor performance in development
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "measure") {
        console.log(`Performance: ${entry.name} took ${entry.duration}ms`);
      }
    }
  }).observe({ entryTypes: ["measure"] });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NetworkProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </NetworkProvider>
  </React.StrictMode>,
);
