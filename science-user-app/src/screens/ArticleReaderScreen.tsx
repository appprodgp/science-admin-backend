import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { GlossaryTerm } from '../components/article/GlossaryTerm';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { getPublicArticle } from '../lib/publicApi';
import type { PublicArticleDetail, PublicGlossaryTerm } from '../types/api';
import type { GlossaryTermData } from '../types/content';

type RouteParams = {
    id?: string | string[];
};

type ArticleBodySectionKind = 'overview' | 'body' | 'callout' | 'takeaway';

type ArticleBodySection = {
    id: string;
    heading: string;
    body: string[];
    kind: ArticleBodySectionKind;
};

type ReaderStateCardProps = {
    title: string;
    message: string;
    isLoading?: boolean;
    tone?: 'neutral' | 'error';
};

type SourceMetadataRow = {
    label: string;
    value: string;
};

type SectionMeta = {
    label: string;
    icon: string;
    borderColor: string;
    backgroundColor: string;
    titleColor: string;
};

const ARTICLE_ACCENT_COLORS = [colors.primary, colors.secondary, colors.electricIndigo, colors.tertiary];

const sectionMeta: Record<ArticleBodySectionKind, SectionMeta> = {
    overview: {
        label: 'Overview',
        icon: '✦',
        borderColor: 'rgba(78,222,163,0.32)',
        backgroundColor: 'rgba(78,222,163,0.08)',
        titleColor: colors.primary,
    },
    body: {
        label: 'Evidence',
        icon: '⌁',
        borderColor: colors.glassStroke,
        backgroundColor: 'rgba(255,255,255,0.03)',
        titleColor: colors.onSurface,
    },
    callout: {
        label: 'Watch for this',
        icon: '◌',
        borderColor: 'rgba(192,193,255,0.34)',
        backgroundColor: 'rgba(192,193,255,0.1)',
        titleColor: colors.secondary,
    },
    takeaway: {
        label: 'Takeaway',
        icon: '✓',
        borderColor: 'rgba(99,102,241,0.42)',
        backgroundColor: 'rgba(99,102,241,0.12)',
        titleColor: colors.secondary,
    },
};

function getParamValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

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

function getAccentColorForField(field: string | null): string {
    const normalizedField = field?.toLowerCase() ?? '';

    if (normalizedField.includes('astro') || normalizedField.includes('space')) {
        return colors.primary;
    }

    if (normalizedField.includes('climate') || normalizedField.includes('earth') || normalizedField.includes('ocean')) {
        return colors.secondary;
    }

    if (normalizedField.includes('neuro') || normalizedField.includes('brain')) {
        return colors.electricIndigo;
    }

    return ARTICLE_ACCENT_COLORS[normalizedField.length % ARTICLE_ACCENT_COLORS.length];
}

function getReadMinutes(article: PublicArticleDetail): number {
    return Math.max(1, Math.round(article.readMinutes ?? 5));
}

function getReadingLevelLabel(readMinutes: number): string {
    if (readMinutes <= 4) {
        return 'Foundational';
    }

    if (readMinutes >= 8) {
        return 'Advanced';
    }

    return 'Intermediate';
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`;
}

function formatDateLabel(value: string | null): string | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function splitBodyIntoParagraphs(body: string): string[] {
    return body
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
}

function getArticleParagraphs(article: PublicArticleDetail): string[] {
    if (article.paragraphs.length > 0) {
        return article.paragraphs;
    }

    return splitBodyIntoParagraphs(article.body);
}

function toArticleSections(article: PublicArticleDetail): ArticleBodySection[] {
    const sections: ArticleBodySection[] = [];
    const bodyParagraphs = getArticleParagraphs(article);

    if (article.summary) {
        sections.push({
            id: `${article.id}-overview`,
            heading: 'What this story is about',
            body: [article.summary],
            kind: 'overview',
        });
    }

    if (bodyParagraphs.length > 0) {
        sections.push({
            id: `${article.id}-body`,
            heading: 'Article body',
            body: bodyParagraphs,
            kind: 'body',
        });
    }

    return sections;
}

function toGlossaryTerm(term: PublicGlossaryTerm): GlossaryTermData {
    return {
        id: term.id,
        term: term.word,
        definition: term.definition,
        plainLanguage: term.whyItMatters || term.definition,
        example: term.whyItMatters ? `Why it matters: ${term.whyItMatters}` : undefined,
    };
}

function getSourceMetadataRows(article: PublicArticleDetail): SourceMetadataRow[] {
    const publishedDateLabel = formatDateLabel(article.source.publishedDate ?? article.publishedAt);
    const rows: Array<SourceMetadataRow | null> = [
        { label: 'Source article', value: article.source.title },
        article.source.journalName ? { label: 'Journal', value: article.source.journalName } : null,
        article.source.publisher ? { label: 'Publisher', value: article.source.publisher } : null,
        article.source.doi ? { label: 'DOI', value: article.source.doi } : null,
        publishedDateLabel ? { label: 'Published', value: publishedDateLabel } : null,
        article.source.licenseType ? { label: 'License', value: article.source.licenseType } : null,
        article.source.sourceUrl ? { label: 'Source URL', value: article.source.sourceUrl } : null,
        article.source.attribution ? { label: 'Attribution', value: article.source.attribution } : null,
    ];

    return rows.filter((row): row is SourceMetadataRow => row !== null);
}

function MetaRow({ label, value }: SourceMetadataRow) {
    return (
        <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
        </View>
    );
}

function ReaderStateCard({ title, message, isLoading = false, tone = 'neutral' }: ReaderStateCardProps) {
    const isError = tone === 'error';

    return (
        <GlassCard variant="subtle" style={[styles.readerStateCard, isError ? styles.readerErrorCard : null]}>
            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
            <Text style={[styles.readerStateTitle, isError ? styles.readerErrorTitle : null]}>{title}</Text>
            <Text style={styles.readerStateMessage}>{message}</Text>
        </GlassCard>
    );
}

function ArticleSectionBlock({ section }: { section: ArticleBodySection }) {
    const meta = sectionMeta[section.kind];

    return (
        <GlassCard
            variant={section.kind === 'body' ? 'default' : 'subtle'}
            style={[styles.sectionCard, { borderColor: meta.borderColor, backgroundColor: meta.backgroundColor }]}>
            <View style={styles.sectionTopRow}>
                <Pill label={meta.label} icon={meta.icon} tone={section.kind === 'body' ? 'neutral' : 'secondary'} size="sm" />
            </View>
            <Text style={[styles.sectionHeading, { color: meta.titleColor }]}>{section.heading}</Text>
            {section.body.map((paragraph, index) => (
                <Text key={`${section.id}-${index}`} style={styles.paragraph}>
                    {paragraph}
                </Text>
            ))}
        </GlassCard>
    );
}

export function ArticleReaderScreen() {
    const params = useLocalSearchParams<RouteParams>();
    const articleId = getParamValue(params.id);
    const [article, setArticle] = useState<PublicArticleDetail | null>(null);
    const [isLoadingArticle, setIsLoadingArticle] = useState(true);
    const [articleError, setArticleError] = useState<string | null>(null);
    const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadArticle = async () => {
            setSelectedTermId(null);

            if (!articleId) {
                setArticle(null);
                setArticleError('Missing article id in the route. Open an article from Discover to load its public details.');
                setIsLoadingArticle(false);
                return;
            }

            setIsLoadingArticle(true);
            setArticleError(null);

            try {
                const articleDetail = await getPublicArticle(articleId);

                if (isMounted) {
                    setArticle(articleDetail);
                }
            } catch (error) {
                if (isMounted) {
                    setArticle(null);
                    setArticleError(error instanceof Error ? error.message : 'Unable to load this public article right now.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingArticle(false);
                }
            }
        };

        void loadArticle();

        return () => {
            isMounted = false;
        };
    }, [articleId]);

    const articleSections = useMemo(() => (article ? toArticleSections(article) : []), [article]);
    const articleGlossary = useMemo(() => article?.glossary.map(toGlossaryTerm) ?? [], [article?.glossary]);
    const sourceMetadataRows = useMemo(() => (article ? getSourceMetadataRows(article) : []), [article]);
    const selectedTerm = articleGlossary.find((term) => term.id === selectedTermId);

    const fieldLabel = article ? formatField(article.field) : 'Science';
    const accentColor = article ? getAccentColorForField(article.field) : colors.primary;
    const readMinutes = article ? getReadMinutes(article) : 0;
    const icon = article ? getIconForField(article.field) : '🔬';
    const publishedLabel = article ? formatDateLabel(article.publishedAt) ?? 'Recently published' : 'Loading';
    const sourceLabel = article?.source.journalName ?? article?.source.publisher ?? 'Public science source';

    function handleGlossaryPress(term: GlossaryTermData) {
        setSelectedTermId((currentTermId) => (currentTermId === term.id ? null : term.id));
    }

    function startQuiz() {
        if (!article) {
            return;
        }

        router.push({ pathname: '/article/[id]/quiz', params: { id: article.id } });
    }

    return (
        <AppScreen backgroundVariant="aurora" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Article reader"
                title="Read, decode, then quiz."
                subtitle={article ? 'Live public article detail from the backend.' : 'Loading public article detail from the backend.'}
                rightAccessory={<Pill label={article ? `${readMinutes} min` : 'Loading'} tone="primary" icon="⏱️" size="sm" />}
            />

            {isLoadingArticle ? (
                <ReaderStateCard title="Loading article" message="Fetching this public article from the backend." isLoading />
            ) : articleError ? (
                <ReaderStateCard title="Couldn’t load article" message={articleError} tone="error" />
            ) : article ? (
                <>
                    <GlassCard variant="elevated" style={styles.heroCard}>
                        <View style={styles.heroTopRow}>
                            <View style={[styles.articleIcon, { borderColor: `${accentColor}66`, backgroundColor: `${accentColor}18` }]}>
                                <Text style={styles.articleIconText}>{icon}</Text>
                            </View>
                            <View style={styles.heroPills}>
                                <Pill label={fieldLabel} tone="primary" size="sm" />
                                <Pill label={getReadingLevelLabel(readMinutes)} tone="secondary" size="sm" />
                            </View>
                        </View>

                        <View style={styles.heroCopy}>
                            <Text style={styles.articleTitle}>{article.title}</Text>
                            {article.subtitle ? <Text style={styles.articleDek}>{article.subtitle}</Text> : null}
                            {article.summary ? <Text style={styles.articleSummary}>{article.summary}</Text> : null}
                        </View>

                        <View style={styles.tagRow}>
                            <Pill label={fieldLabel} tone="neutral" size="sm" />
                            <Pill label={pluralize(article.glossary.length, 'glossary term')} tone="neutral" size="sm" />
                            <Pill label={pluralize(article.quizQuestionCount, 'quiz prompt')} tone="neutral" size="sm" />
                        </View>

                        <View style={styles.articleStatsGrid}>
                            <View style={styles.articleStat}>
                                <Text style={styles.articleStatLabel}>Read</Text>
                                <Text style={styles.articleStatValue}>{readMinutes} min</Text>
                            </View>
                            <View style={styles.articleStat}>
                                <Text style={styles.articleStatLabel}>Glossary</Text>
                                <Text style={styles.articleStatValue}>{article.glossary.length}</Text>
                            </View>
                            <View style={styles.articleStat}>
                                <Text style={styles.articleStatLabel}>Quiz</Text>
                                <Text style={styles.articleStatValue}>{article.quizQuestionCount}</Text>
                            </View>
                        </View>
                    </GlassCard>

                    <GlassCard variant="subtle" style={styles.sourceCard}>
                        <Text style={styles.sourceTitle}>Source metadata</Text>
                        {sourceMetadataRows.map((row) => (
                            <MetaRow key={row.label} label={row.label} value={row.value} />
                        ))}
                    </GlassCard>

                    <View style={styles.sectionBlock}>
                        <SectionHeader
                            eyebrow="Reader flow"
                            title="Evidence trail"
                            subtitle={`Published by ${sourceLabel} · ${publishedLabel}`}
                        />
                        {articleSections.length > 0 ? (
                            <View style={styles.articleSections}>
                                {articleSections.map((section) => (
                                    <ArticleSectionBlock key={section.id} section={section} />
                                ))}
                            </View>
                        ) : (
                            <ReaderStateCard
                                title="No article body available"
                                message="The backend returned this article’s metadata, but no body paragraphs were included."
                            />
                        )}
                    </View>

                    {articleGlossary.length > 0 ? (
                        <View style={styles.sectionBlock}>
                            <SectionHeader
                                eyebrow="Glossary"
                                title="Tap a term to unpack it"
                                subtitle="Terms are loaded from the public article detail response."
                            />
                            <View style={styles.glossaryList}>
                                {articleGlossary.map((term) => (
                                    <GlossaryTerm
                                        key={term.id}
                                        term={term}
                                        compact
                                        onPress={handleGlossaryPress}
                                        style={selectedTermId === term.id ? styles.selectedGlossaryCard : undefined}
                                    />
                                ))}
                            </View>
                            {selectedTerm ? (
                                <GlassCard variant="elevated" style={styles.glossaryDetailCard}>
                                    <Pill label="Selected definition" tone="primary" size="sm" />
                                    <Text style={styles.glossaryDetailTitle}>{selectedTerm.term}</Text>
                                    <Text style={styles.glossaryDetailText}>{selectedTerm.definition}</Text>
                                    {selectedTerm.example ? <Text style={styles.glossaryExample}>{selectedTerm.example}</Text> : null}
                                </GlassCard>
                            ) : (
                                <GlassCard variant="subtle" style={styles.tapHintCard}>
                                    <Text style={styles.tapHintText}>Choose a glossary card above to reveal its full definition.</Text>
                                </GlassCard>
                            )}
                        </View>
                    ) : null}

                    {article.limitations.length > 0 ? (
                        <View style={styles.sectionBlock}>
                            <SectionHeader
                                eyebrow="Limitations"
                                title="What to keep in mind"
                                subtitle="Caveats provided by the generated public article detail."
                            />
                            <GlassCard variant="subtle" style={styles.limitationsCard}>
                                {article.limitations.map((limitation, index) => (
                                    <View key={`${article.id}-limitation-${index}`} style={styles.limitationRow}>
                                        <Text style={styles.limitationBullet}>•</Text>
                                        <Text style={styles.limitationText}>{limitation}</Text>
                                    </View>
                                ))}
                            </GlassCard>
                        </View>
                    ) : null}

                    <GlassCard variant="elevated" style={styles.quizEntryCard}>
                        <View style={styles.quizEntryCopy}>
                            <Text style={styles.quizEntryEyebrow}>Ready check</Text>
                            <Text style={styles.quizEntryTitle}>Turn this reading into a comprehension quiz.</Text>
                        </View>
                        <ProgressBar progress={0.82} label="Article completion" showPercent fillColor={accentColor} />
                        <PrimaryButton title="Start comprehension quiz" onPress={startQuiz} rightIcon={<Text style={styles.buttonIcon}>→</Text>} />
                        <PrimaryButton title="Back to Discover" variant="ghost" onPress={() => router.push('/discover')} />
                    </GlassCard>
                </>
            ) : (
                <ReaderStateCard title="No article loaded" message="Open an article from Discover to read its public detail." />
            )}
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
    },
    readerStateCard: {
        gap: spacing.sm,
        borderRadius: radii.lg,
        alignItems: 'flex-start',
    },
    readerErrorCard: {
        borderColor: 'rgba(255,180,171,0.35)',
    },
    readerStateTitle: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    readerErrorTitle: {
        color: colors.error,
    },
    readerStateMessage: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    heroCard: {
        gap: spacing.lg,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    articleIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    articleIconText: {
        fontSize: 34,
    },
    heroPills: {
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    heroCopy: {
        gap: spacing.sm,
    },
    articleTitle: {
        ...typography.sizes.headlineLgMobile,
        color: colors.onSurface,
    },
    articleDek: {
        ...typography.sizes.bodyLg,
        color: colors.secondary,
    },
    articleSummary: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    articleStatsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    articleStat: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.lg,
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: spacing.xs,
    },
    articleStatLabel: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        textTransform: 'uppercase',
    },
    articleStatValue: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    sourceCard: {
        gap: spacing.sm,
    },
    sourceTitle: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    metaLabel: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
    },
    metaValue: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
    },
    sectionBlock: {
        gap: spacing.md,
    },
    articleSections: {
        gap: spacing.md,
    },
    sectionCard: {
        gap: spacing.md,
    },
    sectionTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    sectionTerms: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        flex: 1,
        textAlign: 'right',
    },
    sectionHeading: {
        ...typography.sizes.headlineMd,
    },
    paragraph: {
        ...typography.sizes.bodyMd,
        color: colors.onSurface,
    },
    glossaryList: {
        gap: spacing.md,
    },
    selectedGlossaryCard: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(78,222,163,0.08)',
    },
    glossaryDetailCard: {
        gap: spacing.sm,
        borderColor: 'rgba(78,222,163,0.4)',
    },
    glossaryDetailTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    glossaryDetailText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    glossaryExample: {
        ...typography.sizes.labelMd,
        color: colors.secondary,
        fontWeight: '700',
    },
    tapHintCard: {
        borderStyle: 'dashed',
        gap: spacing.xs,
    },
    tapHintText: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
    },
    limitationsCard: {
        gap: spacing.sm,
        borderRadius: radii.lg,
    },
    limitationRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'flex-start',
    },
    limitationBullet: {
        ...typography.sizes.bodyMd,
        color: colors.secondary,
        fontWeight: '900',
    },
    limitationText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
        flex: 1,
    },
    quizEntryCard: {
        gap: spacing.md,
    },
    quizEntryCopy: {
        gap: spacing.xs,
    },
    quizEntryEyebrow: {
        ...typography.sizes.labelSm,
        color: colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    quizEntryTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    buttonIcon: {
        ...typography.sizes.labelMd,
        color: colors.onPrimary,
        fontWeight: '900',
    },
});

export default ArticleReaderScreen;