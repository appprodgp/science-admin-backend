import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { achievementCards } from '../data/mockContent';
import type { AchievementCardData, AchievementTier } from '../types/content';

type PillTone = 'primary' | 'secondary' | 'neutral' | 'danger';

function formatTier(tier: AchievementTier) {
    return `${tier.charAt(0).toUpperCase()}${tier.slice(1)}`;
}

function getTierTone(achievement: AchievementCardData): PillTone {
    if (achievement.isUnlocked) {
        return 'primary';
    }

    if (achievement.tier === 'gold' || achievement.tier === 'cosmic') {
        return 'secondary';
    }

    return 'neutral';
}

function AchievementCard({ achievement }: { achievement: AchievementCardData }) {
    const progress = achievement.goal > 0 ? achievement.progress / achievement.goal : 0;

    return (
        <GlassCard
            variant={achievement.isUnlocked ? 'elevated' : 'subtle'}
            style={[styles.achievementCard, achievement.isUnlocked ? styles.unlockedCard : styles.lockedCard]}>
            <View style={styles.achievementHeader}>
                <View
                    style={[
                        styles.achievementIconBubble,
                        { borderColor: `${achievement.accentColor}66`, backgroundColor: `${achievement.accentColor}18` },
                    ]}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementHeaderCopy}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                </View>
                <Pill label={achievement.isUnlocked ? 'Unlocked' : 'Locked'} tone={achievement.isUnlocked ? 'primary' : 'neutral'} size="sm" />
            </View>

            <View style={styles.achievementMetaRow}>
                <Pill label={`${formatTier(achievement.tier)} tier`} tone={getTierTone(achievement)} icon="✦" size="sm" />
                <Text style={styles.achievementProgressText}>
                    {achievement.progress}/{achievement.goal}
                </Text>
            </View>
            <ProgressBar progress={progress} fillColor={achievement.accentColor} showPercent />
        </GlassCard>
    );
}

export function AchievementsScreen() {
    const unlockedCount = achievementCards.filter((achievement) => achievement.isUnlocked).length;
    const totalGoal = achievementCards.reduce((sum, achievement) => sum + achievement.goal, 0);
    const totalProgress = achievementCards.reduce((sum, achievement) => sum + achievement.progress, 0);
    const overallProgress = totalGoal > 0 ? totalProgress / totalGoal : 0;

    return (
        <AppScreen backgroundVariant="quiet" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Rewards"
                title="Achievements, framed in midnight glass."
                subtitle="Static badge states using local mock data only."
                rightAccessory={<Pill label="/achievements" tone="neutral" size="sm" />}
            />

            <GlassCard variant="elevated" style={styles.summaryCard}>
                <View style={styles.summaryTopRow}>
                    <View style={styles.summaryCopy}>
                        <Pill label="Badge shelf" tone="secondary" icon="🏆" size="sm" />
                        <Text style={styles.summaryTitle}>{unlockedCount} unlocked so far</Text>
                        <Text style={styles.summaryText}>
                            Keep reading and answering checks to complete the remaining mock achievements.
                        </Text>
                    </View>
                    <View style={styles.summaryOrb}>
                        <Text style={styles.summaryOrbValue}>{achievementCards.length}</Text>
                        <Text style={styles.summaryOrbLabel}>badges</Text>
                    </View>
                </View>
                <ProgressBar progress={overallProgress} label="Overall achievement progress" showPercent fillColor={colors.secondary} />
            </GlassCard>

            <View style={styles.sectionBlock}>
                <SectionHeader
                    eyebrow="Collection"
                    title="Science literacy badges"
                    subtitle="Unlocked and locked states are static until backend profiles are approved."
                />
                <View style={styles.achievementList}>
                    {achievementCards.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                </View>
            </View>

            <GlassCard variant="subtle" style={styles.noteCard}>
                <Text style={styles.noteTitle}>No profile persistence yet</Text>
                <Text style={styles.noteText}>
                    These cards do not read from authentication, user profiles, or API endpoints. They are ready for wiring once the backend contract is defined.
                </Text>
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
    },
    summaryCard: {
        gap: spacing.lg,
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    summaryCopy: {
        flex: 1,
        gap: spacing.sm,
    },
    summaryTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    summaryText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    summaryOrb: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(192,193,255,0.42)',
        backgroundColor: 'rgba(192,193,255,0.12)',
    },
    summaryOrbValue: {
        ...typography.sizes.headlineLg,
        color: colors.secondary,
    },
    summaryOrbLabel: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    sectionBlock: {
        gap: spacing.md,
    },
    achievementList: {
        gap: spacing.md,
    },
    achievementCard: {
        gap: spacing.md,
    },
    unlockedCard: {
        borderColor: 'rgba(78,222,163,0.34)',
    },
    lockedCard: {
        opacity: 0.88,
    },
    achievementHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
    },
    achievementIconBubble: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementIcon: {
        fontSize: 26,
    },
    achievementHeaderCopy: {
        flex: 1,
        gap: spacing.xs,
    },
    achievementTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    achievementDescription: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
    },
    achievementMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    achievementProgressText: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
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

export default AchievementsScreen;