"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/" || p.startsWith("/roadmap") },
  { href: "/interview", label: "Interview Hub", icon: MessagesSquare, match: (p: string) => p.startsWith("/interview") },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-h-11 items-center gap-2.5" aria-label="AI Automation Senior Hub — trang chủ">
          <span className="grid size-8 place-items-center rounded-lg bg-accent-wash text-accent-soft ring-1 ring-accent/30 transition-colors duration-200 group-hover:bg-accent/20">
            <Bot className="size-4" aria-hidden />
          </span>
          <span className="hidden font-semibold tracking-tight sm:inline">
            AI Automation <span className="text-accent-soft">Senior Hub</span>
          </span>
        </Link>

        <nav aria-label="Điều hướng chính">
          <ul className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
            {NAV.map(({ href, label, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-200",
                      active
                        ? "bg-accent text-white shadow-sm shadow-accent/30"
                        : "text-ink-muted hover:bg-surface-raised hover:text-ink",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
