"use client";

import { API } from "./store";

let lastTrackedPath = null;

/**
 * Silently tracks a page visit. Called on every route change.
 * Sends: current path + document referrer.
 * No personal data is sent. Backend hashes IP before storing.
 */
export function trackVisit(pathname) {
  if (typeof window === "undefined") return;
  if (pathname === lastTrackedPath) return; // avoid double-tracking on same page
  lastTrackedPath = pathname;

  const referrer = document.referrer
    ? new URL(document.referrer).hostname
    : null;

  // Fire and forget — never awaited, never blocks the UI
  fetch(`${API}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: pathname, referrer }),
    keepalive: true
  }).catch(() => {}); // silent failure
}
