import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import Disclaimer from "./Disclaimer";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <div className="pb-16">
        <Disclaimer variant="footer" />
      </div>
      <BottomNav />
    </div>
  );
}
