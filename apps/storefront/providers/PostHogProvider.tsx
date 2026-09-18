"use client";

import posthog from "posthog-js";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Initialize PostHog once outside the component
if (typeof window !== "undefined") {
  posthog.init("***REMOVED-POSTHOG-PERSONAL-KEY***", {
    api_host: "https://eu.i.posthog.com", // Assume EU Cloud, fallback to US if it fails
    person_profiles: "always", // Create profiles for anonymous users
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
  });
}

export function PostHogPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageViews />
      </Suspense>
      {children}
    </>
  );
}
