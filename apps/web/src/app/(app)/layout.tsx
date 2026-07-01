import SideNav from "@/components/features/nav/SideNav";
import BottomNav from "@/components/features/nav/BottomNav";

// App shell: global navigation (side rail on desktop/tablet, bottom bar on
// mobile) wrapping every (app) route. Open to everyone — public surfaces (feed,
// live) render for logged-out visitors; account pages guard with <RequireAuth>.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
