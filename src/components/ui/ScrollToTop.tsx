"use client";

import { useEffect } from "react";

export default function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return null;
}
