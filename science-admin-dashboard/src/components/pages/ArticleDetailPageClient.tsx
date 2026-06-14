"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { JsonBlock } from "@/components/JsonBlock";
import { PageHeader } from "@/components/PageHeader";
import { RunAiForArticleButton } from "@/components/RunAiForArticleButton";
import { StatusBadge } from "@/components/StatusBadge";
import {
    type Article,
    type ArticleFigure,
    getArticle,
    getArticleFigures,
    getArticleSections,
    type CurationScore,
    type GeneratedArticle,
    getCurationScores,
    getErrorMessage,
    getGeneratedForArticle,
    type ArticleSection,
} from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";

function groupSections(sections: ArticleSection[]): Record<string, ArticleSection[]> {
    return sections.reduce<Record<string, ArticleSection[]>>((grouped, section) => {
        const key = section.section_name || "Unlabeled section";
        grouped[key] = [...(grouped[key] ?? []), section];
        return grouped;
    }, {});
}

export function ArticleDetailPageClient() {
    const searchParams = useSearchParams();
    const articleId = searchParams.get("id") ?? "";
    const [article, setArticle] = useState<Article | null>(null);
    const [sections, setSections] = useState<ArticleSection[]>([]);
    const [figures, setFigures] = useState<ArticleFigure[]>([]);
    const [curationScores, setCurationScores] = useState<CurationScore[]>([]);
    const [generated, setGenerated] = useState<GeneratedArticle[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [relatedError, setRelatedError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadArticleDetail() {
            if (!articleId) {
                setArticle(null);
                setError("Missing article id. Open this page from the Articles table or add ?id=<article_id>.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setRelatedError(null);
            setArticle(null);
            setSections([]);
            setFigures([]);
            setCurationScores([]);
            setGenerated([]);

            try {
                const articleData = await getArticle(articleId);
                if (cancelled) return;
                setArticle(articleData);
            } catch (caught) {
                if (!cancelled) {
                    setError(getErrorMessage(caught));
                    setLoading(false);
                }
                return;
            }

            try {
                const [sectionData, figureData, scoreData, generatedData] = await Promise.all([
                    getArticleSections(articleId),
                    getArticleFigures(articleId),
                    getCurationScores(articleId),
                    getGeneratedForArticle(articleId),
                ]);
                if (!cancelled) {
                    setSections(sectionData);
                    setFigures(figureData);
                    setCurationScores(scoreData);
                    setGenerated(generatedData);
                }
            } catch (caught) {
                if (!cancelled) setRelatedError(getErrorMessage(caught));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadArticleDetail();

        return () => {
            cancelled = true;
        };
    }, [articleId]);

    const groupedSections = useMemo(() => groupSections(sections), [sections]);

    if (loading) return <p className="text-sm text-slate-500">Loading article detail...</p>;
    if (error) return <ErrorMessage message={error} />;
    if (!article) return <EmptyState title="Article not found" message="No article detail is available for this id." />;

    return (
        <div>
            <PageHeader
                title="Article detail"
                description={article.title}
                actions={<RunAiForArticleButton articleId={article.id} />}
            />

            {relatedError && <div className="mb-5"><ErrorMessage message={relatedError} /></div>}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                    <Card title="Metadata">
                        <dl className="grid gap-4 text-sm sm:grid-cols-2">
                            <div>
                                <dt className="font-medium text-slate-500">Status</dt>
                                <dd className="mt-1"><StatusBadge status={article.status} /></dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Journal</dt>
                                <dd className="mt-1 text-slate-900">{article.journal_name ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">DOI</dt>
                                <dd className="mt-1 font-mono text-xs text-slate-900">{article.doi}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Published</dt>
                                <dd className="mt-1 text-slate-900">{formatDate(article.published_date)}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Publisher</dt>
                                <dd className="mt-1 text-slate-900">{article.publisher ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Field</dt>
                                <dd className="mt-1 text-slate-900">{article.field ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">License</dt>
                                <dd className="mt-1 text-slate-900">{article.license_type ?? "—"}</dd>
                            </div>
                            <div>
                                <dt className="font-medium text-slate-500">Updated</dt>
                                <dd className="mt-1 text-slate-900">{formatDateTime(article.updated_at)}</dd>
                            </div>
                        </dl>
                        {article.abstract_from_metadata && (
                            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                                <p className="mb-2 font-medium text-slate-900">Abstract</p>
                                {article.abstract_from_metadata}
                            </div>
                        )}
                        {article.error_message && (
                            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                {article.error_message}
                            </div>
                        )}
                    </Card>

                    <Card title="Sections grouped by section_name" description="Extracted XML text grouped by backend section name.">
                        {Object.keys(groupedSections).length === 0 ? (
                            <EmptyState title="No sections" message="No extracted section text is available for this article." />
                        ) : (
                            <div className="space-y-4">
                                {Object.entries(groupedSections).map(([sectionName, items]) => (
                                    <div key={sectionName} className="rounded-xl border border-slate-200 p-4">
                                        <h3 className="font-semibold text-slate-950">{sectionName}</h3>
                                        <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                                            {items.map((section) => (
                                                <p key={section.id}>{section.section_text}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card title="Figure captions">
                        {figures.length === 0 ? (
                            <EmptyState title="No figures" message="No figure captions were extracted." />
                        ) : (
                            <div className="space-y-3">
                                {figures.map((figure) => (
                                    <div key={figure.id} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                                        <p className="font-semibold text-slate-900">{figure.figure_label ?? "Figure"}</p>
                                        <p className="mt-2 leading-6">{figure.caption}</p>
                                        {figure.source_credit && <p className="mt-2 text-xs text-slate-500">Credit: {figure.source_credit}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <aside className="space-y-5">
                    <Card title="Curation scores">
                        {curationScores.length === 0 ? (
                            <EmptyState title="No scores" message="Run the AI pipeline to create curation scores." />
                        ) : (
                            <div className="space-y-3">
                                {curationScores.map((score) => (
                                    <div key={score.id} className="rounded-xl border border-slate-200 p-3">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <span className="text-sm font-semibold text-slate-950">{score.model ?? "Unknown model"}</span>
                                            <StatusBadge status={score.selected ? "curated" : "not_selected"} />
                                        </div>
                                        <JsonBlock value={score} minHeight="min-h-20" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card title="Generated drafts">
                        {generated.length === 0 ? (
                            <EmptyState title="No drafts" message="No generated article draft exists yet." />
                        ) : (
                            <div className="space-y-3">
                                {generated.map((draft) => (
                                    <Link
                                        key={draft.id}
                                        href={`/review-detail?id=${draft.id}`}
                                        className="block rounded-xl border border-slate-200 p-3 transition hover:border-slate-400 hover:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-slate-950">{draft.plain_title ?? "Untitled draft"}</p>
                                            <StatusBadge status={draft.review_status} />
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">Created {formatDateTime(draft.created_at)}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Card>
                </aside>
            </div>
        </div>
    );
}