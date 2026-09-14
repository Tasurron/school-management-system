import { InputHTMLAttributes, forwardRef } from "react";
import { Search } from "lucide-react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // When provided, the leading icon becomes a clickable submit button
  // (for forms where search only happens on submit, not as-you-type).
  submittable?: boolean;
}

// Forwards its ref to the underlying <input> so callers (e.g. a search
// popover) can autofocus it once it becomes visible.
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className = "", submittable = false, ...rest },
  ref
) {
  return (
    <div className={`relative ${className}`}>
      {submittable ? (
        <button
          type="submit"
          aria-label="Search"
          className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-primary-600"
        >
          <Search className="h-4 w-4" />
        </button>
      ) : (
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        ref={ref}
        type="search"
        className="w-full rounded-full border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
        {...rest}
      />
    </div>
  );
});
