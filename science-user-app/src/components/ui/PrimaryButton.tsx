import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../../../theme';

type PrimaryButtonVariant = 'filled' | 'outline' | 'ghost';

type PrimaryButtonProps = {
    title: string;
    onPress?: () => void;
    variant?: PrimaryButtonVariant;
    disabled?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    style?: StyleProp<ViewStyle>;
};

const variantMap: Record<PrimaryButtonVariant, { backgroundColor: string; borderColor: string; textColor: string }> = {
    filled: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        textColor: colors.onPrimary,
    },
    outline: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(78,222,163,0.48)',
        textColor: colors.primary,
    },
    ghost: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: colors.glassStroke,
        textColor: colors.onSurface,
    },
};

export function PrimaryButton({
    title,
    onPress,
    variant = 'filled',
    disabled = false,
    leftIcon,
    rightIcon,
    style,
}: PrimaryButtonProps) {
    const variantStyle = variantMap[variant];

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                { backgroundColor: variantStyle.backgroundColor, borderColor: variantStyle.borderColor },
                pressed ? styles.pressed : null,
                disabled ? styles.disabled : null,
                style,
            ]}>
            {leftIcon}
            <Text style={[styles.title, { color: variantStyle.textColor }]}>{title}</Text>
            {rightIcon}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 52,
        borderWidth: 1,
        borderRadius: radii.full,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    pressed: {
        opacity: 0.84,
        transform: [{ scale: 0.99 }],
    },
    disabled: {
        opacity: 0.5,
    },
    title: {
        ...typography.sizes.labelMd,
        fontWeight: '800',
    },
});

export default PrimaryButton;