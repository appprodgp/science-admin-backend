"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageHeader } from "@/components/PageHeader";
import { ReviewEditor } from "@/components/ReviewEditor";
import { getErrorMessage, getGeneratedArticle, type ReviewGeneratedArticle } from "@/lib/api";

export function ReviewDetailPageClient() {
    const searchParams = useSearchParams();
    const generatedArticleId = searchParams.get("id") ?? "";
    const [generatedArticle, setGeneratedArticle] = useState<ReviewGeneratedArticle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadGeneratedArticle() {
            if (!generatedArticleId) {
                setGeneratedArticle(null);
                setError("Missing generated article id. Open this page from the Review Queue or add ?id=<generated_article_id>.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setGeneratedArticle(null);

            try {
                const data = await getGeneratedArticle(generatedArticleId);
                if (!cancelled) setGeneratedArticle(data);
            } catch (caught) {
                if (!cancelled) setError(getErrorMessage(caught));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        void loadGeneratedArticle();

        return () => {
            cancelled = true;
        };
    }, [generatedArticleId]);

    return (
        <div>
            <PageHeader
                title="Review generated article"
                description="Edit draft content, inspect fact checks, and record approve/revision/reject decisions."
            />

            {loading ? (
                <p className="text-sm text-slate-500">Loading generated article...</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : generatedArticle ? (
                <ReviewEditor key={generatedArticle.id} initialArticle={generatedArticle} />
            ) : (
                <EmptyState title="Generated article not found" message="No review detail is available for this id." />
            )}
        </div>
    );
}