"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import Link from "next/link";

export function ProductSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query !== initialQuery) {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString());
          if (query) {
            params.set("q", query);
          } else {
            params.delete("q");
          }
          params.set("offset", "0"); // Reset pagination on new search
          router.replace(`${pathname}?${params.toString()}`);
        });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [query, initialQuery, pathname, router, searchParams]);

  return (
    <div className="flex-1 relative">
      <div className="flex items-center gap-2 bg-[#F5F0EB] border border-[#EDE0E0] rounded-xl px-3 py-2.5 focus-within:border-[#C08A8E] focus-within:ring-2 focus-within:ring-[#F4EAEB] transition-all">
        <Search className={`w-4 h-4 shrink-0 transition-colors ${isPending ? 'text-[#C08A8E] animate-pulse' : 'text-[#2A2424]/30'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, marque..."
          className="flex-1 text-sm text-[#2A2424] bg-transparent outline-none placeholder:text-[#2A2424]/30"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-[#2A2424]/30 hover:text-[#2A2424] px-1"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
