import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../../../theme';

type SectionHeaderProps = {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    actionLabel?: string;
    onActionPress?: () => void;
    rightAccessory?: ReactNode;
    style?: StyleProp<ViewStyle>;
};

export function SectionHeader({
    title,
    eyebrow,
    subtitle,
    actionLabel,
    onActionPress,
    rightAccessory,
    style,
}: SectionHeaderProps) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.copy}>
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {rightAccessory}
            {actionLabel && onActionPress ? (
                <Pressable accessibilityRole="button" onPress={onActionPress} style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.md,
    },
    copy: {
        flex: 1,
        gap: spacing.xs,
    },
    eyebrow: {
        ...typography.sizes.labelSm,
        color: colors.primary,
        textTransform: 'uppercase',
    },
    title: {
        ...typography.sizes.headlineMd,
        color: colors.onSurface,
    },
    subtitle: {
        ...typography.sizes.bodyMd,
        color: colors.onSurfaceVariant,
    },
    action: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    pressed: {
        opacity: 0.72,
    },
    actionText: {
        ...typography.sizes.labelMd,
        color: colors.primary,
        fontWeight: '700',
    },
});

export default SectionHeader;