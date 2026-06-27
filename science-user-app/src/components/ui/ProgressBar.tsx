import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing, typography } from '../../../theme';

type ProgressBarProps = {
    progress: number;
    height?: number;
    label?: string;
    showPercent?: boolean;
    fillColor?: string;
    trackColor?: string;
    style?: StyleProp<ViewStyle>;
};

function clampProgress(progress: number) {
    return Math.max(0, Math.min(1, progress));
}

export function ProgressBar({
    progress,
    height = 8,
    label,
    showPercent = false,
    fillColor = colors.primary,
    trackColor = 'rgba(255,255,255,0.08)',
    style,
}: ProgressBarProps) {
    const clampedProgress = clampProgress(progress);
    const remainder = Math.max(0, 1 - clampedProgress);

    return (
        <View style={[styles.container, style]}>
            {label || showPercent ? (
                <View style={styles.labelRow}>
                    {label ? <Text style={styles.label}>{label}</Text> : <View />}
                    {showPercent ? <Text style={styles.percent}>{Math.round(clampedProgress * 100)}%</Text> : null}
                </View>
            ) : null}
            <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
                <View style={[styles.fill, { flex: clampedProgress, backgroundColor: fillColor }]} />
                <View style={{ flex: remainder }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: spacing.xs,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing.sm,
    },
    label: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
    },
    percent: {
        ...typography.sizes.labelSm,
        color: colors.primary,
    },
    track: {
        flexDirection: 'row',
        overflow: 'hidden',
    },
    fill: {
        borderRadius: radii.full,
    },
});

export default ProgressBar;