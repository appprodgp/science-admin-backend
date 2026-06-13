"use server";

import { revalidatePath } from "next/cache";

import {
    approveGeneratedArticle,
    getErrorMessage,
    rejectGeneratedArticle,
    requestRevision,
    runAiPipeline,
    runDiscovery,
    updateGeneratedArticle,
    type GeneratedArticleUpdatePayload,
    type ReviewGeneratedArticle,
} from "@/lib/api";

export type ActionResult<T> =
    | { ok: true; data: T; message?: string }
    | { ok: false; error: string };

async function toActionResult<T>(callback: () => Promise<T>): Promise<ActionResult<T>> {
    try {
        const data = await callback();
        return { ok: true, data };
    } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
    }
}

export async function runDiscoveryAction(limitPerJournal: number): Promise<ActionResult<Record<string, unknown>>> {
    return toActionResult(async () => {
        const result = await runDiscovery(limitPerJournal);
        revalidatePath("/");
        revalidatePath("/discovery");
        revalidatePath("/articles");
        return result;
    });
}

export async function runAiPipelineAction(
    limit: number,
    articleId?: string | null,
): Promise<ActionResult<Record<string, unknown>>> {
    return toActionResult(async () => {
        const result = await runAiPipeline(limit, articleId ?? null);
        revalidatePath("/");
        revalidatePath("/articles");
        revalidatePath("/review");
        if (articleId) revalidatePath(`/articles/${articleId}`);
        return result;
    });
}

export async function saveGeneratedArticleAction(
    generatedArticleId: string,
    payload: GeneratedArticleUpdatePayload,
): Promise<ActionResult<ReviewGeneratedArticle>> {
    return toActionResult(async () => {
        const result = await updateGeneratedArticle(generatedArticleId, payload);
        revalidatePath(`/review/${generatedArticleId}`);
        revalidatePath("/review");
        revalidatePath(`/articles/${result.article_id}`);
        return result;
    });
}

export async function approveGeneratedArticleAction(
    generatedArticleId: string,
): Promise<ActionResult<ReviewGeneratedArticle>> {
    return toActionResult(async () => {
        const result = await approveGeneratedArticle(generatedArticleId);
        revalidatePath(`/review/${generatedArticleId}`);
        revalidatePath("/review");
        revalidatePath("/");
        revalidatePath(`/articles/${result.article_id}`);
        return result;
    });
}

export async function requestRevisionAction(
    generatedArticleId: string,
    reason: string,
): Promise<ActionResult<ReviewGeneratedArticle>> {
    return toActionResult(async () => {
        const result = await requestRevision(generatedArticleId, reason);
        revalidatePath(`/review/${generatedArticleId}`);
        revalidatePath("/review");
        revalidatePath("/");
        revalidatePath(`/articles/${result.article_id}`);
        return result;
    });
}

export async function rejectGeneratedArticleAction(
    generatedArticleId: string,
    reason: string,
): Promise<ActionResult<ReviewGeneratedArticle>> {
    return toActionResult(async () => {
        const result = await rejectGeneratedArticle(generatedArticleId, reason);
        revalidatePath(`/review/${generatedArticleId}`);
        revalidatePath("/review");
        revalidatePath("/");
        revalidatePath(`/articles/${result.article_id}`);
        return result;
    });
}