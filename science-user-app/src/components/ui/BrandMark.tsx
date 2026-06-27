import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../../../theme';

type BrandMarkSize = 'sm' | 'md' | 'lg';

type BrandMarkProps = {
    size?: BrandMarkSize;
    label?: string;
    tagline?: string;
    showWordmark?: boolean;
    style?: StyleProp<ViewStyle>;
};

const sizeMap = {
    sm: { mark: 36, symbol: 19 },
    md: { mark: 48, symbol: 25 },
    lg: { mark: 64, symbol: 34 },
} as const;

export function BrandMark({
    size = 'md',
    label = 'Scilens',
    tagline = 'Science literacy',
    showWordmark = true,
    style,
}: BrandMarkProps) {
    const dimensions = sizeMap[size];

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.mark, { width: dimensions.mark, height: dimensions.mark, borderRadius: dimensions.mark / 2 }]}>
                <View style={styles.innerOrbit} />
                <Text style={[styles.symbol, { fontSize: dimensions.symbol }]}>✦</Text>
            </View>
            {showWordmark ? (
                <View style={styles.wordmark}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.tagline}>{tagline}</Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    mark: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(78,222,163,0.45)',
        backgroundColor: 'rgba(78,222,163,0.14)',
    },
    innerOrbit: {
        position: 'absolute',
        width: '72%',
        height: '38%',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(192,193,255,0.5)',
        transform: [{ rotate: '-18deg' }],
    },
    symbol: {
        color: colors.primary,
        fontWeight: '700',
    },
    wordmark: {
        gap: 1,
    },
    label: {
        ...typography.sizes.labelMd,
        color: colors.onSurface,
        fontWeight: '700',
    },
    tagline: {
        ...typography.sizes.labelSm,
        color: colors.onSurfaceVariant,
    },
});

export default BrandMark;