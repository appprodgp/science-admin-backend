import type { ReactNode } from "react";

import { BackendStatus } from "@/components/BackendStatus";
import { Sidebar } from "@/components/Sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 md:flex">
            <Sidebar />
            <div className="min-w-0 flex-1">
                <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin dashboard</p>
                            <p className="text-sm text-slate-600">Science article pipeline operations</p>
                        </div>
                        <BackendStatus />
                    </div>
                </header>
                <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}