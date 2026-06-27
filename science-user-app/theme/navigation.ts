import { colors } from './colors';

export const navigationTheme = {
    dark: true,
    colors: {
        primary: colors.primary,
        background: colors.background,
        card: colors.surfaceContainerLowest,
        text: colors.onSurface,
        border: colors.outlineVariant,
        notification: colors.secondary,
    },
    fonts: {
        regular: { fontFamily: 'System', fontWeight: '400' as const },
        medium: { fontFamily: 'System', fontWeight: '500' as const },
        bold: { fontFamily: 'System', fontWeight: '700' as const },
        heavy: { fontFamily: 'System', fontWeight: '700' as const },
    },
};