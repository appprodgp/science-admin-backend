import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { AppScreen } from '../components/layout/AppScreen';
import { BrandMark } from '../components/ui/BrandMark';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { ProgressBar } from '../components/ui/ProgressBar';

const learningSignals = [
    { label: 'Daily reads', value: '06 min' },
    { label: 'Plain language', value: 'No jargon' },
    { label: 'Quiz XP', value: '+120' },
];

const featureBullets = [
    'Premium science explainers shaped for quick daily learning.',
    'Glossary-first reading that turns hard terms into clear ideas.',
    'Comprehension checks that reward evidence-based understanding.',
];

export function OnboardingScreen() {
    return (
        <AppScreen backgroundVariant="aurora" contentContainerStyle={styles.screenContent}>
            <View style={styles.heroHeader}>
                <BrandMark size="md" />
                <Pill label="Midnight Editorial" tone="primary" icon="✦" />
            </View>

            <View style={styles.heroCopy}>
                <Text style={styles.eyebrow}>Science literacy, one clear idea at a time</Text>
                <Text style={styles.title}>Read the universe without needing a PhD.</Text>
                <Text style={styles.subtitle}>
                    Scilens turns new discoveries into elegant, plain-language lessons with glossary support,
                    quick quizzes, and a calm dark reading experience.
                </Text>
            </View>

            <GlassCard variant="elevated" style={styles.orbitCard}>
                <View style={styles.orbitStage}>
                    <View style={styles.largePlanet}>
                        <Text style={styles.planetIcon}>🪐</Text>
                    </View>
                    <View style={[styles.orbitRing, styles.orbitRingOne]} />
                    <View style={[styles.orbitRing, styles.orbitRingTwo]} />
                    <View style={[styles.spark, styles.sparkOne]} />
                    <View style={[styles.spark, styles.sparkTwo]} />
                    <View style={[styles.spark, styles.sparkThree]} />
                </View>
                <View style={styles.signalRow}>
                    {learningSignals.map((signal) => (
                        <View key={signal.label} style={styles.signalCard}>
                            <Text style={styles.signalValue}>{signal.value}</Text>
                            <Text style={styles.signalLabel}>{signal.label}</Text>
                        </View>
                    ))}
                </View>
            </GlassCard>

            <GlassCard variant="subtle" style={styles.learningCard}>
                <View style={styles.learningHeader}>
                    <Text style={styles.cardTitle}>Today’s learning path</Text>
                    <Text style={styles.cardMeta}>Preview</Text>
                </View>
                <ProgressBar progress={0.34} label="Daily clarity goal" showPercent />
                <View style={styles.bulletList}>
                    {featureBullets.map((feature) => (
                        <View key={feature} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>✦</Text>
                            <Text style={styles.bulletText}>{feature}</Text>
                        </View>
                    ))}
                </View>
            </GlassCard>

            <View style={styles.ctaBlock}>
                <PrimaryButton title="Start learning" onPress={() => router.push('/login')} />
                <Text style={styles.disclaimer}>Static mock onboarding. No account or backend connection yet.</Text>
            </View>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        justifyContent: 'center',
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    heroCopy: {
        gap: spacing.md,
    },
    eyebrow: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    title: {
        ...typography.sizes.displayLg,
        color: colors.onSurface,
    },
    subtitle: {
        ...typography.sizes.bodyLg,
        color: colors.onSurfaceVariant,
    },
    orbitCard: {
        gap: spacing.lg,
    },
    orbitStage: {
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: radii.xl,
        backgroundColor: 'rgba(2,6,23,0.5)',
    },
    largePlanet: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.55)',
        backgroundColor: 'rgba(78,222,163,0.14)',
    },
    planetIcon: {
        fontSize: 62,
    },
    orbitRing: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'rgba(192,193,255,0.36)',
        borderRadius: 999,
        transform: [{ rotate: '-18deg' }],
    },
    orbitRingOne: {
        width: 250,
        height: 86,
    },
    orbitRingTwo: {
        width: 310,
        height: 132,
        borderColor: 'rgba(78,222,163,0.24)',
        transform: [{ rotate: '15deg' }],
    },
    spark: {
        position: 'absolute',
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.primary,
    },
    sparkOne: {
        top: 34,
        right: 76,
    },
    sparkTwo: {
        left: 58,
        bottom: 54,
        backgroundColor: colors.secondary,
    },
    sparkThree: {
        right: 42,
        bottom: 74,
        backgroundColor: colors.electricIndigo,
    },
    signalRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    signalCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.lg,
        padding: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 2,
    },
    signalValue: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '800',
    },
    signalLabel: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
    },
    learningCard: {
        gap: spacing.md,
    },
    learningHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md,
    },
    cardTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    cardMeta: {
        ...typography.sizes.labelSm,
        color: colors.secondary,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    bulletList: {
        gap: spacing.sm,
    },
    bulletRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    bulletDot: {
        color: colors.primary,
        fontSize: 14,
        lineHeight: 22,
    },
    bulletText: {
        ...typography.sizes.bodyMd,
        flex: 1,
        color: colors.onSurfaceVariant,
    },
    ctaBlock: {
        gap: spacing.sm,
    },
    disclaimer: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        textAlign: 'center',
    },
});

export default OnboardingScreen;