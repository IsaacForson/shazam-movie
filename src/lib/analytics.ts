import posthog from "posthog-js";

let initialized = false;

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/** Initialize PostHog once on the client. No-ops if no key is configured. */
export function initAnalytics() {
  if (initialized || typeof window === "undefined" || !KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "always",
  });
  initialized = true;
}

/** Fire a custom event. Safe no-op when analytics isn't configured. */
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || !KEY) return;
  posthog.capture(event, props);
}
