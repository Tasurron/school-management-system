"use client";

import { useEffect } from "react";
import { flashHighlight } from "@/lib/flashHighlight";

// Scrolls to and briefly flashes a row after its data has loaded, driven by
// ?highlight=<rowId> in the URL - set by the header's global search when it
// links to a list page instead of straight to a detail page. `ready` should
// become true once the rows the highlight could target are actually in the DOM
// (i.e. loading has finished and there was no error).
//
// Reads window.location directly instead of next/navigation's
// useSearchParams so these already-client-rendered pages don't need a
// <Suspense> boundary just for this.
export function useHighlightRow(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const highlight = new URLSearchParams(window.location.search).get("highlight");
    if (!highlight) return;
    const element = document.getElementById(highlight);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      flashHighlight(element);
    }
  }, [ready]);
}
