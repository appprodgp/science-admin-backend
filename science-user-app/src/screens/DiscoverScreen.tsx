import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { ArticleCard } from '../components/article/ArticleCard';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { MetricCard } from '../components/ui/MetricCard';
import { Pill } from '../components/ui/Pill';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { streakMetrics } from '../data/mockContent';
import { getPublicArticles } from '../lib/publicApi';
import type { PublicArticleSummary } from '../types/api';
import type { ScienceArticle } from '../types/content';

const ARTICLE_ACCENT_COLORS = [colors.primary, colors.secondary, colors.electricIndigo, colors.tertiary];

type FeedStateCardProps = {
    title: string;
    message: string;
    isLoading?: boolean;
    tone?: 'neutral' | 'error';
};

function formatField(field: string | null): string {
    if (!field) {
        return 'Science';
    }

    return field
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function getIconForField(field: string | null): string {
    const normalizedField = field?.toLowerCase() ?? '';

    if (normalizedField.includes('astro') || normalizedField.includes('space')) {
        return '🪐';
    }

    if (normalizedField.includes('climate') || normalizedField.includes('earth') || normalizedField.includes('ocean')) {
        return '🌊';
    }

    if (normalizedField.includes('neuro') || normalizedField.includes('brain')) {
        return '🧠';
    }

    if (normalizedField.includes('physics')) {
        return '⚛️';
    }

    if (normalizedField.includes('bio') || normalizedField.includes('medicine') || normalizedField.includes('health')) {
        return '🧬';
    }

    if (normalizedField.includes('chem')) {
        return '🧪';
    }

    return '🔬';
}

function getAccentColorForArticle(article: PublicArticleSummary, index: number): string {
    const normalizedField = article.field?.toLowerCase() ?? '';

    if (normalizedField.includes('astro') || normalizedField.includes('space')) {
        return colors.primary;
    }

    if (normalizedField.includes('climate') || normalizedField.includes('earth') || normalizedField.includes('ocean')) {
        return colors.secondary;
    }

    if (normalizedField.includes('neuro') || normalizedField.includes('brain')) {
        return colors.electricIndigo;
    }

    return ARTICLE_ACCENT_COLORS[index % ARTICLE_ACCENT_COLORS.length];
}

function getReadingLevel(readMinutes: number | null): ScienceArticle['readingLevel'] {
    if (readMinutes !== null && readMinutes <= 4) {
        return 'foundational';
    }

    if (readMinutes !== null && readMinutes >= 8) {
        return 'advanced';
    }

    return 'intermediate';
}

function formatPublishedLabel(publishedAt: string | null): string {
    if (!publishedAt) {
        return 'Recently published';
    }

    const publishedDate = new Date(publishedAt);

    if (Number.isNaN(publishedDate.getTime())) {
        return 'Recently published';
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const publishedStart = new Date(
        publishedDate.getFullYear(),
        publishedDate.getMonth(),
        publishedDate.getDate(),
    );
    const dayDifference = Math.floor((todayStart.getTime() - publishedStart.getTime()) / 86_400_000);

    if (dayDifference <= 0) {
        return 'Today';
    }

    if (dayDifference === 1) {
        return 'Yesterday';
    }

    if (dayDifference < 7) {
        return `${dayDifference} days ago`;
    }

    return publishedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

function toScienceArticle(article: PublicArticleSummary, index: number): ScienceArticle {
    const readMinutes = Math.max(1, Math.round(article.readMinutes ?? 5));
    const fieldLabel = formatField(article.field);
    const sourceLabel = article.source.journalName ?? article.source.publisher ?? 'Public science source';
    const summary = article.summary ?? article.subtitle ?? 'A concise evidence-led science story from the public article feed.';

    return {
        id: article.id,
        slug: article.id,
        title: article.title,
        dek: article.subtitle ?? summary,
        summary,
        category: fieldLabel as ScienceArticle['category'],
        readingLevel: getReadingLevel(article.readMinutes),
        readMinutes,
        publishedLabel: formatPublishedLabel(article.publishedAt),
        sourceLabel,
        author: article.source.publisher ?? article.source.journalName ?? 'Public article feed',
        icon: getIconForField(article.field),
        accentColor: getAccentColorForArticle(article, index),
        tags: [
            fieldLabel,
            pluralize(article.glossaryCount, 'glossary term'),
            pluralize(article.quizQuestionCount, 'quiz prompt'),
        ],
        stats: [
            { label: 'Glossary', value: String(article.glossaryCount) },
            { label: 'Quiz', value: String(article.quizQuestionCount) },
        ],
        sections: [],
        glossaryTermIds: Array.from({ length: article.glossaryCount }, (_, termIndex) => `${article.id}-glossary-${termIndex}`),
        quizQuestionIds: Array.from({ length: article.quizQuestionCount }, (_, questionIndex) => `${article.id}-quiz-${questionIndex}`),
        isFeatured: index === 0,
    };
}

function openArticle(article: ScienceArticle) {
    router.push({ pathname: '/article/[id]', params: { id: article.id } });
}

function FeedStateCard({ title, message, isLoading = false, tone = 'neutral' }: FeedStateCardProps) {
    const isError = tone === 'error';

    return (
        <GlassCard variant="subtle" style={[styles.feedStateCard, isError ? styles.feedErrorCard : null]}>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={[styles.feedStateTitle, isError ? styles.feedErrorTitle : null]}>{title}</Text>
            <Text style={styles.feedStateMessage}>{message}</Text>
        </GlassCard>
    );
}

export function DiscoverScreen() {
    const [articles, setArticles] = useState<ScienceArticle[]>([]);
    const [isLoadingArticles, setIsLoadingArticles] = useState(true);
    const [articleError, setArticleError] = useState<string | null>(null);

    const currentStreak = streakMetrics[0];
    const quizAccuracy = streakMetrics[1];
    const featuredArticle = articles[0];
    const secondaryArticles = articles.slice(1);

    useEffect(() => {
        let isMounted = true;

        const loadPublicArticles = async () => {
            setIsLoadingArticles(true);
            setArticleError(null);

            try {
                const response = await getPublicArticles({ limit: 20, offset: 0 });

                if (isMounted) {
                    setArticles(response.items.map(toScienceArticle));
                }
            } catch (error) {
                if (isMounted) {
                    setArticleError(error instanceof Error ? error.message : 'Unable to load public articles right now.');
                    setArticles([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingArticles(false);
                }
            }
        };

        void loadPublicArticles();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <AppScreen backgroundVariant="default" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Daily discovery"
                title="A calmer way to keep up with science."
                subtitle="Read one evidence-led story, learn the key terms, and bank your comprehension XP."
                rightAccessory={<Pill label="12 day streak" tone="primary" icon="🔥" size="sm" />}
            />

            <GlassCard variant="elevated" style={styles.goalCard}>
                <View style={styles.goalHeader}>
                    <View style={styles.goalCopy}>
                        <Text style={styles.goalEyebrow}>Today’s clarity goal</Text>
                        <Text style={styles.goalTitle}>Finish one article and answer two quiz prompts.</Text>
                    </View>
                    <View style={styles.xpBadge}>
                        <Text style={styles.xpValue}>+120</Text>
                        <Text style={styles.xpLabel}>XP</Text>
                    </View>
                </View>
                <ProgressBar progress={0.58} label="Daily progress" showPercent />
                <View style={styles.goalPills}>
                    <Pill label={featuredArticle ? `${featuredArticle.readMinutes} min read` : 'Fresh science'} tone="neutral" size="sm" />
                    <Pill
                        label={featuredArticle ? pluralize(featuredArticle.glossaryTermIds.length, 'glossary term') : 'Glossary ready'}
                        tone="secondary"
                        size="sm"
                    />
                    <Pill label={articleError ? 'Feed issue' : 'Live API'} tone="neutral" size="sm" />
                </View>
            </GlassCard>

            <View style={styles.metricsGrid}>
                <MetricCard
                    label={currentStreak.label}
                    value={currentStreak.value}
                    unit={currentStreak.unit}
                    detail={currentStreak.description}
                    delta={currentStreak.delta}
                    icon={currentStreak.icon}
                    progress={currentStreak.progress}
                    accentColor={currentStreak.accentColor}
                    style={styles.metricItem}
                />
                <MetricCard
                    label={quizAccuracy.label}
                    value={quizAccuracy.value}
                    unit={quizAccuracy.unit}
                    detail={quizAccuracy.description}
                    delta={quizAccuracy.delta}
                    icon={quizAccuracy.icon}
                    progress={quizAccuracy.progress}
                    accentColor={quizAccuracy.accentColor}
                    style={styles.metricItem}
                />
            </View>

            <View style={styles.sectionBlock}>
                <SectionHeader
                    eyebrow="Featured"
                    title="Editor’s pick"
                    subtitle="A premium card powered by the public backend article feed."
                />
                {isLoadingArticles ? (
                    <FeedStateCard
                        title="Loading public articles"
                        message="Fetching the latest public science stories from the backend."
                        isLoading
                    />
                ) : articleError ? (
                    <FeedStateCard title="Couldn’t load public articles" message={articleError} tone="error" />
                ) : featuredArticle ? (
                    <ArticleCard article={featuredArticle} variant="featured" onPress={openArticle} />
                ) : (
                    <FeedStateCard
                        title="No public articles yet"
                        message="The backend returned an empty article list. Publish an article to see it appear here."
                    />
                )}
            </View>

            {!isLoadingArticles && !articleError && featuredArticle ? (
                <View style={styles.sectionBlock}>
                    <SectionHeader title="More to explore" subtitle="More generated public articles from the backend." />
                    {secondaryArticles.length > 0 ? (
                        <View style={styles.articleList}>
                            {secondaryArticles.map((article) => (
                                <ArticleCard key={article.id} article={article} onPress={openArticle} />
                            ))}
                        </View>
                    ) : (
                        <FeedStateCard
                            title="You’re caught up"
                            message="Only one public article is available right now. More articles will appear here as they are published."
                        />
                    )}
                </View>
            ) : null}

            <GlassCard variant="subtle" style={styles.noteCard}>
                <Text style={styles.noteTitle}>Public feed connected</Text>
                <Text style={styles.noteText}>
                    Article cards now use backend GeneratedArticle IDs and navigate to the existing article route shell.
                    Full reader, quiz, streaks, achievements, and level-up screens are intentionally untouched in this step.
                </Text>
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
    },
    goalCard: {
        gap: spacing.md,
    },
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    goalCopy: {
        flex: 1,
        gap: spacing.xs,
    },
    goalEyebrow: {
        ...typography.sizes.labelSm,
        color: colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    goalTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    xpBadge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.45)',
        backgroundColor: 'rgba(78,222,163,0.14)',
    },
    xpValue: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '900',
    },
    xpLabel: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        fontWeight: '700',
    },
    goalPills: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    metricItem: {
        flex: 1,
    },
    sectionBlock: {
        gap: spacing.md,
    },
    articleList: {
        gap: spacing.md,
    },
    feedStateCard: {
        gap: spacing.sm,
        borderRadius: radii.lg,
        alignItems: 'flex-start',
    },
    feedErrorCard: {
        borderColor: 'rgba(255,180,171,0.35)',
    },
    feedStateTitle: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    feedErrorTitle: {
        color: colors.error,
    },
    feedStateMessage: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    noteCard: {
        gap: spacing.xs,
        borderRadius: radii.lg,
    },
    noteTitle: {
        ...typography.sizes.labelMd,
        color: colors.secondary,
        fontWeight: '800',
    },
    noteText: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
    },
});

export default DiscoverScreen;