/** List tab: grouped tasks with swipe, overdue + completed sections, search,
 * and the compact floating add menu (text / voice). */
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../theme';
import { formatDateLabel } from '../../lib/v5data';
import type { V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { ProgressBar, CategoryTag } from './ui';
import TaskCard from './TaskCard';
import { ListIcon, SearchIcon, FunnelIcon, MicSimpleIcon, TextLinesIcon, PlusIcon } from '../../components/icons';

export default function ListTab() {
  const s = useV5();
  const q = s.listSearchQuery.trim().toLowerCase();
  const match = (t: V5Task) => !q || t.title.toLowerCase().includes(q);

  const groupOf = (d: number) => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'later');
  const labels: Record<string, string> = { today: 'Сьогодні', tomorrow: 'Завтра', later: 'Пізніше' };
  const groups = (['today', 'tomorrow', 'later'] as const)
    .map((key) => ({
      key,
      label: labels[key],
      tasks: s.tasks.filter((t) => !t.completed && !t.overdue && t.dueInDays != null && groupOf(t.dueInDays) === key && match(t)),
    }))
    .filter((g) => g.tasks.length > 0);

  const overdue = s.tasks.filter((t) => !t.completed && t.overdue && match(t));
  const completed = s.tasks.filter((t) => t.completed && match(t));
  const completedCount = completed.length;
  const total = s.tasks.length;
  const done = s.tasks.filter((t) => t.completed).length;

  const menuOpen = s.listAddMenuOpen;
  const textMode = s.listAddMode === 'text';

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ListIcon size={22} color={palette.accent} />
            <View>
              <Text style={styles.h1}>Мої задачі</Text>
              <Text style={styles.date}>{formatDateLabel(new Date())}</Text>
            </View>
          </View>
          <View style={styles.headerBtns}>
            <Pressable onPress={s.toggleListSearch} style={styles.iconBtn}><SearchIcon size={18} color={palette.textMuted} /></Pressable>
            <Pressable onPress={s.openCategoryEditor} style={styles.iconBtn}><FunnelIcon size={18} color={palette.textMuted} /></Pressable>
          </View>
        </View>

        {s.listSearchOpen ? (
          <View style={styles.searchBar}>
            <SearchIcon size={16} color={palette.textFaint} />
            <TextInput
              value={s.listSearchQuery}
              onChangeText={s.setListSearch}
              placeholder="Пошук задач..."
              placeholderTextColor={palette.textFaint}
              style={styles.searchInput}
              autoFocus
            />
          </View>
        ) : null}

        <View style={{ marginBottom: 24 }}>
          <ProgressBar completed={done} total={total} />
        </View>

        {groups.map((g) => (
          <View key={g.key} style={{ marginBottom: 22 }}>
            <Text style={styles.groupLabel}>{g.label}</Text>
            {g.tasks.map((t) => <TaskCard key={t.id} task={t} />)}
          </View>
        ))}

        {overdue.length > 0 ? (
          <View style={{ marginBottom: 22 }}>
            <Text style={[styles.groupLabel, { color: palette.accent }]}>Прострочені</Text>
            {overdue.map((t) => <TaskCard key={t.id} task={t} />)}
          </View>
        ) : null}

        {completedCount > 0 ? (
          <View style={{ marginBottom: 22 }}>
            <Pressable onPress={s.toggleShowCompleted} style={styles.completedToggle}>
              <Text style={styles.completedToggleText}>Виконані — {completedCount}</Text>
              <Text style={styles.completedToggleAction}>{s.showCompleted ? 'Сховати' : 'Показати'}</Text>
            </Pressable>
            {s.showCompleted ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                {completed.map((t) => {
                  const cat = s.categories[t.category] || palette.textFaint;
                  return (
                    <Pressable key={t.id} onPress={() => s.openTaskDetail(t.id)} style={styles.completedCard}>
                      <Pressable onPress={() => s.toggleComplete(t.id)} style={styles.completedCheckbox}>
                        <Text style={styles.completedCheck}>✓</Text>
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completedTitle}>{t.title}</Text>
                        <View style={{ marginTop: 5, opacity: 0.5, flexDirection: 'row' }}>
                          <CategoryTag name={t.category} color={cat} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {menuOpen ? <Pressable onPress={s.closeListAddMenu} style={styles.menuBackdrop} /> : null}

      {menuOpen ? (
        <>
          <Pressable onPress={s.chooseListMic} style={[styles.fabItem, { bottom: 236 }]}>
            <MicSimpleIcon size={19} color={palette.white} />
          </Pressable>
          <Pressable onPress={s.chooseListText} style={[styles.fabItem, { bottom: 174 }]}>
            <TextLinesIcon size={18} color={palette.white} />
          </Pressable>
        </>
      ) : null}

      {textMode ? (
        <View style={styles.textBar}>
          <TextInput
            value={s.quickText}
            onChangeText={(v) => s.set({ quickText: v })}
            onSubmitEditing={s.submitQuick}
            placeholder="Що потрібно зробити?"
            placeholderTextColor={palette.textFaint}
            style={styles.textBarInput}
            autoFocus
            returnKeyType="done"
          />
          <Pressable onPress={s.submitQuick} style={styles.textBarSubmit}><PlusIcon size={13} /></Pressable>
        </View>
      ) : null}

      <Pressable onPress={s.handleFabClick} style={styles.fab}>
        <View style={{ transform: [{ rotate: menuOpen || textMode ? '45deg' : '0deg' }] }}>
          <PlusIcon size={16} color={palette.white} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 170 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  h1: { fontSize: 26, fontWeight: '700', color: palette.text, letterSpacing: -0.3 },
  date: { fontSize: 14, color: palette.textMuted, marginTop: 4 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingHorizontal: 14, height: 44, marginBottom: 18 },
  searchInput: { flex: 1, color: palette.text, fontSize: 14, padding: 0 },
  groupLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  completedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.surfaceAltBorder, borderRadius: 14 },
  completedToggleText: { fontSize: 13, color: palette.textMuted },
  completedToggleAction: { fontSize: 12.5, color: palette.accent, fontWeight: '600' },
  completedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: palette.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: palette.surfaceAltBorder },
  completedCheckbox: { width: 24, height: 24, borderRadius: 7, backgroundColor: withAlpha(palette.accent, 0.35), alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
  completedCheck: { color: palette.text, fontSize: 11, lineHeight: 12 },
  completedTitle: { fontSize: 14, fontWeight: '500', color: palette.textFaint, textDecorationLine: 'line-through' },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  fabItem: { position: 'absolute', right: 24, width: 46, height: 46, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.chipBorder, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 9, shadowOffset: { width: 0, height: 6 } },
  textBar: { position: 'absolute', left: 20, right: 20, bottom: 110, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.accent, borderRadius: 16, height: 56, paddingLeft: 16, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
  textBarInput: { flex: 1, color: palette.text, fontSize: 15, padding: 0 },
  textBarSubmit: { width: 38, height: 38, borderRadius: 11, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 110, width: 52, height: 52, borderRadius: 16, backgroundColor: palette.accentFab, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: palette.accentFab, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 8 } },
});
