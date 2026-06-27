"use client";

import { useState } from "react";

import { ActionResultPanel } from "@/components/ActionResultPanel";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { runAiPipeline } from "@/lib/api";

export function RunAiForArticleButton({ articleId }: { articleId: string }) {
    const [isPending, setIsPending] = useState(false);
    const [result, setResult] = useState<ActionResult<unknown> | null>(null);

    function run() {
        setResult(null);
        setIsPending(true);
        void (async () => {
            try {
                setResult(await toActionResult(() => runAiPipeline(1, articleId)));
            } finally {
                setIsPending(false);
            }
        })();
    }

    return (
        <div>
            <button
                type="button"
                onClick={run}
                disabled={isPending}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {isPending ? "Running AI..." : "Run AI for this article"}
            </button>
            <ActionResultPanel result={result} />
        </div>
    );
}