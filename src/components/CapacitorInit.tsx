"use client";

/**
 * CapacitorInit — mounts once on app load.
 * Handles: status bar styling, splash screen hide, network offline banner,
 * and deep link routing (slipatip:// scheme).
 * All calls are no-ops on web.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isNative,
  initStatusBar,
  hideSplash,
  addNetworkListener,
  getNetworkStatus,
} from "@/lib/capacitor";

export default function CapacitorInit() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!isNative()) return;

    try {
      document.documentElement.classList.add("cap-native");
      const outer = window.outerHeight || window.screen.height || 0;
      const inner = window.innerHeight || 0;
      const estimatedInset = Math.max(0, outer - inner);
      const safeTop = Math.max(24, Math.min(estimatedInset, 56));
      document.documentElement.style.setProperty("--cap-safe-top", `${safeTop}px`);
    } catch {
      // ignore
    }

    // Status bar + splash
    initStatusBar();
    hideSplash();

    // Network status
    getNetworkStatus().then((connected) => setOffline(!connected));
    addNetworkListener((connected) => setOffline(!connected));

    // Deep link handler — listens for slipatip:// URLs opened externally
    async function setupDeepLinks() {
      try {
        const { App } = await import("@capacitor/app");
        await App.addListener("appUrlOpen", (event) => {
          const url = new URL(event.url);
          // slipatip://tip/ABC123 → /tip/ABC123
          // https://slipatip.co.za/tip/ABC123 → /tip/ABC123
          const path = url.pathname || "/";
          router.push(path);
        });
      } catch (e) {
        console.warn("[cap] Deep link setup failed", e);
      }
    }

    setupDeepLinks();
  }, [router]);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-white"
      style={{ background: "rgba(239,68,68,0.9)", backdropFilter: "blur(8px)" }}
    >
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      No internet connection
    </div>
  );
}
