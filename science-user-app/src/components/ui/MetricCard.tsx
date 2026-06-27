import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../../../theme';
import { GlassCard } from './GlassCard';
import { ProgressBar } from './ProgressBar';

type MetricCardProps = {
    label: string;
    value: string | number;
    unit?: string;
    detail?: string;
    delta?: string;
    icon?: string;
    progress?: number;
    accentColor?: string;
    style?: StyleProp<ViewStyle>;
};

export function MetricCard({
    label,
    value,
    unit,
    detail,
    delta,
    icon,
    progress,
    accentColor = colors.primary,
    style,
}: MetricCardProps) {
    return (
        <GlassCard variant="subtle" style={[styles.card, style]}>
            <View style={styles.header}>
                <View style={[styles.iconBubble, { backgroundColor: `${accentColor}24`, borderColor: `${accentColor}66` }]}>
                    <Text style={styles.icon}>{icon ?? '✦'}</Text>
                </View>
                {delta ? <Text style={[styles.delta, { color: accentColor }]}>{delta}</Text> : null}
            </View>
            <View style={styles.valueRow}>
                <Text style={styles.value}>{value}</Text>
                {unit ? <Text style={styles.unit}>{unit}</Text> : null}
            </View>
            <Text style={styles.label}>{label}</Text>
            {detail ? <Text style={styles.detail}>{detail}</Text> : null}
            {typeof progress === 'number' ? <ProgressBar progress={progress} fillColor={accentColor} /> : null}
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        gap: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
    },
    iconBubble: {
        width: 36,
        height: 36,
        borderRadius: radii.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        fontSize: 18,
    },
    delta: {
        ...typography.sizes.labelSm,
        fontWeight: '700',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.xs,
    },
    value: {
        ...typography.sizes.headlineLg,
        color: colors.onSurface,
    },
    unit: {
        ...typography.sizes.labelMd,
        color: colors.onSurfaceVariant,
        paddingBottom: 5,
    },
    label: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '700',
    },
    detail: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
    },
});

export default MetricCard;