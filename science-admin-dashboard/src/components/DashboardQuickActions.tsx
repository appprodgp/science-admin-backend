"use client";

import { useTransition, useState } from "react";

import { runAiPipelineAction, runDiscoveryAction, type ActionResult } from "@/app/actions";
import { ActionResultPanel } from "@/components/ActionResultPanel";

export function DashboardQuickActions() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult<unknown> | null>(null);

    function run(kind: "discovery" | "ai") {
        setResult(null);
        startTransition(() => {
            void (async () => {
                const actionResult = kind === "discovery" ? await runDiscoveryAction(1) : await runAiPipelineAction(1, null);
                setResult(actionResult);
            })();
        });
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