import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../../../theme';
import type { ScienceArticle } from '../../types/content';
import { GlassCard } from '../ui/GlassCard';
import { Pill } from '../ui/Pill';

type ArticleCardVariant = 'featured' | 'compact';

type ArticleCardProps = {
    article: ScienceArticle;
    variant?: ArticleCardVariant;
    onPress?: (article: ScienceArticle) => void;
    style?: StyleProp<ViewStyle>;
};

export function ArticleCard({ article, variant = 'compact', onPress, style }: ArticleCardProps) {
    const isFeatured = variant === 'featured';

    return (
        <GlassCard
            variant={isFeatured ? 'elevated' : 'default'}
            onPress={onPress ? () => onPress(article) : undefined}
            accessibilityLabel={`Read ${article.title}`}
            style={[styles.card, isFeatured ? styles.featuredCard : null, style]}>
            <View style={styles.topRow}>
                <View style={[styles.illustration, isFeatured ? styles.featuredIllustration : null, { borderColor: article.accentColor }]}>
                    <View style={[styles.illustrationGlow, { backgroundColor: article.accentColor }]} />
                    <Text style={isFeatured ? styles.featuredIcon : styles.icon}>{article.icon}</Text>
                </View>
                <View style={styles.metaColumn}>
                    <Pill label={article.category} tone={isFeatured ? 'primary' : 'neutral'} size="sm" />
                    <Text style={styles.metaText}>
                        {article.readMinutes} min • {article.readingLevel}
                    </Text>
                </View>
            </View>

            <View style={styles.copy}>
                <Text style={isFeatured ? styles.featuredTitle : styles.title}>{article.title}</Text>
                <Text style={styles.dek}>{article.dek}</Text>
                {isFeatured ? <Text style={styles.summary}>{article.summary}</Text> : null}
            </View>

            <View style={styles.tagRow}>
                {article.tags.slice(0, isFeatured ? 3 : 2).map((tag) => (
                    <Pill key={tag} label={tag} tone="secondary" size="sm" />
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{article.publishedLabel}</Text>
                <Text style={styles.footerText}>{article.sourceLabel}</Text>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.md,
    },
    featuredCard: {
        padding: spacing.lg,
    },
    topRow: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },
    illustration: {
        width: 64,
        height: 64,
        borderRadius: radii.lg,
        borderWidth: 1,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceContainerLow,
    },
    featuredIllustration: {
        width: 88,
        height: 88,
        borderRadius: radii.xl,
    },
    illustrationGlow: {
        position: 'absolute',
        width: '120%',
        height: '120%',
        opacity: 0.18,
        borderRadius: radii.full,
    },
    icon: {
        fontSize: 30,
    },
    featuredIcon: {
        fontSize: 42,
    },
    metaColumn: {
        flex: 1,
        gap: spacing.sm,
    },
    metaText: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
        textTransform: 'capitalize',
    },
    copy: {
        gap: spacing.sm,
    },
    title: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    featuredTitle: {
        ...typography.sizes.headlineLgMobile,
        color: colors.onSurface,
    },
    dek: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    summary: {
        ...typography.sizes.bodyMd,
        color: colors.onSurface,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.glassStroke,
    },
    footerText: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
    },
});

export default ArticleCard;