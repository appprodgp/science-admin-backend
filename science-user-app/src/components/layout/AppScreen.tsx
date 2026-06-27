import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../../theme';
import { ScienceBackground } from './ScienceBackground';

type SafeAreaEdge = 'top' | 'right' | 'bottom' | 'left';

type AppScreenProps = {
    children: ReactNode;
    scroll?: boolean;
    withBackground?: boolean;
    backgroundVariant?: 'default' | 'aurora' | 'quiet';
    edges?: SafeAreaEdge[];
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({
    children,
    scroll = true,
    withBackground = true,
    backgroundVariant = 'default',
    edges = ['top', 'right', 'bottom', 'left'],
    style,
    contentContainerStyle,
}: AppScreenProps) {
    const content = scroll ? (
        <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}>
            {children}
        </ScrollView>
    ) : (
        <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
    );

    return (
        <SafeAreaView edges={edges} style={[styles.safeArea, style]}>
            {withBackground ? <ScienceBackground variant={backgroundVariant} /> : null}
            {content}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    staticContent: {
        flex: 1,
        paddingHorizontal: spacing.marginMobile,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.lg,
    },
});

export default AppScreen;