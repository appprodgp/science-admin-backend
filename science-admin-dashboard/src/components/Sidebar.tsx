"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/format";

const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/articles", label: "Articles" },
    { href: "/review", label: "Review Queue" },
    { href: "/ai-runs", label: "AI Runs" },
    { href: "/discovery", label: "Discovery" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
            <div className="p-5">
                <Link href="/" className="block">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Science</p>
                    <h1 className="mt-1 text-xl font-bold text-slate-950">Admin Dashboard</h1>
                </Link>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:block md:space-y-1 md:overflow-visible md:px-3">
                {navItems.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-slate-100 md:block",
                                active ? "bg-slate-950 text-white hover:bg-slate-900" : "text-slate-600",
                            )}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}