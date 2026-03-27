import { useEffect } from "react";
import type { LeafletReadyCallback } from "../lib/types";

const LEAFLET_CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
const LEAFLET_JS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";

let leafletLoadPromise: Promise<void> | null = null;

/**
 * Lazily loads Leaflet from CDN (CSS + JS) exactly once per page lifecycle.
 * Subsequent calls resolve immediately from the cached promise.
 *
 * @param onReady - Callback invoked with the global `L` instance once loaded.
 */
export function useLeaflet(onReady: LeafletReadyCallback): void {
  useEffect(() => {
    if (!leafletLoadPromise) {
      leafletLoadPromise = new Promise<void>((resolve) => {
        // Leaflet CSS
        if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = LEAFLET_CSS_URL;
          document.head.appendChild(link);
        }

        // Leaflet JS
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).L) {
          resolve();
        } else {
          const script = document.createElement("script");
          script.src = LEAFLET_JS_URL;
          script.onload = () => resolve();
          document.head.appendChild(script);
        }
      });
    }

    leafletLoadPromise.then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onReady((window as any).L);
    });
    // `onReady` is excluded intentionally — callers should wrap it in useCallback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}