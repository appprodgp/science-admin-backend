import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../../theme';

type ScienceBackgroundVariant = 'default' | 'aurora' | 'quiet';

type ScienceBackgroundProps = {
    variant?: ScienceBackgroundVariant;
    style?: StyleProp<ViewStyle>;
};

const variantOpacity: Record<ScienceBackgroundVariant, number> = {
    default: 1,
    aurora: 1.25,
    quiet: 0.55,
};

export function ScienceBackground({ variant = 'default', style }: ScienceBackgroundProps) {
    const opacity = variantOpacity[variant];

    return (
        <View pointerEvents="none" style={[styles.container, style]}>
            <View style={[styles.orb, styles.primaryOrb, { opacity: 0.22 * opacity }]} />
            <View style={[styles.orb, styles.secondaryOrb, { opacity: 0.18 * opacity }]} />
            <View style={[styles.orb, styles.indigoOrb, { opacity: 0.16 * opacity }]} />
            <View style={[styles.star, styles.starOne]} />
            <View style={[styles.star, styles.starTwo]} />
            <View style={[styles.star, styles.starThree]} />
            <View style={styles.gridLineHorizontal} />
            <View style={styles.gridLineVertical} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 9999,
    },
    primaryOrb: {
        width: 280,
        height: 280,
        right: -110,
        top: -80,
        backgroundColor: colors.primary,
    },
    secondaryOrb: {
        width: 220,
        height: 220,
        left: -90,
        top: 180,
        backgroundColor: colors.secondary,
    },
    indigoOrb: {
        width: 260,
        height: 260,
        right: -140,
        bottom: 80,
        backgroundColor: colors.electricIndigo,
    },
    star: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.onSurface,
        opacity: 0.42,
    },
    starOne: {
        top: 92,
        left: 52,
    },
    starTwo: {
        top: 248,
        right: 78,
    },
    starThree: {
        bottom: 148,
        left: 96,
    },
    gridLineHorizontal: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 168,
        height: 1,
        backgroundColor: colors.glassStroke,
        opacity: 0.4,
    },
    gridLineVertical: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 88,
        width: 1,
        backgroundColor: colors.glassStroke,
        opacity: 0.28,
    },
});

export default ScienceBackground;