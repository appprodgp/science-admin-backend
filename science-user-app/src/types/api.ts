export type PublicArticleSource = {
    title: string;
    doi: string;
    journalName: string | null;
    publisher: string | null;
    publishedDate: string | null;
    sourceUrl: string | null;
    licenseType: string | null;
    licenseUrl: string | null;
    attribution: string | null;
};

export type PublicGlossaryTerm = {
    id: string;
    word: string;
    definition: string;
    whyItMatters: string;
};

export type PublicArticleSummary = {
    id: string;
    title: string;
    subtitle: string | null;
    summary: string | null;
    field: string | null;
    readMinutes: number | null;
    publishedAt: string | null;
    source: PublicArticleSource;
    glossaryCount: number;
    quizQuestionCount: number;
};

export type PublicArticleListResponse = {
    items: PublicArticleSummary[];
    limit: number;
    offset: number;
    total: number;
};

export type PublicArticleDetail = PublicArticleSummary & {
    body: string;
    paragraphs: string[];
    glossary: PublicGlossaryTerm[];
    limitations: string[];
};

export type PublicQuizOptionLabel = 'A' | 'B' | 'C' | 'D';

export type PublicQuizOption = {
    id: string;
    label: PublicQuizOptionLabel;
    text: string;
};

export type PublicQuizQuestion = {
    id: string;
    prompt: string;
    options: PublicQuizOption[];
    correctOptionId: string;
    explanation: string;
};

export type PublicArticleQuiz = {
    articleId: string;
    title: string;
    questions: PublicQuizQuestion[];
};