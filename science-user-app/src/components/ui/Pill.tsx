import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../../../theme';

type PillTone = 'primary' | 'secondary' | 'neutral' | 'danger';
type PillSize = 'sm' | 'md';

type PillProps = {
    label: string;
    icon?: string;
    tone?: PillTone;
    size?: PillSize;
    selected?: boolean;
    onPress?: () => void;
    style?: StyleProp<ViewStyle>;
};

const toneMap: Record<PillTone, { backgroundColor: string; borderColor: string; textColor: string }> = {
    primary: {
        backgroundColor: 'rgba(78,222,163,0.14)',
        borderColor: 'rgba(78,222,163,0.36)',
        textColor: colors.primary,
    },
    secondary: {
        backgroundColor: 'rgba(192,193,255,0.14)',
        borderColor: 'rgba(192,193,255,0.34)',
        textColor: colors.secondary,
    },
    neutral: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: colors.glassStroke,
        textColor: colors.onSurfaceVariant,
    },
    danger: {
        backgroundColor: 'rgba(255,180,171,0.14)',
        borderColor: 'rgba(255,180,171,0.34)',
        textColor: colors.error,
    },
};

export function Pill({ label, icon, tone = 'neutral', size = 'md', selected = false, onPress, style }: PillProps) {
    const toneStyle = toneMap[tone];
    const content = (
        <>
            {icon ? <Text style={[styles.icon, { color: toneStyle.textColor }]}>{icon}</Text> : null}
            <Text style={[styles.label, size === 'sm' ? styles.labelSmall : null, { color: toneStyle.textColor }]}>{label}</Text>
        </>
    );
    const containerStyle = [
        styles.container,
        size === 'sm' ? styles.containerSmall : null,
        {
            backgroundColor: selected ? toneStyle.borderColor : toneStyle.backgroundColor,
            borderColor: toneStyle.borderColor,
        },
        style,
    ];

    if (onPress) {
        return (
            <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [containerStyle, pressed ? styles.pressed : null]}>
                {content}
            </Pressable>
        );
    }

    return <View style={containerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: 1,
        borderRadius: radii.full,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs + 2,
    },
    containerSmall: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    pressed: {
        opacity: 0.78,
    },
    icon: {
        fontSize: 12,
    },
    label: {
        ...typography.sizes.labelSm,
        fontWeight: '700',
    },
    labelSmall: {
        fontSize: 11,
        lineHeight: 14,
    },
});

export default Pill;