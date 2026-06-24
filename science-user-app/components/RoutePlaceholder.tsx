import { Link } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows, spacing, typography } from '../theme';

type LinkHref = ComponentProps<typeof Link>['href'];

type NavTarget = {
    label: string;
    href: LinkHref;
};

type RoutePlaceholderProps = {
    eyebrow: string;
    title: string;
    stitchSource: string;
    description: string;
    nextSteps?: string[];
    links?: NavTarget[];
};

export function RoutePlaceholder({
    eyebrow,
    title,
    stitchSource,
    description,
    nextSteps = [],
    links = [],
}: RoutePlaceholderProps) {
    return (
        <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
            <View style={styles.card}>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>

                <View style={styles.sourcePill}>
                    <Text style={styles.sourceText}>Stitch reference: {stitchSource}</Text>
                </View>

                {nextSteps.length > 0 ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Step 2 mock UI target</Text>
                        {nextSteps.map((item) => (
                            <Text key={item} style={styles.bullet}>
                                • {item}
                            </Text>
                        ))}
                    </View>
                ) : null}

                {links.length > 0 ? (
                    <View style={styles.linkList}>
                        {links.map((link) => (
                            <Link key={link.label} href={link.href} asChild>
                                <Pressable style={styles.linkButton}>
                                    <Text style={styles.linkButtonText}>{link.label}</Text>
                                </Pressable>
                            </Link>
                        ))}
                    </View>
                ) : null}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    card: {
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.xl,
        backgroundColor: colors.surfaceContainerLow,
        padding: spacing.lg,
        ...shadows.glassPanel,
    },
    eyebrow: {
        color: colors.primary,
        fontSize: typography.sizes.labelSm.fontSize,
        lineHeight: typography.sizes.labelSm.lineHeight,
        fontWeight: '700',
        letterSpacing: typography.sizes.labelSm.letterSpacing,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
    },
    title: {
        color: colors.onSurface,
        fontSize: typography.sizes.headlineLgMobile.fontSize,
        lineHeight: typography.sizes.headlineLgMobile.lineHeight,
        fontWeight: '700',
        marginBottom: spacing.md,
    },
    description: {
        color: colors.onSurfaceVariant,
        fontSize: typography.sizes.bodyMd.fontSize,
        lineHeight: typography.sizes.bodyMd.lineHeight,
    },
    sourcePill: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: radii.full,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surfaceContainer,
    },
    sourceText: {
        color: colors.secondary,
        fontSize: typography.sizes.labelSm.fontSize,
        lineHeight: typography.sizes.labelSm.lineHeight,
        fontWeight: '600',
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        color: colors.onSurface,
        fontSize: typography.sizes.labelMd.fontSize,
        lineHeight: typography.sizes.labelMd.lineHeight,
        fontWeight: '700',
        marginBottom: spacing.sm,
    },
    bullet: {
        color: colors.onSurfaceVariant,
        fontSize: typography.sizes.bodyMd.fontSize,
        lineHeight: typography.sizes.bodyMd.lineHeight,
    },
    linkList: {
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    linkButton: {
        alignItems: 'center',
        borderRadius: radii.md,
        backgroundColor: colors.primaryContainer,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    linkButtonText: {
        color: colors.obsidian,
        fontSize: typography.sizes.labelMd.fontSize,
        lineHeight: typography.sizes.labelMd.lineHeight,
        fontWeight: '700',
    },
});