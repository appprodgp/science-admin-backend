import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../../../theme';
import type { QuizOption } from '../../types/content';
import { GlassCard } from '../ui/GlassCard';

type QuizOptionCardProps = {
    option: QuizOption;
    selected?: boolean;
    revealed?: boolean;
    disabled?: boolean;
    onPress?: (option: QuizOption) => void;
    style?: StyleProp<ViewStyle>;
};

type OptionState = 'neutral' | 'selected' | 'correct' | 'incorrect';

function getOptionState(option: QuizOption, selected: boolean, revealed: boolean): OptionState {
    if (!revealed) {
        return selected ? 'selected' : 'neutral';
    }

    if (option.isCorrect) {
        return 'correct';
    }

    return selected ? 'incorrect' : 'neutral';
}

const stateStyles: Record<OptionState, { borderColor: string; badgeBackground: string; badgeText: string; feedbackColor: string }> = {
    neutral: {
        borderColor: colors.glassStroke,
        badgeBackground: 'rgba(255,255,255,0.08)',
        badgeText: colors.onSurfaceVariant,
        feedbackColor: colors.onSurfaceVariant,
    },
    selected: {
        borderColor: colors.secondary,
        badgeBackground: 'rgba(192,193,255,0.18)',
        badgeText: colors.secondary,
        feedbackColor: colors.secondary,
    },
    correct: {
        borderColor: colors.primary,
        badgeBackground: 'rgba(78,222,163,0.18)',
        badgeText: colors.primary,
        feedbackColor: colors.primary,
    },
    incorrect: {
        borderColor: colors.error,
        badgeBackground: 'rgba(255,180,171,0.18)',
        badgeText: colors.error,
        feedbackColor: colors.error,
    },
};

export function QuizOptionCard({
    option,
    selected = false,
    revealed = false,
    disabled = false,
    onPress,
    style,
}: QuizOptionCardProps) {
    const optionState = getOptionState(option, selected, revealed);
    const stateStyle = stateStyles[optionState];

    return (
        <GlassCard
            variant="subtle"
            disabled={disabled}
            onPress={onPress ? () => onPress(option) : undefined}
            accessibilityLabel={`Quiz option ${option.label}: ${option.text}`}
            style={[styles.card, { borderColor: stateStyle.borderColor }, style]}>
            <View style={styles.row}>
                <View style={[styles.badge, { backgroundColor: stateStyle.badgeBackground, borderColor: stateStyle.borderColor }]}>
                    <Text style={[styles.badgeText, { color: stateStyle.badgeText }]}>{option.label}</Text>
                </View>
                <View style={styles.copy}>
                    <Text style={styles.optionText}>{option.text}</Text>
                    {revealed ? <Text style={[styles.feedback, { color: stateStyle.feedbackColor }]}>{option.feedback}</Text> : null}
                </View>
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'flex-start',
    },
    badge: {
        width: 36,
        height: 36,
        borderRadius: radii.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        ...typography.sizes.labelMd,
        fontWeight: '800',
    },
    copy: {
        flex: 1,
        gap: spacing.xs,
    },
    optionText: {
        ...typography.sizes.bodyMd,
        color: colors.onSurface,
    },
    feedback: {
        ...typography.sizes.labelMd,
        fontWeight: '700',
    },
});

export default QuizOptionCard;