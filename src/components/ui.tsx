import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useWebTopInset } from '@/hooks/use-web-top-inset';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  const webTopInset = useWebTopInset();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.screenContent, { paddingTop: Spacing.lg + webTopInset }]}>
      <Text style={[styles.screenTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card }, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.muted, { color: theme.textSecondary }, style]}>{children}</Text>;
}

export function ProgressBar({
  value,
  color,
  height = 10,
  marker,
}: {
  /** 0–1, values above 1 are clamped. */
  value: number;
  color: string;
  height?: number;
  /** Optional 0–1 position of a thin vertical marker (e.g. "where you should be"). */
  marker?: number;
}) {
  const theme = useTheme();
  const width = `${Math.min(1, Math.max(0, value)) * 100}%` as const;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.track }]}>
      <View style={{ width, height, borderRadius: height / 2, backgroundColor: color }} />
      {marker !== undefined && (
        <View
          style={[
            styles.marker,
            { left: `${Math.min(1, Math.max(0, marker)) * 100}%`, backgroundColor: theme.text },
          ]}
        />
      )}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const theme = useTheme();
  const backgroundColor =
    variant === 'primary' ? theme.accent : variant === 'danger' ? theme.over : theme.cardMuted;
  const color = variant === 'secondary' ? theme.text : theme.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}>
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.accent : theme.card,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}>
      <Text style={[styles.chipText, { color: selected ? theme.accentText : theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  muted: {
    fontSize: 14,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  marker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.6,
  },
  button: {
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
