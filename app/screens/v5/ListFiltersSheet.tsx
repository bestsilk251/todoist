import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlagIcon } from '../../components/icons';
import { matchesTaskFilters } from '../../lib/taskFilters';
import { pluralTasks } from '../../lib/v5data';
import { palette, priorityColor, type Priority, withAlpha } from '../../theme';
import { useV5 } from './store';

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'urgent', label: 'Терміновий' },
  { value: 'high', label: 'Високий' },
  { value: 'medium', label: 'Середній' },
  { value: 'low', label: 'Без пріоритету' },
];

function toggleValue<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export default function ListFiltersSheet() {
  const s = useV5();
  const insets = useSafeAreaInsets();
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!s.listFiltersOpen) return;
    setPriorities(s.listPriorityFilters);
    setCategories(s.listCategoryFilters);
  }, [s.listFiltersOpen, s.listPriorityFilters, s.listCategoryFilters]);

  if (!s.listFiltersOpen) return null;

  const categoryNames = Object.keys(s.categories).sort((a, b) => a.localeCompare(b, 'uk'));
  const resultCount = s.tasks.filter((task) => (
    !task.completed
    && !task.cancelled
    && matchesTaskFilters(task, { priorities, categories })
  )).length;
  const hasDraftFilters = priorities.length > 0 || categories.length > 0;

  return (
    <Pressable onPress={s.closeListFilters} style={styles.overlay}>
      <Pressable onPress={() => {}} style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Фільтри</Text>
            <Text style={styles.subtitle}>Пріоритети й категорії можна поєднувати</Text>
          </View>
          <Pressable onPress={s.closeListFilters} accessibilityLabel="Закрити фільтри" style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Пріоритет</Text>
            <Pressable onPress={() => setPriorities([])} disabled={priorities.length === 0} hitSlop={8}>
              <Text style={[styles.sectionReset, priorities.length === 0 && styles.sectionResetDisabled]}>Усі</Text>
            </Pressable>
          </View>
          <View style={styles.optionList}>
            {PRIORITIES.map((item) => {
              const active = priorities.includes(item.value);
              const color = priorityColor(item.value);
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setPriorities((current) => toggleValue(current, item.value))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  style={[styles.optionRow, active && { borderColor: withAlpha(color, 0.62), backgroundColor: withAlpha(color, 0.08) }]}
                >
                  <FlagIcon size={16} color={color} filled={active} />
                  <Text style={styles.optionText}>{item.label}</Text>
                  <View style={[styles.checkCircle, active && { borderColor: color, backgroundColor: color }]}>
                    {active ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.sectionHeader, styles.categorySectionHeader]}>
            <Text style={styles.sectionTitle}>Категорії</Text>
            <Pressable onPress={() => setCategories([])} disabled={categories.length === 0} hitSlop={8}>
              <Text style={[styles.sectionReset, categories.length === 0 && styles.sectionResetDisabled]}>Усі</Text>
            </Pressable>
          </View>
          <View style={styles.categoryGrid}>
            {categoryNames.map((category) => {
              const active = categories.includes(category);
              const color = s.categories[category] || palette.textFaint;
              return (
                <Pressable
                  key={category}
                  onPress={() => setCategories((current) => toggleValue(current, category))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  style={[styles.categoryOption, active && { borderColor: withAlpha(color, 0.7), backgroundColor: withAlpha(color, 0.12) }]}
                >
                  <View style={[styles.categoryDot, { backgroundColor: color }]} />
                  <Text numberOfLines={1} style={[styles.categoryText, active && { color: palette.text }]}>{category}</Text>
                  <View style={[styles.smallCheck, active && { borderColor: color, backgroundColor: color }]}>
                    {active ? <Text style={styles.smallCheckMark}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => { setPriorities([]); setCategories([]); s.clearListFilters(); }}
            disabled={!hasDraftFilters && s.listPriorityFilters.length === 0 && s.listCategoryFilters.length === 0}
            style={styles.resetButton}
          >
            <Text style={styles.resetText}>Скинути</Text>
          </Pressable>
          <Pressable onPress={() => s.setListFilters(priorities, categories)} style={styles.applyButton}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.applyText}>Показати {resultCount} {pluralTasks(resultCount)}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 34, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { width: '100%', maxWidth: 540, maxHeight: '88%', alignSelf: 'center', backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: palette.border },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.borderStrong, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, paddingHorizontal: 20, paddingTop: 17, paddingBottom: 15 },
  title: { color: palette.text, fontSize: 21, lineHeight: 26, fontWeight: '800' },
  subtitle: { color: palette.textFaint, fontSize: 11.5, marginTop: 3 },
  closeButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  closeText: { color: palette.textMuted, fontSize: 25, lineHeight: 27, fontWeight: '300' },
  content: { paddingHorizontal: 20, paddingBottom: 18 },
  sectionHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  categorySectionHeader: { marginTop: 18 },
  sectionTitle: { color: palette.textMuted, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.65 },
  sectionReset: { color: palette.accent, fontSize: 12, fontWeight: '600' },
  sectionResetDisabled: { color: palette.textFainter },
  optionList: { gap: 7 },
  optionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, borderRadius: 13, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  optionText: { flex: 1, color: palette.textSecondary, fontSize: 13.5, fontWeight: '600' },
  checkCircle: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.3, borderColor: palette.borderStrong },
  checkMark: { color: palette.white, fontSize: 11, lineHeight: 13, fontWeight: '800' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: { width: '48.5%', minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  categoryDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  categoryText: { flex: 1, minWidth: 0, color: palette.textSecondary, fontSize: 12.5, fontWeight: '600' },
  smallCheck: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.2, borderColor: palette.borderStrong },
  smallCheckMark: { color: palette.white, fontSize: 9.5, lineHeight: 11, fontWeight: '800' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.borderFaint },
  resetButton: { width: 92, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  resetText: { color: palette.textMuted, fontSize: 13.5, fontWeight: '600' },
  applyButton: { flex: 1, minWidth: 0, minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 14, backgroundColor: palette.accent },
  applyText: { color: palette.white, fontSize: 13.5, fontWeight: '700' },
});
