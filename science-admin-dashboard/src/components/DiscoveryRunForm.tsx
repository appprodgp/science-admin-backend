"use client";

import { FormEvent, useState, useTransition } from "react";

import { runDiscoveryAction, type ActionResult } from "@/app/actions";
import { ActionResultPanel } from "@/components/ActionResultPanel";

export function DiscoveryRunForm() {
    const [limit, setLimit] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<ActionResult<unknown> | null>(null);

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setResult(null);
        startTransition(() => {
            void (async () => {
                setResult(await runDiscoveryAction(Math.max(1, limit)));
            })();
        });
    }

    return (
        <form onSubmit={onSubmit}>
            <label className="block text-sm font-medium text-slate-700" htmlFor="limit_per_journal">
                limit_per_journal
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                    id="limit_per_journal"
                    type="number"
                    min={1}
                    value={limit}
                    onChange={(event) => setLimit(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-4 sm:max-w-48"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? "Running..." : "Run discovery"}
                </button>
            </div>
            <ActionResultPanel result={result} />
        </form>
    );
}