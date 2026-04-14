import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  LayoutDashboard,
  Receipt,
  GitMerge,
  Store,
  BarChart3,
  LifeBuoy,
  LogOut,
  Landmark,
  Plus,
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
  title: "LedgerCore Enterprise — Invoice Reconciler",
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
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/reconciliation", label: "Reconciliation", icon: GitMerge },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const footerNavItems: NavItem[] = [
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/logout", label: "Sign Out", icon: LogOut },
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
      <body className="min-h-full bg-[#f7f9fb] text-[#191c1e]">
        <div className="flex min-h-screen">
          {/* Sidebar — Editorial Enterprise */}
          <aside className="w-64 shrink-0 bg-[#f2f4f6] flex flex-col">
            {/* Brand block */}
            <div className="px-6 py-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#00502e] flex items-center justify-center rounded-lg shadow-sm">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-[#00502e] font-bold text-sm leading-none tracking-tight">
                    LedgerCore
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] mt-1.5">
                    Financial Operations
                  </p>
                </div>
              </div>

              {/* Primary CTA — gradient */}
              <button className="w-full bg-gradient-to-r from-[#00502e] to-[#006b3f] text-white py-2.5 px-4 rounded-md text-sm font-semibold mb-8 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                New Invoice
              </button>

              {/* Primary nav */}
              <nav className="space-y-1">
                {navItems.map(({ href, label, icon: Icon, active }) => (
                  <a
                    key={label}
                    href={href}
                    className={
                      active
                        ? "flex items-center gap-3 px-3 py-2 bg-[#9df5bd]/40 text-[#00502e] border-l-4 border-[#00502e] transition-transform hover:translate-x-1 duration-300 ease-out text-sm font-semibold"
                        : "flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-200/50 transition-transform hover:translate-x-1 duration-300 ease-out rounded-md text-sm font-medium"
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Footer nav */}
            <div className="mt-auto px-6 py-8">
              <nav className="space-y-1">
                {footerNavItems.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-200/50 transition-transform hover:translate-x-1 duration-300 ease-out rounded-md text-sm font-medium"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))}
              </nav>
              <p className="mt-6 px-3 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                v0.1.0 · dev
              </p>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
