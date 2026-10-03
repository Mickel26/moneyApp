import { StyleSheet, Text, View } from 'react-native';

import { Card, Muted, ProgressBar, Screen, SectionLabel } from '@/components/ui';
import { getCategory } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  addDays,
  dailyTotals,
  DayTotal,
  expensesInPeriod,
  formatDay,
  formatMoney,
  summarize,
  totalsByCategory,
} from '@/lib/budget';
import { useStore } from '@/lib/store';

export default function StatsScreen() {
  const theme = useTheme();
  const { settings, expenses, fixedCosts, today } = useStore();

  if (!settings) {
    return (
      <Screen title="Statystyki">
        <Muted>Najpierw ustaw budżet na ekranie „Dziś”.</Muted>
      </Screen>
    );
  }

  const summary = summarize(settings, expenses, today, fixedCosts);
  const inPeriod = expensesInPeriod(expenses, summary.period);
  const days = dailyTotals(inPeriod, summary.period, today);
  const categories = totalsByCategory(inPeriod);
  const average = Math.round(summary.spent / summary.dayNumber);
  const biggest = inPeriod.reduce<(typeof inPeriod)[number] | null>(
    (max, e) => (!max || e.amount > max.amount ? e : max),
    null,
  );
  const daysOverLimit = days.filter((d) => d.total > summary.baseDailyLimit).length;

  return (
    <Screen title="Statystyki">
      <Muted>
        Okres: {formatDay(summary.period.start)} – {formatDay(addDays(summary.period.end, -1))}
      </Muted>

      <View style={styles.tiles}>
        <Tile label="Wydane" value={formatMoney(summary.spent, { whole: true })} />
        <Tile
          label="Średnio / dzień"
          value={formatMoney(average, { whole: true })}
          color={average > summary.baseDailyLimit ? theme.over : theme.good}
        />
      </View>
      <View style={styles.tiles}>
        <Tile label="Plan / dzień" value={formatMoney(summary.baseDailyLimit, { whole: true })} />
        <Tile
          label="Prognoza na koniec"
          value={formatMoney(summary.projectedSpend, { whole: true })}
          color={summary.projectedSpend > summary.spendable ? theme.over : theme.good}
        />
      </View>

      {summary.fixedTotal > 0 && (
        <Muted style={styles.small}>
          Bez stałych opłat ({formatMoney(summary.fixedTotal)} / mies.) – są odliczone od budżetu z góry.
        </Muted>
      )}

      <SectionLabel>Wydatki dzień po dniu</SectionLabel>
      <Card>
        <DailyChart days={days} limit={summary.baseDailyLimit} />
        <Muted style={styles.small}>
          Przerywana linia = plan dzienny ({formatMoney(summary.baseDailyLimit, { whole: true })}). Dni ponad
          planem: {daysOverLimit} z {days.length}.
        </Muted>
      </Card>

      <SectionLabel>Na co idą pieniądze</SectionLabel>
      <Card style={styles.categories}>
        {categories.length === 0 && <Muted>Brak wydatków w tym okresie.</Muted>}
        {categories.map((c) => {
          const category = getCategory(c.category);
          return (
            <View key={c.category} style={styles.categoryRow}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryName, { color: theme.text }]}>
                  {category.emoji} {category.label}
                </Text>
                <Text style={[styles.categoryAmount, { color: theme.text }]}>
                  {formatMoney(c.total)}{' '}
                  <Text style={{ color: theme.textSecondary }}>{Math.round(c.share * 100)}%</Text>
                </Text>
              </View>
              <ProgressBar value={c.share} color={category.color} height={8} />
            </View>
          );
        })}
      </Card>

      {biggest && (
        <>
          <SectionLabel>Największy wydatek</SectionLabel>
          <Card>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {getCategory(biggest.category).emoji} {biggest.note || getCategory(biggest.category).label} ·{' '}
              {formatMoney(biggest.amount)}
            </Text>
            <Muted>{formatDay(biggest.day)}</Muted>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.tile}>
      <Muted style={styles.small}>{label}</Muted>
      <Text style={[styles.tileValue, { color: color ?? theme.text }]} adjustsFontSizeToFit numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

const CHART_HEIGHT = 140;

function DailyChart({ days, limit }: { days: DayTotal[]; limit: number }) {
  const theme = useTheme();
  const max = Math.max(limit, ...days.map((d) => d.total), 1);
  const limitY = (limit / max) * CHART_HEIGHT;
  // Label roughly every 5th day so the axis stays readable for a whole month.
  const labelEvery = days.length > 10 ? 5 : 1;

  return (
    <View>
      <View style={[styles.chart, { height: CHART_HEIGHT }]}>
        <View style={[styles.limitLine, { bottom: limitY, borderColor: theme.textSecondary }]} />
        {days.map((d) => (
          <View key={d.day} style={styles.barSlot}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(2, (d.total / max) * CHART_HEIGHT),
                  backgroundColor: d.total > limit ? theme.over : theme.accent,
                  opacity: d.total === 0 ? 0.25 : 1,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.axis}>
        {days.map((d, i) =>
          i % labelEvery === 0 ? (
            <Text
              key={d.day}
              style={[styles.axisLabel, { left: `${((i + 0.5) / days.length) * 100}%`, color: theme.textSecondary }]}>
              {Number(d.day.slice(8))}
            </Text>
          ) : null,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tile: {
    flex: 1,
    gap: 2,
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  small: {
    fontSize: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  limitLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  barSlot: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 22,
    borderRadius: 3,
  },
  axis: {
    height: 14,
    marginTop: 4,
  },
  axisLabel: {
    position: 'absolute',
    width: 24,
    marginLeft: -12,
    fontSize: 10,
    textAlign: 'center',
  },
  categories: {
    gap: Spacing.md,
  },
  categoryRow: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
