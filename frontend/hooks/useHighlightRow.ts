"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { flashHighlight } from "@/lib/flashHighlight";

// Scrolls to and briefly flashes a row after its data has loaded, driven by
// ?highlight=<rowId> in the URL - set by the header's global search when it
// links to a list page instead of straight to a detail page. `ready` should
// become true once the rows the highlight could target are actually in the DOM
// (i.e. loading has finished and there was no error).
//
// Uses next/navigation's useSearchParams (rather than reading
// window.location directly) so the effect re-runs when only the query
// string changes - e.g. searching for something on the page you're already
// on, where the route doesn't remount and `ready` never flips. That reactivity
// is why this needs a <Suspense> boundary around any page that calls it.
export function useHighlightRow(ready: boolean) {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  useEffect(() => {
    if (!ready || !highlight) return;
    const element = document.getElementById(highlight);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      flashHighlight(element);
    }
  }, [ready, highlight]);
}
