"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getErrorMessage, getReviewQueue, type ReviewQueueItem } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";

export function ReviewQueuePageClient() {
    const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadQueue() {
            try {
                const data = await getReviewQueue();
                if (!cancelled) setQueue(data);
            } catch (caught) {
                if (!cancelled) setError(getErrorMessage(caught));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadQueue();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div>
            <PageHeader title="Review Queue" description="Pending generated articles that need human editorial review before publishing decisions." />

            {loading ? (
                <p className="text-sm text-slate-500">Loading review queue...</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : queue.length === 0 ? (
                <EmptyState title="No pending generated articles" message="The backend returned an empty review queue." />
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {queue.map((item) => (
                        <article key={item.generated_article_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950">{item.plain_title ?? "Untitled generated article"}</h2>
                                    {item.subtitle && <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>}
                                </div>
                                <StatusBadge status={item.review_status} />
                            </div>

                            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="font-medium text-slate-500">Source article</dt>
                                    <dd className="mt-1 text-slate-800">{item.source_article_title ?? "—"}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Journal</dt>
                                    <dd className="mt-1 text-slate-800">{item.journal_name ?? "—"}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Date</dt>
                                    <dd className="mt-1 text-slate-800">{formatDate(item.published_date)}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Fact-check status</dt>
                                    <dd className="mt-1 text-slate-800">
                                        <StatusBadge
                                            status={
                                                item.fact_check_json && typeof item.fact_check_json === "object"
                                                    ? "available"
                                                    : "missing"
                                            }
                                        />
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">Created {formatDateTime(item.created_at)}</p>
                                <Link
                                    href={`/review-detail?id=${item.generated_article_id}`}
                                    className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Open review
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}