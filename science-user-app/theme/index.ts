export { colors } from './colors';
export { navigationTheme } from './navigation';
export { radii } from './radii';
export { shadows } from './shadows';
export { spacing } from './spacing';
export { typography } from './typography';

import { colors } from './colors';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
    colors,
    radii,
    shadows,
    spacing,
    typography,
} as const;

export type AppTheme = typeof theme;