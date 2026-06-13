"use client";

import { useMemo, useState, useTransition } from "react";

import {
    approveGeneratedArticleAction,
    rejectGeneratedArticleAction,
    requestRevisionAction,
    saveGeneratedArticleAction,
    type ActionResult,
} from "@/app/actions";
import { JsonBlock } from "@/components/JsonBlock";
import { StatusBadge } from "@/components/StatusBadge";
import type { ReviewGeneratedArticle } from "@/lib/api";
import { formatDate, prettyJson } from "@/lib/format";

type ReasonMode = "request_revision" | "reject" | null;

function parseJsonTextarea(label: string, value: string): { ok: true; value: unknown } | { ok: false; error: string } {
    const trimmed = value.trim();
    if (!trimmed) return { ok: true, value: null };
    try {
        return { ok: true, value: JSON.parse(trimmed) };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Invalid JSON";
        return { ok: false, error: `${label}: ${message}` };
    }
}

function nullableText(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? value : null;
}

export function ReviewEditor({ initialArticle }: { initialArticle: ReviewGeneratedArticle }) {
    const [article, setArticle] = useState(initialArticle);
    const [plainTitle, setPlainTitle] = useState(initialArticle.plain_title ?? "");
    const [subtitle, setSubtitle] = useState(initialArticle.subtitle ?? "");
    const [articleBody, setArticleBody] = useState(initialArticle.article_body ?? "");
    const [sourceAttribution, setSourceAttribution] = useState(initialArticle.source_attribution ?? "");
    const [difficultWordsJson, setDifficultWordsJson] = useState(prettyJson(initialArticle.difficult_words_json ?? null));
    const [mcqsJson, setMcqsJson] = useState(prettyJson(initialArticle.mcqs_json ?? null));
    const [limitationsJson, setLimitationsJson] = useState(prettyJson(initialArticle.limitations_json ?? null));
    const [reasonMode, setReasonMode] = useState<ReasonMode>(null);
    const [reason, setReason] = useState("");
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<ActionResult<unknown> | null>(null);

    const isFinal = article.review_status === "approved" || article.review_status === "rejected";

    const sourceFacts = useMemo(
        () => [
            ["Source title", article.source_article_title ?? article.article.title],
            ["Journal", article.journal_name ?? article.article.journal_name ?? "—"],
            ["DOI", article.doi ?? article.article.doi],
            ["Published", formatDate(article.published_date ?? article.article.published_date)],
        ],
        [article],
    );

    function applyResult(result: ActionResult<ReviewGeneratedArticle>, successMessage: string) {
        setLastResult(result);
        if (result.ok) {
            setArticle(result.data);
            setMessage(successMessage);
            setReasonMode(null);
            setReason("");
        } else {
            setMessage(result.error);
        }
    }

    function save() {
        setMessage(null);
        setLastResult(null);

        const difficultWords = parseJsonTextarea("difficult_words_json", difficultWordsJson);
        if (!difficultWords.ok) {
            setMessage(difficultWords.error);
            return;
        }

        const mcqs = parseJsonTextarea("mcqs_json", mcqsJson);
        if (!mcqs.ok) {
            setMessage(mcqs.error);
            return;
        }

        const limitations = parseJsonTextarea("limitations_json", limitationsJson);
        if (!limitations.ok) {
            setMessage(limitations.error);
            return;
        }

        startTransition(() => {
            void (async () => {
                const result = await saveGeneratedArticleAction(article.id, {
                    plain_title: nullableText(plainTitle),
                    subtitle: nullableText(subtitle),
                    article_body: nullableText(articleBody),
                    source_attribution: nullableText(sourceAttribution),
                    difficult_words_json: difficultWords.value,
                    mcqs_json: mcqs.value,
                    limitations_json: limitations.value,
                    note: "Saved edits from local admin dashboard.",
                });
                applyResult(result, "Edits saved.");
            })();
        });
    }

    function approve() {
        setMessage(null);
        setLastResult(null);
        startTransition(() => {
            void (async () => {
                applyResult(await approveGeneratedArticleAction(article.id), "Generated article approved.");
            })();
        });
    }

    function submitReasonAction() {
        if (!reasonMode) return;
        const cleanReason = reason.trim();
        if (!cleanReason) {
            setMessage("Please enter a reason before submitting this action.");
            return;
        }

        setMessage(null);
        setLastResult(null);
        startTransition(() => {
            void (async () => {
                const result =
                    reasonMode === "request_revision"
                        ? await requestRevisionAction(article.id, cleanReason)
                        : await rejectGeneratedArticleAction(article.id, cleanReason);
                applyResult(
                    result,
                    reasonMode === "request_revision"
                        ? "Revision requested. Status is now needs_revision."
                        : "Generated article rejected.",
                );
            })();
        });
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Review status</p>
                            <div className="mt-2">
                                <StatusBadge status={article.review_status} />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">Generated draft ID: {article.id}</div>
                    </div>

                    <div className="grid gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">plain_title</span>
                            <input
                                value={plainTitle}
                                onChange={(event) => setPlainTitle(event.target.value)}
                                disabled={isFinal}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-100"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">subtitle</span>
                            <input
                                value={subtitle}
                                onChange={(event) => setSubtitle(event.target.value)}
                                disabled={isFinal}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-100"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">article_body</span>
                            <textarea
                                value={articleBody}
                                onChange={(event) => setArticleBody(event.target.value)}
                                disabled={isFinal}
                                rows={16}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-6 outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-100"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">source_attribution</span>
                            <textarea
                                value={sourceAttribution}
                                onChange={(event) => setSourceAttribution(event.target.value)}
                                disabled={isFinal}
                                rows={3}
                                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm leading-6 outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-100"
                            />
                        </label>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">JSON editors</h2>
                    <p className="mt-1 text-sm text-slate-500">Edit valid JSON only. Backend schema validation errors will be shown if shapes are invalid.</p>

                    <div className="mt-4 grid gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">difficult_words_json</span>
                            <textarea
                                value={difficultWordsJson}
                                onChange={(event) => setDifficultWordsJson(event.target.value)}
                                disabled={isFinal}
                                rows={10}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100 outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-800"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">mcqs_json</span>
                            <textarea
                                value={mcqsJson}
                                onChange={(event) => setMcqsJson(event.target.value)}
                                disabled={isFinal}
                                rows={12}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100 outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-800"
                            />
                        </label>

                        <label className="block">
                            <span className="text-sm font-medium text-slate-700">limitations_json</span>
                            <textarea
                                value={limitationsJson}
                                onChange={(event) => setLimitationsJson(event.target.value)}
                                disabled={isFinal}
                                rows={8}
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-100 outline-none ring-slate-300 transition focus:ring-4 disabled:bg-slate-800"
                            />
                        </label>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">fact_check_json</h2>
                    <p className="mt-1 text-sm text-slate-500">Read-only fact-check output from the backend.</p>
                    <div className="mt-4">
                        <JsonBlock value={article.fact_check_json ?? null} minHeight="min-h-40" />
                    </div>
                </section>
            </div>

            <aside className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">Actions</h2>
                    {isFinal && (
                        <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            This generated article is final. Editing and moderation actions are disabled.
                        </p>
                    )}
                    <div className="mt-4 grid gap-3">
                        <button
                            type="button"
                            onClick={save}
                            disabled={isPending || isFinal}
                            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Save edits
                        </button>
                        <button
                            type="button"
                            onClick={approve}
                            disabled={isPending || isFinal}
                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            onClick={() => setReasonMode("request_revision")}
                            disabled={isPending || isFinal}
                            className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Request revision
                        </button>
                        <button
                            type="button"
                            onClick={() => setReasonMode("reject")}
                            disabled={isPending || isFinal}
                            className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Reject
                        </button>
                    </div>

                    {reasonMode && (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Reason for {reasonMode === "request_revision" ? "requesting revision" : "rejecting"}
                                <textarea
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                    rows={5}
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-4"
                                />
                            </label>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={submitReasonAction}
                                    disabled={isPending}
                                    className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Submit reason
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReasonMode(null);
                                        setReason("");
                                    }}
                                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {isPending && <p className="mt-3 text-sm text-slate-500">Saving action...</p>}
                    {message && (
                        <p className={`mt-3 rounded-xl p-3 text-sm ${lastResult?.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {message}
                        </p>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">Source article</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                        {sourceFacts.map(([label, value]) => (
                            <div key={label}>
                                <dt className="font-medium text-slate-500">{label}</dt>
                                <dd className="mt-1 text-slate-800">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-950">Curation score</h2>
                    {article.curation_score ? (
                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            {[
                                ["public_interest", article.curation_score.public_interest],
                                ["novelty", article.curation_score.novelty],
                                ["evidence_strength", article.curation_score.evidence_strength],
                                ["human_relevance", article.curation_score.human_relevance],
                                ["story_potential", article.curation_score.story_potential],
                                ["overhype_risk", article.curation_score.overhype_risk],
                            ].map(([label, value]) => (
                                <div key={String(label)} className="rounded-xl bg-slate-50 p-3">
                                    <dt className="text-xs text-slate-500">{label}</dt>
                                    <dd className="mt-1 text-lg font-semibold text-slate-900">{value ?? "—"}</dd>
                                </div>
                            ))}
                            <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                                <dt className="text-xs text-slate-500">selected</dt>
                                <dd className="mt-1 font-semibold text-slate-900">{article.curation_score.selected ? "Yes" : "No"}</dd>
                            </div>
                            {article.curation_score.reason && (
                                <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                                    <dt className="text-xs text-slate-500">reason</dt>
                                    <dd className="mt-1 text-slate-700">{article.curation_score.reason}</dd>
                                </div>
                            )}
                        </dl>
                    ) : (
                        <p className="mt-3 text-sm text-slate-500">No curation score available.</p>
                    )}
                </section>
            </aside>
        </div>
    );
}