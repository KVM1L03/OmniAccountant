import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Receipt,
} from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invoice Reconciler",
  description: "Enterprise AI-powered invoice reconciliation dashboard",
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, active: true },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="w-64 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
            <div className="px-6 py-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-indigo-600 p-2 shadow-lg shadow-indigo-600/30">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-bold text-sm tracking-tight">
                    Reconciler
                  </h1>
                  <p className="text-xs text-slate-400">Enterprise AI</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map(({ href, label, icon: Icon, active }) => (
                <a
                  key={label}
                  href={href}
                  className={
                    active
                      ? "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium bg-indigo-600/10 text-white ring-1 ring-indigo-500/30"
                      : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </nav>

            <div className="px-6 py-4 border-t border-slate-800">
              <p className="text-xs text-slate-500 font-mono">v0.1.0 · dev</p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
