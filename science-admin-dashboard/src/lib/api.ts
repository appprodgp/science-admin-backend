export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type HealthStatus = {
    status: string;
    service?: string;
    env?: string;
    [key: string]: unknown;
};

export type DiscoverySummary = {
    metadata_found?: number;
    license_rejected: number;
    xml_not_found: number;
    xml_ready?: number;
    extracted: number;
    failed: number;
    [key: string]: number | undefined;
};

export type ReviewSummary = {
    pending: number;
    needs_revision: number;
    approved: number;
    rejected: number;
};

export type Article = {
    id: string;
    doi: string;
    title: string;
    journal_name: string | null;
    journal_issn?: string | null;
    publisher?: string | null;
    published_date: string | null;
    source_url?: string | null;
    license_url?: string | null;
    license_type?: string | null;
    abstract_from_metadata?: string | null;
    xml_url?: string | null;
    xml_source?: string | null;
    xml_r2_key?: string | null;
    status: string;
    field?: string | null;
    priority_score?: number | null;
    error_message?: string | null;
    created_at: string;
    updated_at: string;
};

export type ArticleSection = {
    id: string;
    article_id: string;
    section_name: string;
    section_text: string;
    source: string | null;
    created_at: string;
    updated_at: string;
};

export type ArticleFigure = {
    id: string;
    article_id: string;
    figure_label: string | null;
    caption: string;
    image_r2_key: string | null;
    image_url: string | null;
    source_credit: string | null;
    license_note: string | null;
    created_at: string;
    updated_at: string;
};

export type CurationScore = {
    id: string;
    article_id: string;
    public_interest: number | null;
    novelty: number | null;
    evidence_strength: number | null;
    human_relevance: number | null;
    story_potential: number | null;
    overhype_risk: number | null;
    selected: boolean;
    reason: string | null;
    model: string | null;
    created_at: string;
};

export type GeneratedArticle = {
    id: string;
    article_id: string;
    plain_title: string | null;
    subtitle: string | null;
    article_body: string | null;
    difficult_words_json: unknown;
    mcqs_json: unknown;
    limitations_json: unknown;
    source_attribution: string | null;
    fact_check_json: unknown;
    generation_model: string | null;
    review_status: string;
    published_at: string | null;
    created_at: string;
    updated_at: string;
};

export type ReviewQueueItem = GeneratedArticle & {
    generated_article_id: string;
    doi: string | null;
    source_article_title: string | null;
    journal_name: string | null;
    published_date: string | null;
};

export type ReviewGeneratedArticle = ReviewQueueItem & {
    article: Article;
    curation_score: CurationScore | null;
};

export type GeneratedArticleUpdatePayload = {
    plain_title?: string | null;
    subtitle?: string | null;
    article_body?: string | null;
    difficult_words_json?: unknown;
    mcqs_json?: unknown;
    limitations_json?: unknown;
    source_attribution?: string | null;
    note?: string | null;
};

export type LlmRun = {
    id: string;
    article_id: string | null;
    task_name: string;
    provider: string | null;
    model: string | null;
    input_tokens_estimate: number | null;
    output_tokens_estimate: number | null;
    cost_estimate: string | number | null;
    status: string;
    error_message: string | null;
    created_at: string;
};

export class ApiError extends Error {
    status: number;
    details: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

export function getApiBaseUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        throw new ApiError("NEXT_PUBLIC_API_BASE_URL is not configured.", 0);
    }
    return baseUrl.replace(/\/$/, "");
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | null | undefined>): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${getApiBaseUrl()}${normalizedPath}`);

    Object.entries(query ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            url.searchParams.set(key, String(value));
        }
    });

    return url.toString();
}

function backendMessageFromPayload(payload: unknown): string | null {
    if (!payload) return null;
    if (typeof payload === "string") return payload;

    if (typeof payload === "object" && "detail" in payload) {
        const detail = (payload as { detail?: unknown }).detail;
        if (typeof detail === "string") return detail;
        if (Array.isArray(detail)) {
            return detail
                .map((item) => {
                    if (typeof item === "string") return item;
                    if (typeof item === "object" && item && "msg" in item) {
                        return String((item as { msg: unknown }).msg);
                    }
                    return JSON.stringify(item);
                })
                .join("; ");
        }
        if (detail) return JSON.stringify(detail);
    }

    if (typeof payload === "object" && "message" in payload) {
        const message = (payload as { message?: unknown }).message;
        if (typeof message === "string") return message;
    }

    return null;
}

async function parseResponse(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
        return response.json();
    }

    const text = await response.text();
    return text || null;
}

async function apiFetch<T>(
    path: string,
    options: RequestInit = {},
    query?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
    const headers = new Headers(options.headers);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
        response = await fetch(buildUrl(path, query), {
            ...options,
            headers,
            cache: "no-store",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown network error";
        throw new ApiError(`Unable to reach backend: ${message}`, 0, error);
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
        const message = backendMessageFromPayload(payload) ?? response.statusText ?? "Backend request failed";
        throw new ApiError(message, response.status, payload);
    }

    return payload as T;
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) return error.message;
    if (error instanceof Error) return error.message;
    return "Unexpected error";
}

export function getHealth(): Promise<HealthStatus> {
    return apiFetch<HealthStatus>("/health");
}

export function getDiscoverySummary(): Promise<DiscoverySummary> {
    return apiFetch<DiscoverySummary>("/api/admin/discovery/summary");
}

export function getArticles(status?: string): Promise<Article[]> {
    return apiFetch<Article[]>("/api/admin/articles/", {}, { status, limit: 200 });
}

export function getArticle(articleId: string): Promise<Article> {
    return apiFetch<Article>(`/api/admin/articles/${articleId}`);
}

export function getArticleSections(articleId: string): Promise<ArticleSection[]> {
    return apiFetch<ArticleSection[]>(`/api/admin/articles/${articleId}/sections`);
}

export function getArticleFigures(articleId: string): Promise<ArticleFigure[]> {
    return apiFetch<ArticleFigure[]>(`/api/admin/articles/${articleId}/figures`);
}

export function getReviewQueue(): Promise<ReviewQueueItem[]> {
    return apiFetch<ReviewQueueItem[]>("/api/admin/review/queue");
}

export function getReviewSummary(): Promise<ReviewSummary> {
    return apiFetch<ReviewSummary>("/api/admin/review/queues/summary");
}

export function getGeneratedArticle(generatedArticleId: string): Promise<ReviewGeneratedArticle> {
    return apiFetch<ReviewGeneratedArticle>(`/api/admin/review/generated/${generatedArticleId}`);
}

export function getGeneratedForArticle(articleId: string): Promise<GeneratedArticle[]> {
    return apiFetch<GeneratedArticle[]>(`/api/admin/articles/${articleId}/generated`);
}

export function updateGeneratedArticle(
    generatedArticleId: string,
    payload: GeneratedArticleUpdatePayload,
): Promise<ReviewGeneratedArticle> {
    return apiFetch<ReviewGeneratedArticle>(`/api/admin/review/generated/${generatedArticleId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function approveGeneratedArticle(generatedArticleId: string): Promise<ReviewGeneratedArticle> {
    return apiFetch<ReviewGeneratedArticle>(`/api/admin/review/generated/${generatedArticleId}/approve`, {
        method: "POST",
        body: JSON.stringify({ note: "Approved from local admin dashboard." }),
    });
}

export function rejectGeneratedArticle(
    generatedArticleId: string,
    reason: string,
): Promise<ReviewGeneratedArticle> {
    return apiFetch<ReviewGeneratedArticle>(`/api/admin/review/generated/${generatedArticleId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
}

export function requestRevision(
    generatedArticleId: string,
    reason: string,
): Promise<ReviewGeneratedArticle> {
    return apiFetch<ReviewGeneratedArticle>(`/api/admin/review/generated/${generatedArticleId}/request-revision`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
}

export function runDiscovery(limit_per_journal: number): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/admin/discovery/run", {
        method: "POST",
        body: JSON.stringify({ limit_per_journal }),
    });
}

export function runAiPipeline(limit: number, article_id?: string | null): Promise<Record<string, unknown>> {
    return apiFetch<Record<string, unknown>>("/api/admin/ai/run", {
        method: "POST",
        body: JSON.stringify({ limit, article_id: article_id ?? null }),
    });
}

export function getLlmRuns(limit = 50): Promise<LlmRun[]> {
    return apiFetch<LlmRun[]>("/api/admin/llm-runs/", {}, { limit });
}

export function getCurationScores(articleId: string): Promise<CurationScore[]> {
    return apiFetch<CurationScore[]>(`/api/admin/ai/curation-scores/${articleId}`);
}