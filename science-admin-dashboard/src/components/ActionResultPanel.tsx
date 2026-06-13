"use client";

import { JsonBlock } from "@/components/JsonBlock";
import type { ActionResult } from "@/app/actions";

export function ActionResultPanel({ result }: { result: ActionResult<unknown> | null }) {
    if (!result) return null;

    if (!result.ok) {
        return (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {result.error}
            </div>
        );
    }

    return (
        <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Result JSON</p>
            <JsonBlock value={result.data} />
        </div>
    );
}