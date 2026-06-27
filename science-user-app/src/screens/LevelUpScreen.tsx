import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { AppScreen } from '../components/layout/AppScreen';
import { FloatingHeader } from '../components/layout/FloatingHeader';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { levelUpRewardData } from '../data/mockContent';

export function LevelUpScreen() {
    const reward = levelUpRewardData;

    return (
        <AppScreen backgroundVariant="aurora" contentContainerStyle={styles.screenContent}>
            <FloatingHeader
                eyebrow="Progress milestone"
                title="You leveled up."
                subtitle="A celebratory static mock screen for the post-quiz flow."
                rightAccessory={<Pill label={`+${reward.xpAwarded} XP`} tone="primary" icon="✦" size="sm" />}
            />

            <GlassCard variant="elevated" style={styles.levelCard}>
                <View style={styles.orbitStage}>
                    <View style={styles.outerOrbit}>
                        <View style={styles.middleOrbit}>
                            <View style={styles.levelOrb}>
                                <Text style={styles.levelNumber}>{reward.levelNumber}</Text>
                                <Text style={styles.levelLabel}>LEVEL</Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.sparkOne} />
                    <View style={styles.sparkTwo} />
                    <View style={styles.sparkThree} />
                </View>

                <View style={styles.levelCopy}>
                    <Pill label="New rank unlocked" tone="secondary" icon="✨" size="sm" />
                    <Text style={styles.levelTitle}>{reward.levelTitle}</Text>
                    <Text style={styles.levelMessage}>{reward.message}</Text>
                </View>

                <View style={styles.levelPathCard}>
                    <Text style={styles.levelPathLabel}>{reward.previousLevel}</Text>
                    <ProgressBar progress={0.72} fillColor={colors.primary} />
                    <Text style={styles.levelPathLabel}>{reward.nextLevel}</Text>
                </View>
            </GlassCard>

            <View style={styles.sectionBlock}>
                <SectionHeader
                    eyebrow="Unlocked"
                    title="Reward bundle"
                    subtitle="Static reward copy from local mock data."
                />
                <View style={styles.rewardList}>
                    {reward.unlockedRewards.map((item, index) => (
                        <GlassCard key={item} variant="subtle" style={styles.rewardCard}>
                            <View style={styles.rewardIndexBubble}>
                                <Text style={styles.rewardIndex}>{index + 1}</Text>
                            </View>
                            <View style={styles.rewardCopy}>
                                <Text style={styles.rewardTitle}>{item}</Text>
                                <Text style={styles.rewardDescription}>Available in this static mock milestone state.</Text>
                            </View>
                        </GlassCard>
                    ))}
                </View>
            </View>

            <GlassCard variant="elevated" style={styles.ctaCard}>
                <Text style={styles.ctaTitle}>Keep the midnight streak moving.</Text>
                <Text style={styles.ctaText}>Return to Discover to continue with more mock science stories.</Text>
                <PrimaryButton title={reward.primaryActionLabel} onPress={() => router.replace('/discover')} />
                <View style={styles.secondaryActions}>
                    <PrimaryButton title="View streaks" variant="ghost" onPress={() => router.push('/streaks')} style={styles.secondaryButton} />
                    <PrimaryButton
                        title="Achievements"
                        variant="ghost"
                        onPress={() => router.push('/achievements')}
                        style={styles.secondaryButton}
                    />
                </View>
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        paddingBottom: 112,
    },
    levelCard: {
        gap: spacing.lg,
        overflow: 'hidden',
    },
    orbitStage: {
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerOrbit: {
        width: 196,
        height: 196,
        borderRadius: 98,
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(78,222,163,0.04)',
    },
    middleOrbit: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 1,
        borderColor: 'rgba(192,193,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(192,193,255,0.07)',
    },
    levelOrb: {
        width: 108,
        height: 108,
        borderRadius: 54,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.48)',
        backgroundColor: colors.primary,
    },
    levelNumber: {
        ...typography.sizes.displayLg,
        color: colors.onPrimary,
        lineHeight: 52,
    },
    levelLabel: {
        ...typography.sizes.labelSm,
        color: colors.onPrimary,
        fontWeight: '900',
    },
    sparkOne: {
        position: 'absolute',
        top: 34,
        right: 68,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.secondary,
    },
    sparkTwo: {
        position: 'absolute',
        bottom: 46,
        left: 60,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    sparkThree: {
        position: 'absolute',
        top: 72,
        left: 34,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.electricIndigo,
    },
    levelCopy: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    levelTitle: {
        ...typography.sizes.headlineLgMobile,
        color: colors.onSurface,
        textAlign: 'center',
    },
    levelMessage: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
        textAlign: 'center',
    },
    levelPathCard: {
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.lg,
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: spacing.sm,
    },
    levelPathLabel: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
        fontWeight: '700',
    },
    sectionBlock: {
        gap: spacing.md,
    },
    rewardList: {
        gap: spacing.md,
    },
    rewardCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    rewardIndexBubble: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.42)',
        backgroundColor: 'rgba(78,222,163,0.12)',
    },
    rewardIndex: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '900',
    },
    rewardCopy: {
        flex: 1,
        gap: spacing.xs,
    },
    rewardTitle: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    rewardDescription: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
    },
    ctaCard: {
        gap: spacing.md,
    },
    ctaTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    ctaText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    secondaryButton: {
        flex: 1,
    },
});

export default LevelUpScreen;