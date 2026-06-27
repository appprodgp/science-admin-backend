import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { AppScreen } from '../components/layout/AppScreen';
import { BrandMark } from '../components/ui/BrandMark';
import { GlassCard } from '../components/ui/GlassCard';
import { Pill } from '../components/ui/Pill';
import { PrimaryButton } from '../components/ui/PrimaryButton';

export function LoginScreen() {
    return (
        <AppScreen backgroundVariant="quiet" contentContainerStyle={styles.screenContent}>
            <View style={styles.header}>
                <BrandMark size="lg" />
                <View style={styles.headerCopy}>
                    <Text style={styles.eyebrow}>Welcome back</Text>
                    <Text style={styles.title}>Sign in to continue your daily science streak.</Text>
                    <Text style={styles.subtitle}>This is a static mock login. The submit action skips auth and opens Discover.</Text>
                </View>
            </View>

            <GlassCard variant="elevated" style={styles.formCard}>
                <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>Reader access</Text>
                    <Pill label="Mock" tone="secondary" size="sm" />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <TextInput
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="reader@scilens.app"
                        placeholderTextColor={colors.onSurfaceVariant}
                        style={styles.input}
                    />
                </View>

                <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={colors.onSurfaceVariant}
                        secureTextEntry
                        style={styles.input}
                    />
                </View>

                <PrimaryButton title="Continue to Discover" onPress={() => router.replace('/discover')} />

                <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>or preview</Text>
                    <View style={styles.divider} />
                </View>

                <PrimaryButton title="Use demo reader" variant="ghost" onPress={() => router.replace('/discover')} />
            </GlassCard>

            <GlassCard variant="subtle" style={styles.trustCard}>
                <Text style={styles.trustTitle}>No backend connected yet</Text>
                <Text style={styles.trustText}>
                    Authentication, subscriptions, and profile persistence will be wired in a later step. For now,
                    this screen demonstrates layout, states, and navigation only.
                </Text>
            </GlassCard>
        </AppScreen>
    );
}

const styles = StyleSheet.create({
    screenContent: {
        justifyContent: 'center',
    },
    header: {
        gap: spacing.lg,
    },
    headerCopy: {
        gap: spacing.sm,
    },
    eyebrow: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    title: {
        ...typography.sizes.headlineLgMobile,
        color: colors.onSurface,
    },
    subtitle: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    formCard: {
        gap: spacing.md,
    },
    formHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.md,
    },
    formTitle: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    fieldGroup: {
        gap: spacing.xs,
    },
    fieldLabel: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '700',
    },
    input: {
        minHeight: 54,
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.lg,
        paddingHorizontal: spacing.md,
        color: colors.onSurface,
        backgroundColor: 'rgba(255,255,255,0.06)',
        ...typography.sizes.bodyMd,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.glassStroke,
    },
    dividerText: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        textTransform: 'uppercase',
    },
    trustCard: {
        gap: spacing.xs,
        borderRadius: radii.lg,
    },
    trustTitle: {
        ...typography.sizes.labelMd,
        color: colors.secondary,
        fontWeight: '800',
    },
    trustText: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
    },
});

export default LoginScreen;