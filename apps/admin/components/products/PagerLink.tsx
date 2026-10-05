"use client";

import Link, { useLinkStatus } from "next/link";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// While a pager link is loading, the product grid is dimmed (CSS keyed on <html data-paging>) and the
// clicked button shows a spinner, so a click never looks ignored.
function Pending({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  useEffect(() => {
    if (!pending) return;
    document.documentElement.dataset.paging = "1";
    return () => {
      delete document.documentElement.dataset.paging;
    };
  }, [pending]);
  return pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>{children}</>;
}

export function PagerLink({
  href,
  className,
  prefetch,
  children,
}: {
  href: string;
  className?: string;
  prefetch?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} prefetch={prefetch} className={className}>
      <Pending>{children}</Pending>
    </Link>
  );
}
