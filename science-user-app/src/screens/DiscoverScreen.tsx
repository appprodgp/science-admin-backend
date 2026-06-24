import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { ArticleCard } from '../components/article/ArticleCard';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { MetricCard } from '../components/ui/MetricCard';
import { Pill } from '../components/ui/Pill';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { articleList, featuredArticle, streakMetrics } from '../data/mockContent';
import type { ScienceArticle } from '../types/content';

const secondaryArticles = articleList.filter((article) => article.id !== featuredArticle.id);

function openArticle(article: ScienceArticle) {
    router.push({ pathname: '/article/[id]', params: { id: article.id } });
}

export function DiscoverScreen() {
    const currentStreak = streakMetrics[0];
    const quizAccuracy = streakMetrics[1];

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
                    <Pill label="6 min read" tone="neutral" size="sm" />
                    <Pill label="2 glossary terms" tone="secondary" size="sm" />
                    <Pill label="No backend" tone="neutral" size="sm" />
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
                    subtitle="A premium mock article card powered by local data."
                />
                <ArticleCard article={featuredArticle} variant="featured" onPress={openArticle} />
            </View>

            <View style={styles.sectionBlock}>
                <SectionHeader title="More to explore" subtitle="Static mock content for the Discover route." />
                <View style={styles.articleList}>
                    {secondaryArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} onPress={openArticle} />
                    ))}
                </View>
            </View>

            <GlassCard variant="subtle" style={styles.noteCard}>
                <Text style={styles.noteTitle}>Static feed only</Text>
                <Text style={styles.noteText}>
                    Article cards navigate to the existing article route shell. Full reader, quiz, streaks,
                    achievements, and level-up screens are intentionally untouched in Step 2B.
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