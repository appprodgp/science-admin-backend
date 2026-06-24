export type ReadingLevel = 'foundational' | 'intermediate' | 'advanced';

export type ArticleCategory =
    | 'Astronomy'
    | 'Biology'
    | 'Climate'
    | 'Physics'
    | 'Neuroscience';

export type ArticleSectionKind = 'overview' | 'body' | 'callout' | 'takeaway';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'cosmic';

export type QuizOptionLabel = 'A' | 'B' | 'C' | 'D';

export type ArticleStat = {
    label: string;
    value: string;
};

export type ArticleSection = {
    id: string;
    heading: string;
    body: string[];
    kind: ArticleSectionKind;
    glossaryTermIds?: string[];
};

export type GlossaryTermData = {
    id: string;
    term: string;
    pronunciation?: string;
    definition: string;
    plainLanguage: string;
    example?: string;
    relatedArticleIds?: string[];
};

export type ScienceArticle = {
    id: string;
    slug: string;
    title: string;
    dek: string;
    summary: string;
    category: ArticleCategory;
    readingLevel: ReadingLevel;
    readMinutes: number;
    publishedLabel: string;
    sourceLabel: string;
    author: string;
    icon: string;
    accentColor: string;
    tags: string[];
    stats: ArticleStat[];
    sections: ArticleSection[];
    glossaryTermIds: string[];
    quizQuestionIds: string[];
    isFeatured?: boolean;
};

export type QuizOption = {
    id: string;
    label: QuizOptionLabel;
    text: string;
    isCorrect: boolean;
    feedback: string;
};

export type QuizQuestion = {
    id: string;
    articleId: string;
    prompt: string;
    explanation: string;
    options: QuizOption[];
};

export type StreakMetric = {
    id: string;
    label: string;
    value: string;
    unit?: string;
    delta?: string;
    description: string;
    progress?: number;
    icon: string;
    accentColor: string;
};

export type AchievementCardData = {
    id: string;
    title: string;
    description: string;
    icon: string;
    tier: AchievementTier;
    progress: number;
    goal: number;
    isUnlocked: boolean;
    accentColor: string;
};

export type LevelUpRewardData = {
    id: string;
    levelNumber: number;
    levelTitle: string;
    previousLevel: string;
    nextLevel: string;
    xpAwarded: number;
    unlockedRewards: string[];
    message: string;
    primaryActionLabel: string;
};