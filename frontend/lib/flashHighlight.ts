// Briefly flashes a ring around an element so it's obvious what a search
// jumped to, then removes it - no extra React state needed for this. Shared
// by the landing page's section search and the dashboards' row search.
export function flashHighlight(element: HTMLElement) {
  element.classList.add("ring-2", "ring-primary-500", "ring-offset-4");
  window.setTimeout(() => {
    element.classList.remove("ring-2", "ring-primary-500", "ring-offset-4");
  }, 1600);
}
