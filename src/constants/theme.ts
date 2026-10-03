export const Colors = {
  light: {
    text: '#0B0B0F',
    textSecondary: '#6B6F78',
    background: '#F2F2F7',
    card: '#FFFFFF',
    cardMuted: '#F2F2F7',
    border: '#E3E3E8',
    accent: '#5B5BF0',
    accentText: '#FFFFFF',
    good: '#16A34A',
    warning: '#D97706',
    over: '#DC2626',
    track: '#E7E7EC',
  },
  dark: {
    text: '#F5F5F7',
    textSecondary: '#9A9DA6',
    background: '#000000',
    card: '#1C1C1E',
    cardMuted: '#2C2C2E',
    border: '#2C2C2E',
    accent: '#7C7CFF',
    accentText: '#FFFFFF',
    good: '#30D158',
    warning: '#FFB020',
    over: '#FF453A',
    track: '#2C2C2E',
  },
} as const;

export type Theme = (typeof Colors)['light'] | (typeof Colors)['dark'];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
} as const;
