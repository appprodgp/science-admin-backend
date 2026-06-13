import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getErrorMessage, getLlmRuns, type LlmRun } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AiRunsPage() {
    let runs: LlmRun[] = [];
    let error: string | null = null;

    try {
        runs = await getLlmRuns(100);
    } catch (caught) {
        error = getErrorMessage(caught);
    }

    return (
        <div>
            <PageHeader title="AI Runs" description="Latest LLM audit records with model/provider, token estimates, status, and errors." />

            {error ? (
                <ErrorMessage message={error} />
            ) : runs.length === 0 ? (
                <EmptyState title="No LLM runs" message="No AI pipeline runs have been recorded yet." />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Task</th>
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3">Model</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Input tokens</th>
                                    <th className="px-4 py-3">Output tokens</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {runs.map((run) => (
                                    <tr key={run.id} className="align-top hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-950">{run.task_name}</td>
                                        <td className="px-4 py-3 text-slate-600">{run.provider ?? "—"}</td>
                                        <td className="px-4 py-3 text-slate-600">{run.model ?? "—"}</td>
                                        <td className="px-4 py-3"><StatusBadge status={run.status} /></td>
                                        <td className="px-4 py-3 text-slate-600">{formatNumber(run.input_tokens_estimate)}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatNumber(run.output_tokens_estimate)}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDateTime(run.created_at)}</td>
                                        <td className="max-w-md px-4 py-3 text-rose-700">{run.error_message ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}