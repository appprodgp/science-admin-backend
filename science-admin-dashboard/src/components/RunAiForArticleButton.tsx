"use client";

import { useState, useTransition } from "react";

import { runAiPipelineAction, type ActionResult } from "@/app/actions";
import { ActionResultPanel } from "@/components/ActionResultPanel";

export function RunAiForArticleButton({ articleId }: { articleId: string }) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult<unknown> | null>(null);

    function run() {
        setResult(null);
        startTransition(() => {
            void (async () => {
                setResult(await runAiPipelineAction(1, articleId));
            })();
        });
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