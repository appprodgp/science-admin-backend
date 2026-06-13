import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getArticles, getErrorMessage, type Article } from "@/lib/api";
import { cn, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const statuses = [
    "extracted",
    "curated",
    "not_selected",
    "pending_review",
    "generation_failed",
    "approved",
    "rejected",
];

export default async function ArticlesPage({ searchParams }: { searchParams?: { status?: string } }) {
    const activeStatus = searchParams?.status;
    let articles: Article[] = [];
    let error: string | null = null;

    try {
        articles = await getArticles(activeStatus);
    } catch (caught) {
        error = getErrorMessage(caught);
    }

    return (
        <div>
            <PageHeader title="Articles" description="Filter source articles by pipeline status and inspect metadata, extraction content, and generated drafts." />

            <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
                <Link
                    href="/articles"
                    className={cn(
                        "whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium",
                        !activeStatus ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-600",
                    )}
                >
                    all
                </Link>
                {statuses.map((status) => (
                    <Link
                        key={status}
                        href={`/articles?status=${status}`}
                        className={cn(
                            "whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium",
                            activeStatus === status
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-200 bg-white text-slate-600",
                        )}
                    >
                        {status}
                    </Link>
                ))}
            </div>

            {error ? (
                <ErrorMessage message={error} />
            ) : articles.length === 0 ? (
                <EmptyState title="No articles found" message="Try another status tab or run discovery/AI pipeline actions first." />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Journal</th>
                                    <th className="px-4 py-3">DOI</th>
                                    <th className="px-4 py-3">Published</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {articles.map((article) => (
                                    <tr key={article.id} className="hover:bg-slate-50">
                                        <td className="max-w-xl px-4 py-3">
                                            <Link href={`/articles/${article.id}`} className="font-medium text-slate-950 hover:text-sky-700">
                                                {article.title}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{article.journal_name ?? "—"}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600">{article.doi}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(article.published_date)}</td>
                                        <td className="px-4 py-3"><StatusBadge status={article.status} /></td>
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