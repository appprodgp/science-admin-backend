import { colors } from './colors';

export const shadows = {
    ambient: {
        shadowColor: colors.ambientShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 8,
    },
    glassPanel: {
        shadowColor: colors.ambientShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 6,
    },
} as const;