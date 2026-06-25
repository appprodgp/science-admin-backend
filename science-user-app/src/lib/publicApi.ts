import type {
    PublicArticleDetail,
    PublicArticleListResponse,
    PublicArticleQuiz,
} from '../types/api';

export type PublicArticleListParams = {
    limit?: number;
    offset?: number;
    field?: string;
};

const getApiBaseUrl = (): string => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

    if (!baseUrl) {
        throw new Error(
            'Missing EXPO_PUBLIC_API_BASE_URL. Set it in science-user-app/.env, for example: EXPO_PUBLIC_API_BASE_URL=http://localhost:8000',
        );
    }

    return baseUrl;
};

const getErrorBody = async (response: Response): Promise<string> => {
    try {
        const body = await response.text();
        return body ? ` Response body: ${body.slice(0, 500)}` : '';
    } catch {
        return '';
    }
};

const requestPublicApi = async <T>(path: string): Promise<T> => {
    const url = `${getApiBaseUrl()}${path}`;
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const bodySnippet = await getErrorBody(response);
        const statusText = response.statusText ? ` ${response.statusText}` : '';

        throw new Error(
            `Public API request failed: GET ${path} returned ${response.status}${statusText}.${bodySnippet}`,
        );
    }

    return response.json() as Promise<T>;
};

const toArticleListQuery = (params?: PublicArticleListParams): string => {
    if (!params) {
        return '';
    }

    const query = new URLSearchParams();

    if (params.limit !== undefined) {
        query.set('limit', String(params.limit));
    }

    if (params.offset !== undefined) {
        query.set('offset', String(params.offset));
    }

    if (params.field) {
        query.set('field', params.field);
    }

    const queryString = query.toString();
    return queryString ? `?${queryString}` : '';
};

export const getPublicArticles = (
    params?: PublicArticleListParams,
): Promise<PublicArticleListResponse> => {
    return requestPublicApi<PublicArticleListResponse>(`/api/public/articles${toArticleListQuery(params)}`);
};

export const getPublicArticle = (id: string): Promise<PublicArticleDetail> => {
    return requestPublicApi<PublicArticleDetail>(`/api/public/articles/${encodeURIComponent(id)}`);
};

export const getPublicArticleQuiz = (id: string): Promise<PublicArticleQuiz> => {
    return requestPublicApi<PublicArticleQuiz>(`/api/public/articles/${encodeURIComponent(id)}/quiz`);
};