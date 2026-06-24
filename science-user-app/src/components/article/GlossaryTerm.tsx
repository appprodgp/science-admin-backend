import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../../../theme';
import type { GlossaryTermData } from '../../types/content';
import { GlassCard } from '../ui/GlassCard';
import { Pill } from '../ui/Pill';

type GlossaryTermProps = {
    term: GlossaryTermData;
    compact?: boolean;
    onPress?: (term: GlossaryTermData) => void;
    style?: StyleProp<ViewStyle>;
};

export function GlossaryTerm({ term, compact = false, onPress, style }: GlossaryTermProps) {
    return (
        <GlassCard
            variant="subtle"
            onPress={onPress ? () => onPress(term) : undefined}
            accessibilityLabel={`Glossary term ${term.term}`}
            style={[styles.card, style]}>
            <View style={styles.header}>
                <View style={styles.termGroup}>
                    <Text style={styles.term}>{term.term}</Text>
                    {term.pronunciation ? <Text style={styles.pronunciation}>{term.pronunciation}</Text> : null}
                </View>
                <Pill label="Glossary" tone="primary" size="sm" />
            </View>
            <Text style={styles.plainLanguage}>{term.plainLanguage}</Text>
            {compact ? null : <Text style={styles.definition}>{term.definition}</Text>}
            {!compact && term.example ? <Text style={styles.example}>Example: {term.example}</Text> : null}
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    termGroup: {
        flex: 1,
        gap: 2,
    },
    term: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    pronunciation: {
        ...typography.sizes.labelSm,
        color: colors.secondary,
    },
    plainLanguage: {
        ...typography.sizes.bodyMd,
        color: colors.primary,
        fontWeight: '700',
    },
    definition: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    example: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
    },
});

export default GlossaryTerm;