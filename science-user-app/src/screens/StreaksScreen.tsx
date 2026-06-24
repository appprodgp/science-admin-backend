import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { MetricCard } from '../components/ui/MetricCard';
import { Pill } from '../components/ui/Pill';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { streakMetrics } from '../data/mockContent';

const weekDays = [
    { day: 'Mon', minutes: '8m', state: 'complete' },
    { day: 'Tue', minutes: '5m', state: 'complete' },
    { day: 'Wed', minutes: '9m', state: 'complete' },
    { day: 'Thu', minutes: '6m', state: 'complete' },
    { day: 'Fri', minutes: 'Today', state: 'today' },
    { day: 'Sat', minutes: 'Plan', state: 'upcoming' },
    { day: 'Sun', minutes: 'Plan', state: 'upcoming' },
] as const;

export function StreaksScreen() {
    const currentStreak = streakMetrics[0];
    const quizAccuracy = streakMetrics[1];
    const readingMinutes = streakMetrics[2];

    return (
        <AppScreen backgroundVariant="quiet" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Reading habit"
                title="Your science streak is alive."
                subtitle="Static mock streak data for the user-facing app; no account state or backend calls yet."
                rightAccessory={<Pill label="/streaks" tone="neutral" size="sm" />}
            />

            <GlassCard variant="elevated" style={styles.heroCard}>
                <View style={styles.streakHeroRow}>
                    <View style={styles.streakOrb}>
                        <Text style={styles.streakValue}>{currentStreak.value}</Text>
                        <Text style={styles.streakUnit}>{currentStreak.unit}</Text>
                    </View>
                    <View style={styles.streakHeroCopy}>
                        <Pill label={currentStreak.delta ?? 'active'} tone="primary" icon={currentStreak.icon} size="sm" />
                        <Text style={styles.heroTitle}>One clear science read keeps the chain glowing.</Text>
                        <Text style={styles.heroText}>{currentStreak.description}</Text>
                    </View>
                </View>
                <ProgressBar
                    progress={currentStreak.progress ?? 0}
                    label="Monthly streak shield"
                    showPercent
                    fillColor={currentStreak.accentColor}
                />
            </GlassCard>

            <View style={styles.metricsGrid}>
                {streakMetrics.map((metric) => (
                    <MetricCard
                        key={metric.id}
                        label={metric.label}
                        value={metric.value}
                        unit={metric.unit}
                        detail={metric.description}
                        delta={metric.delta}
                        icon={metric.icon}
                        progress={metric.progress}
                        accentColor={metric.accentColor}
                        style={styles.metricItem}
                    />
                ))}
            </View>

            <View style={styles.sectionBlock}>
                <SectionHeader
                    eyebrow="This week"
                    title="Habit constellation"
                    subtitle="A native weekly chain, recreated without charts or browser scripts."
                />
                <GlassCard variant="subtle" style={styles.weekCard}>
                    <View style={styles.weekRow}>
                        {weekDays.map((day) => {
                            const isComplete = day.state === 'complete';
                            const isToday = day.state === 'today';

                            return (
                                <View key={day.day} style={styles.dayColumn}>
                                    <View
                                        style={[
                                            styles.dayDot,
                                            isComplete ? styles.dayDotComplete : null,
                                            isToday ? styles.dayDotToday : null,
                                        ]}>
                                        <Text style={[styles.dayDotText, isComplete || isToday ? styles.dayDotTextActive : null]}>
                                            {isComplete ? '✓' : isToday ? '•' : '○'}
                                        </Text>
                                    </View>
                                    <Text style={styles.dayLabel}>{day.day}</Text>
                                    <Text style={styles.dayMinutes}>{day.minutes}</Text>
                                </View>
                            );
                        })}
                    </View>
                </GlassCard>
            </View>

            <GlassCard variant="elevated" style={styles.coachCard}>
                <Pill label="Midnight coach" tone="secondary" icon="☾" size="sm" />
                <Text style={styles.coachTitle}>Suggested next session</Text>
                <Text style={styles.coachText}>
                    Read one 6-minute astronomy article, tap both glossary terms, then finish the two-question comprehension check.
                </Text>
                <View style={styles.coachStatsRow}>
                    <View style={styles.coachStat}>
                        <Text style={styles.coachStatValue}>{quizAccuracy.value}{quizAccuracy.unit}</Text>
                        <Text style={styles.coachStatLabel}>quiz confidence</Text>
                    </View>
                    <View style={styles.coachStat}>
                        <Text style={styles.coachStatValue}>{readingMinutes.value}{readingMinutes.unit}</Text>
                        <Text style={styles.coachStatLabel}>this week</Text>
                    </View>
                </View>
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
    streakHeroRow: {
        flexDirection: 'row',
        gap: spacing.lg,
        alignItems: 'center',
    },
    streakOrb: {
        width: 122,
        height: 122,
        borderRadius: 61,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.42)',
        backgroundColor: 'rgba(78,222,163,0.12)',
    },
    streakValue: {
        ...typography.sizes.displayLg,
        color: colors.primary,
        lineHeight: 52,
    },
    streakUnit: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    streakHeroCopy: {
        flex: 1,
        gap: spacing.sm,
    },
    heroTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    heroText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    metricsGrid: {
        gap: spacing.md,
    },
    metricItem: {
        width: '100%',
    },
    sectionBlock: {
        gap: spacing.md,
    },
    weekCard: {
        gap: spacing.md,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    dayColumn: {
        flex: 1,
        alignItems: 'center',
        gap: spacing.xs,
    },
    dayDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.glassStroke,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    dayDotComplete: {
        borderColor: 'rgba(78,222,163,0.58)',
        backgroundColor: 'rgba(78,222,163,0.16)',
    },
    dayDotToday: {
        borderColor: 'rgba(192,193,255,0.64)',
        backgroundColor: 'rgba(192,193,255,0.14)',
    },
    dayDotText: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
        fontWeight: '900',
    },
    dayDotTextActive: {
        color: colors.primary,
    },
    dayLabel: {
        ...typography.sizes.labelSm,
        color: colors.onSurface,
        fontWeight: '800',
    },
    dayMinutes: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        textAlign: 'center',
    },
    coachCard: {
        gap: spacing.md,
    },
    coachTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    coachText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    coachStatsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    coachStat: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.lg,
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: spacing.xs,
    },
    coachStatValue: {
        ...typography.sizes.headlineMd,
        color: colors.primary,
    },
    coachStatLabel: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        fontWeight: '700',
    },
});

export default StreaksScreen;