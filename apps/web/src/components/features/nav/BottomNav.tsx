"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";

// Mobile / PWA bottom bar — the standard mobile app pattern. Hidden from tablet up,
// where SideNav takes over. Renders the same NAV_ITEMS as the side rail.
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-border bg-bg-surface"
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] transition-colors ${
              active ? "text-primary-light" : "text-text-muted"
            }`}
          >
            <Icon size={20} aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
