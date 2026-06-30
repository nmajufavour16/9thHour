"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";
import Logo from "@/components/ui/Logo";

const STORAGE_KEY = "9h-nav-collapsed";

// Desktop + tablet left rail. Hamburger collapses it to icons-only and expands it
// to icons + labels; the choice persists. Hidden on mobile, where BottomNav takes over.
export default function SideNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true" || saved === "false") {
      setCollapsed(saved === "true");
    } else {
      // Default: collapsed on tablet, expanded on desktop.
      setCollapsed(window.innerWidth < 1024);
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // storage disabled — choice just won't persist this session
      }
      return next;
    });
  }

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 border-r border-border bg-bg-surface transition-[width] duration-200 sticky top-0 h-screen ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center gap-2 h-16 px-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          className="p-2 rounded-lg text-text-secondary hover:opacity-80 transition-opacity"
        >
          <Menu size={20} aria-hidden />
        </button>
        {!collapsed && <Logo className="h-7 w-auto" />}
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${active ? "bg-bg-elevated text-primary-light" : "text-text-secondary hover:text-text-primary"}`}
            >
              <Icon size={20} aria-hidden />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
