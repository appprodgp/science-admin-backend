import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '../../../theme';

type GlassCardVariant = 'default' | 'elevated' | 'subtle';

type GlassCardProps = {
    children: ReactNode;
    variant?: GlassCardVariant;
    onPress?: () => void;
    disabled?: boolean;
    accessibilityLabel?: string;
    style?: StyleProp<ViewStyle>;
};

export function GlassCard({
    children,
    variant = 'default',
    onPress,
    disabled = false,
    accessibilityLabel,
    style,
}: GlassCardProps) {
    const cardStyle = [styles.card, variantStyles[variant], variant === 'elevated' ? shadows.glassPanel : null, style];

    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={onPress}
                style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}>
                {children}
            </Pressable>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: radii.xl,
        padding: spacing.md,
        backgroundColor: 'rgba(28,31,42,0.78)',
    },
    pressed: {
        opacity: 0.82,
        transform: [{ scale: 0.99 }],
    },
    disabled: {
        opacity: 0.5,
    },
});

const variantStyles = StyleSheet.create({
    default: {
        backgroundColor: 'rgba(28,31,42,0.78)',
    },
    elevated: {
        backgroundColor: 'rgba(23,27,38,0.9)',
    },
    subtle: {
        backgroundColor: 'rgba(10,14,24,0.58)',
    },
});

export default GlassCard;