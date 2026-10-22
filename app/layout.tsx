import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { AppShell } from "@/components/AppShell";
import { GoogleProvider } from "@/components/GoogleProvider";

export const metadata: Metadata = { title: { default: "Smart Queue", template: "%s · Smart Queue" }, description: "Find nearby shops, join a queue and follow your place in real time.", applicationName: "Smart Queue", appleWebApp: { capable: true, statusBarStyle: "default", title: "Smart Queue" }, formatDetection: { telephone: false } };
export const viewport: Viewport = { themeColor: "#1E7A9B", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><GoogleProvider><AppProvider><AppShell>{children}</AppShell></AppProvider></GoogleProvider></body></html>; }
