"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to manage CSRF tokens on the client side.
 * Fetches a token on mount and provides it for use in mutation requests.
 *
 * Usage:
 *   const { csrfToken, csrfHeaders } = useCsrf();
 *   fetch("/api/some-endpoint", { method: "POST", headers: { ...csrfHeaders, "Content-Type": "application/json" }, body: ... });
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string>("");

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/csrf");
      if (res.ok) {
        const data = await res.json();
        setCsrfToken(data.csrfToken || "");
      }
    } catch {
      // Silent fail — CSRF will be enforced server-side
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    csrfToken,
    csrfHeaders: csrfToken ? { "x-csrf-token": csrfToken } : {},
    refreshCsrf: fetchToken,
  };
}
