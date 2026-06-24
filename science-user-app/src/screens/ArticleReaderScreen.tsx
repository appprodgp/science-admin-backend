import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { GlossaryTerm } from '../components/article/GlossaryTerm';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { articleList, featuredArticle, glossaryTerms } from '../data/mockContent';
import type { ArticleSection, ArticleSectionKind, GlossaryTermData, ReadingLevel } from '../types/content';

type RouteParams = {
    id?: string | string[];
};

type SectionMeta = {
    label: string;
    icon: string;
    borderColor: string;
    backgroundColor: string;
    titleColor: string;
};

const sectionMeta: Record<ArticleSectionKind, SectionMeta> = {
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

function resolveArticle(articleId?: string) {
    return articleList.find((article) => article.id === articleId || article.slug === articleId) ?? featuredArticle;
}

function formatReadingLevel(level: ReadingLevel) {
    return `${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{label}</Text>
            <Text style={styles.metaValue}>{value}</Text>
        </View>
    );
}

function ArticleSectionBlock({ section }: { section: ArticleSection }) {
    const meta = sectionMeta[section.kind];
    const linkedTerms = glossaryTerms.filter((term) => section.glossaryTermIds?.includes(term.id));

    return (
        <GlassCard
            variant={section.kind === 'body' ? 'default' : 'subtle'}
            style={[styles.sectionCard, { borderColor: meta.borderColor, backgroundColor: meta.backgroundColor }]}>
            <View style={styles.sectionTopRow}>
                <Pill label={meta.label} icon={meta.icon} tone={section.kind === 'body' ? 'neutral' : 'secondary'} size="sm" />
                {linkedTerms.length > 0 ? <Text style={styles.sectionTerms}>{linkedTerms.map((term) => term.term).join(' · ')}</Text> : null}
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
    const article = useMemo(() => resolveArticle(articleId), [articleId]);
    const articleGlossary = useMemo(
        () => glossaryTerms.filter((term) => article.glossaryTermIds.includes(term.id)),
        [article.glossaryTermIds],
    );
    const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
    const selectedTerm = articleGlossary.find((term) => term.id === selectedTermId);

    function handleGlossaryPress(term: GlossaryTermData) {
        setSelectedTermId((currentTermId) => (currentTermId === term.id ? null : term.id));
    }

    function startQuiz() {
        router.push({ pathname: '/article/[id]/quiz', params: { id: article.id } });
    }

    return (
        <AppScreen backgroundVariant="aurora" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Article reader"
                title="Read, decode, then quiz."
                subtitle="A static Midnight Editorial reader powered by local mock content only."
                rightAccessory={<Pill label={`${article.readMinutes} min`} tone="primary" icon="⏱️" size="sm" />}
            />

            <GlassCard variant="elevated" style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <View style={[styles.articleIcon, { borderColor: `${article.accentColor}66`, backgroundColor: `${article.accentColor}18` }]}>
                        <Text style={styles.articleIconText}>{article.icon}</Text>
                    </View>
                    <View style={styles.heroPills}>
                        <Pill label={article.category} tone="primary" size="sm" />
                        <Pill label={formatReadingLevel(article.readingLevel)} tone="secondary" size="sm" />
                    </View>
                </View>

                <View style={styles.heroCopy}>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleDek}>{article.dek}</Text>
                    <Text style={styles.articleSummary}>{article.summary}</Text>
                </View>

                <View style={styles.tagRow}>
                    {article.tags.map((tag) => (
                        <Pill key={tag} label={tag} tone="neutral" size="sm" />
                    ))}
                </View>

                <View style={styles.articleStatsGrid}>
                    {article.stats.map((stat) => (
                        <View key={stat.label} style={styles.articleStat}>
                            <Text style={styles.articleStatLabel}>{stat.label}</Text>
                            <Text style={styles.articleStatValue}>{stat.value}</Text>
                        </View>
                    ))}
                </View>
            </GlassCard>

            <GlassCard variant="subtle" style={styles.sourceCard}>
                <Text style={styles.sourceTitle}>Source metadata</Text>
                <MetaRow label="Source" value={article.sourceLabel} />
                <MetaRow label="Author" value={article.author} />
                <MetaRow label="Published" value={article.publishedLabel} />
            </GlassCard>

            <View style={styles.sectionBlock}>
                <SectionHeader
                    eyebrow="Reader flow"
                    title="Evidence trail"
                    subtitle="Sections are native Text and View surfaces; no imported Stitch HTML or scripts."
                />
                <View style={styles.articleSections}>
                    {article.sections.map((section) => (
                        <ArticleSectionBlock key={section.id} section={section} />
                    ))}
                </View>
            </View>

            <View style={styles.sectionBlock}>
                <SectionHeader
                    eyebrow="Glossary"
                    title="Tap a term to unpack it"
                    subtitle="This interaction is local React state and stays fully offline."
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
                        {selectedTerm.example ? <Text style={styles.glossaryExample}>Example: {selectedTerm.example}</Text> : null}
                    </GlassCard>
                ) : (
                    <GlassCard variant="subtle" style={styles.tapHintCard}>
                        <Text style={styles.tapHintText}>Choose a glossary card above to reveal its full definition and example.</Text>
                    </GlassCard>
                )}
            </View>

            <GlassCard variant="elevated" style={styles.quizEntryCard}>
                <View style={styles.quizEntryCopy}>
                    <Text style={styles.quizEntryEyebrow}>Ready check</Text>
                    <Text style={styles.quizEntryTitle}>Turn this reading into comprehension XP.</Text>
                </View>
                <ProgressBar progress={0.82} label="Article completion" showPercent fillColor={article.accentColor} />
                <PrimaryButton title="Start comprehension quiz" onPress={startQuiz} rightIcon={<Text style={styles.buttonIcon}>→</Text>} />
                <PrimaryButton title="Back to Discover" variant="ghost" onPress={() => router.push('/discover')} />
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
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