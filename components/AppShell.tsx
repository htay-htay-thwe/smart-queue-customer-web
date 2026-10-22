"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, House, MapPinned, Menu, QrCode, Search, Ticket, UserRound } from "lucide-react";
import { useApp } from "./AppProvider";

const hidden = new Set(["/login", "/register", "/verify"]);
const tabs = [
  { href: "/", label: "Home", Icon: House }, { href: "/map", label: "Map", Icon: MapPinned },
  { href: "/scan", label: "Scan", Icon: QrCode, raised: true }, { href: "/queues", label: "My Queue", Icon: Ticket },
  { href: "/account", label: "Account", Icon: UserRound },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const { unread } = useApp(); const chrome = !hidden.has(path);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [path]);
  return <div className="site-shell">
    {chrome && <header className="desktop-header"><Link className="brand" href="/"><span>SQ</span><strong>Smart Queue</strong></Link><nav><Link href="/"><Search size={18}/> Discover</Link><Link href="/queues"><Ticket size={18}/> My Queue</Link><Link href="/notifications" className="notification-link"><Bell size={18}/> Alerts{unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}</Link><Link href="/account"><UserRound size={18}/> Account</Link></nav></header>}
    {chrome && <header className="mobile-header"><Link href="/account" className="mobile-header-button" aria-label="Open account menu"><Menu size={24}/></Link><strong>Smart Queue</strong><Link href="/notifications" className="mobile-header-button notification-button" aria-label="Notifications"><Bell size={24}/>{unread > 0 && <b>{unread > 9 ? "9+" : unread}</b>}</Link></header>}
    <main className={chrome ? "page-with-nav" : ""}>{children}</main>
    {chrome && <nav className="bottom-nav" aria-label="Primary navigation">{tabs.map(({ href, label, Icon, raised }) => { const active = href === "/" ? path === "/" : path.startsWith(href); return <Link key={href} href={href} className={`${active ? "active" : ""} ${raised ? "raised-tab" : ""}`}><span><Icon size={raised ? 24 : 21}/>{href === "/queues" && unread > 0 ? null : null}</span><small>{label}</small></Link>; })}</nav>}
  </div>;
}
