"use client";

import type { JSX } from "react";
import { useEffect } from "react";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home(): JSX.Element {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const next = "/dashboard";
      const url = `/api/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(
        next
      )}`;
      window.location.replace(url);
    }
  }, []);

  return <LandingPage />;
}
