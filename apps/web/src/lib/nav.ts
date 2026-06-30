import { Home, Radio, Users, Wallet, User, type LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

// Single source of truth for primary navigation. Rendered into the desktop/tablet
// side rail and the mobile bottom bar from this one list — never duplicated.
export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/home", icon: Home },
  { key: "live", label: "Live", href: "/sessions", icon: Radio },
  { key: "fellowships", label: "Fellowships", href: "/fellowships", icon: Users },
  { key: "wallet", label: "Wallet", href: "/wallet", icon: Wallet },
  { key: "profile", label: "Profile", href: "/profile", icon: User },
];

// Active when the path is the item or a child route (e.g. /sessions/123).
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}
