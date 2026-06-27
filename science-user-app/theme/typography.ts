export const typography = {
    fontFamily: {
        display: 'System',
        headline: 'System',
        body: 'System',
        label: 'System',
    },
    sizes: {
        displayLg: {
            fontSize: 48,
            lineHeight: 56,
            fontWeight: '700',
            letterSpacing: -0.96,
        },
        headlineLg: {
            fontSize: 32,
            lineHeight: 40,
            fontWeight: '600',
            letterSpacing: -0.32,
        },
        headlineLgMobile: {
            fontSize: 28,
            lineHeight: 36,
            fontWeight: '600',
        },
        headlineMd: {
            fontSize: 24,
            lineHeight: 32,
            fontWeight: '600',
        },
        bodyLg: {
            fontSize: 18,
            lineHeight: 28,
            fontWeight: '400',
        },
        bodyMd: {
            fontSize: 16,
            lineHeight: 24,
            fontWeight: '400',
        },
        labelMd: {
            fontSize: 14,
            lineHeight: 20,
            fontWeight: '500',
            letterSpacing: 0.28,
        },
        labelSm: {
            fontSize: 12,
            lineHeight: 16,
            fontWeight: '500',
            letterSpacing: 0.6,
        },
    },
} as const;