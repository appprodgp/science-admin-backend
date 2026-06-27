"use client";

import { useState } from "react";

import { ActionResultPanel } from "@/components/ActionResultPanel";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { runAiPipeline, runDiscovery } from "@/lib/api";

export function DashboardQuickActions() {
    const [isPending, setIsPending] = useState(false);
    const [result, setResult] = useState<ActionResult<unknown> | null>(null);

    function run(kind: "discovery" | "ai") {
        setResult(null);
        setIsPending(true);
        void (async () => {
            try {
                const actionResult = await toActionResult(() =>
                    kind === "discovery" ? runDiscovery(1) : runAiPipeline(1, null),
                );
                setResult(actionResult);
            } finally {
                setIsPending(false);
            }
        })();
    }

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={() => run("discovery")}
                    disabled={isPending}
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Run discovery limit 1
                </button>
                <button
                    type="button"
                    onClick={() => run("ai")}
                    disabled={isPending}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Run AI pipeline limit 1
                </button>
            </div>
            {isPending && <p className="mt-3 text-sm text-slate-500">Running action...</p>}
            <ActionResultPanel result={result} />
        </div>
    );
}