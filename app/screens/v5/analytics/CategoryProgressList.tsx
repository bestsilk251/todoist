import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../../theme';
import type { AnalyticsCategory, AnalyticsMeasure } from '../../../lib/analyticsTypes';
import { categoryAnalyticsColor, formatHours, normalizedCategoryPercentages } from './analyticsUi';
import { DotsVerticalIcon, FireIcon, HomeIcon, ListIcon, ProfileIcon, StarIcon } from '../../../components/icons';

function CategoryIcon({ name, color }: { name: string; color: string }) {
  if (/робот/i.test(name)) return <ListIcon size={19} color={color} />;
  if (/навчан/i.test(name)) return <StarIcon size={18} color={color} />;
  if (/особист/i.test(name)) return <ProfileIcon size={19} color={color} />;
  if (/здоров/i.test(name)) return <FireIcon size={19} color={color} />;
  if (/дім|дом/i.test(name)) return <HomeIcon size={19} color={color} />;
  return <DotsVerticalIcon size={18} color={color} />;
}

export default function CategoryProgressList({ categories, measure }: { categories: AnalyticsCategory[]; measure: AnalyticsMeasure }) {
  const percentages = normalizedCategoryPercentages(categories, measure);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Топ категорій</Text>
        <Text style={styles.headerMeta}>{measure === 'hours' ? 'За часом' : 'За кількістю'}</Text>
      </View>
      {categories.map((item, index) => {
        const value = measure === 'hours' ? item.plannedMinutes : item.completedTasks;
        const percentage = percentages[item.id] ?? 0;
        const color = categoryAnalyticsColor(item.name);
        return (
          <View key={item.id} style={[styles.item, index < categories.length - 1 && styles.itemDivider]}>
            <View style={[styles.icon, { backgroundColor: withAlpha(color, 0.12), borderColor: withAlpha(color, 0.32) }]}>
              <CategoryIcon name={item.name} color={color} />
            </View>
            <View style={styles.itemBody}>
              <View style={styles.row}>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>{item.name}</Text>
                <Text numberOfLines={1} style={styles.value}>{measure === 'hours' ? formatHours(value) : `${value} задач`}</Text>
                <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: `${percentage}%`, backgroundColor: color }]} /></View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 15, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  title: { color: palette.text, fontSize: 15.5, fontWeight: '800' },
  headerMeta: { color: palette.textFaint, fontSize: 10.5 },
  item: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: palette.borderFaint },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  itemBody: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { flex: 1, minWidth: 0, color: palette.text, fontSize: 12.5, fontWeight: '700' },
  value: { maxWidth: 80, color: palette.textMuted, fontSize: 10.5, textAlign: 'right' },
  percentage: { width: 34, fontSize: 12.5, fontWeight: '800', textAlign: 'right' },
  track: { height: 6, borderRadius: 4, backgroundColor: palette.chip, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
