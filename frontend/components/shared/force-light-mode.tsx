"use client";

import { useEffect } from "react";

/**
 * Forces light mode while mounted (used on pre-login auth & public marketing
 * pages where dark mode is not supported). Restores the user's dark preference
 * when navigating away.
 */
export function ForceLightMode() {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    if (wasDark) html.classList.remove("dark");
    return () => {
      if (wasDark) html.classList.add("dark");
    };
  }, []);
  return null;
}
