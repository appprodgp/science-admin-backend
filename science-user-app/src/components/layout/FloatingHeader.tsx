import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../../../theme';
import { BrandMark } from '../ui/BrandMark';

type FloatingHeaderProps = {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    rightAccessory?: ReactNode;
    showBrandMark?: boolean;
    style?: StyleProp<ViewStyle>;
};

export function FloatingHeader({
    title,
    eyebrow,
    subtitle,
    rightAccessory,
    showBrandMark = true,
    style,
}: FloatingHeaderProps) {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.topRow}>
                {showBrandMark ? <BrandMark size="sm" showWordmark={false} /> : null}
                {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                <View style={styles.spacer} />
                {rightAccessory}
            </View>
            <View style={styles.copy}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.glassStroke,
        borderRadius: 28,
        backgroundColor: 'rgba(10,14,24,0.78)',
        gap: spacing.md,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    spacer: {
        flex: 1,
    },
    copy: {
        gap: spacing.xs,
    },
    eyebrow: {
        ...typography.sizes.labelSm,
        color: colors.primary,
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
});

export default FloatingHeader;