/** List tab: grouped tasks with swipe, overdue + completed sections, search,
 * and the compact floating add menu (text / voice). */
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, priorityColor, priorityLabel, withAlpha } from '../../theme';
import { compareTasksChronologically, formatDateLabel, formatTaskEventDate } from '../../lib/v5data';
import type { V5Task } from '../../lib/v5data';
import { useV5 } from './store';
import { ProgressBar, CategoryTag, ScreenHeader } from './ui';
import TaskCard from './TaskCard';
import { ListIcon, SearchIcon, FunnelIcon, PaletteIcon, MicSimpleIcon, TextLinesIcon, PlusIcon, ClockIcon, CheckCircleIcon } from '../../components/icons';
import { matchesTaskSearch } from '../../lib/taskSearch';
import { isTaskCompletedOnLocalDay, isTaskInListSection } from '../../lib/taskSelectors';
import { matchesTaskFilters, taskFilterCount } from '../../lib/taskFilters';
import { clockToMinutes, minutesToClock } from '../../lib/calendarMath';

const RECENT_COMPLETED_LIMIT = 3;

export default function ListTab() {
  const s = useV5();
  const filters = { priorities: s.listPriorityFilters, categories: s.listCategoryFilters };
  const matchesFilters = (task: V5Task) => matchesTaskFilters(task, filters);
  const match = (task: V5Task) => matchesTaskSearch(task, s.listSearchQuery) && matchesFilters(task);
  const activeFilterCount = taskFilterCount(filters);

  const groupOf = (d: number) => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : 'later');
  const labels: Record<string, string> = { today: 'Сьогодні', tomorrow: 'Завтра', later: 'Пізніше' };
  const datedGroups = (['today', 'tomorrow', 'later'] as const)
    .map((key) => ({
      key,
      label: labels[key],
      tasks: s.tasks
        .filter((t) => isTaskInListSection(t, 'active') && t.dueInDays != null && groupOf(t.dueInDays) === key && match(t))
        .sort(compareTasksChronologically),
    }))
    .filter((g) => g.tasks.length > 0);
  const noDateTasks = s.tasks
    .filter((t) => isTaskInListSection(t, 'active') && t.dueInDays == null && match(t))
    .sort(compareTasksChronologically);
  const groups: { key: string; label: string; tasks: V5Task[] }[] = [
    ...datedGroups,
    ...(noDateTasks.length ? [{ key: 'noDate', label: 'Без дати', tasks: noDateTasks }] : []),
  ];

  const overdue = s.tasks.filter((t) => isTaskInListSection(t, 'overdue') && match(t)).sort(compareTasksChronologically);
  const completed = s.tasks.filter((t) => isTaskInListSection(t, 'completed') && match(t)).sort(compareTasksChronologically);
  const cancelled = s.tasks.filter((t) => isTaskInListSection(t, 'cancelled') && match(t)).sort(compareTasksChronologically);
  const completedToday = completed
    .filter((task) => isTaskCompletedOnLocalDay(task))
    .sort((a, b) => Date.parse(b.completedAt || '') - Date.parse(a.completedAt || ''));
  const recentCompleted = completedToday.slice(0, RECENT_COMPLETED_LIMIT);
  const completedCount = completed.length;
  const cancelledCount = cancelled.length;
  const activeCount = s.tasks.filter((t) => isTaskInListSection(t, 'active') && matchesFilters(t)).length;
  const done = s.tasks.filter((t) => isTaskInListSection(t, 'completed') && matchesFilters(t)).length;
  const total = done + activeCount;
  const visibleTaskCount = groups.reduce((sum, group) => sum + group.tasks.length, 0) + overdue.length + completed.length + cancelled.length;

  const menuOpen = s.listAddMenuOpen;
  const textMode = s.listAddMode === 'text';

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="never"
        onScrollBeginDrag={s.listSearchOpen ? s.closeListSearch : undefined}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          icon={<ListIcon size={24} color={palette.accent} />}
          title="Мої задачі"
          actions={(
            <View style={styles.headerActions}>
              <Pressable accessibilityLabel="Пошук задач" hitSlop={2} onPress={s.toggleListSearch} style={styles.iconBtn}><SearchIcon size={17} color={palette.textMuted} /></Pressable>
              <Pressable
                accessibilityLabel={`Фільтри задач${activeFilterCount ? `, вибрано ${activeFilterCount}` : ''}`}
                hitSlop={2}
                onPress={s.openListFilters}
                style={[styles.iconBtn, activeFilterCount > 0 && styles.iconBtnActive]}
              >
                <FunnelIcon size={17} color={activeFilterCount > 0 ? palette.accent : palette.textMuted} />
                {activeFilterCount > 0 ? <Text style={styles.filterBadge}>{activeFilterCount > 9 ? '9+' : activeFilterCount}</Text> : null}
              </Pressable>
              <Pressable accessibilityLabel="Кольори категорій" hitSlop={2} onPress={s.openCategoryEditor} style={styles.iconBtn}><PaletteIcon size={17} color={palette.textMuted} /></Pressable>
            </View>
          )}
        />

        {s.listSearchOpen ? (
          <View style={styles.searchBar}>
            <SearchIcon size={16} color={palette.textFaint} />
            <TextInput
              value={s.listSearchQuery}
              onChangeText={s.setListSearch}
              placeholder="Назва, категорія або ключове слово..."
              placeholderTextColor={palette.textFaint}
              style={styles.searchInput}
              autoFocus
              onBlur={s.closeListSearch}
            />
          </View>
        ) : null}

        {activeFilterCount > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilters}>
            {s.listPriorityFilters.map((priority) => {
              const color = priorityColor(priority);
              return (
                <Pressable key={priority} onPress={() => s.setListFilters(s.listPriorityFilters.filter((item) => item !== priority), s.listCategoryFilters)} style={[styles.filterChip, { borderColor: withAlpha(color, 0.5), backgroundColor: withAlpha(color, 0.09) }]}>
                  <View style={[styles.filterChipDot, { backgroundColor: color }]} />
                  <Text style={styles.filterChipText}>{priorityLabel(priority)}</Text>
                  <Text style={styles.filterChipX}>×</Text>
                </Pressable>
              );
            })}
            {s.listCategoryFilters.map((category) => {
              const color = s.categories[category] || palette.textFaint;
              return (
                <Pressable key={category} onPress={() => s.setListFilters(s.listPriorityFilters, s.listCategoryFilters.filter((item) => item !== category))} style={[styles.filterChip, { borderColor: withAlpha(color, 0.5), backgroundColor: withAlpha(color, 0.09) }]}>
                  <View style={[styles.filterChipDot, { backgroundColor: color }]} />
                  <Text numberOfLines={1} style={styles.filterChipText}>{category}</Text>
                  <Text style={styles.filterChipX}>×</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={s.clearListFilters} style={styles.clearFiltersChip}><Text style={styles.clearFiltersText}>Очистити</Text></Pressable>
          </ScrollView>
        ) : null}

        <View style={{ marginBottom: 24 }}>
          <ProgressBar completed={done} total={total} />
        </View>

        {recentCompleted.length > 0 ? (
          <View style={styles.recentCompletedSection}>
            <View style={styles.recentCompletedHeader}>
              <View style={styles.recentCompletedHeading}>
                <ClockIcon size={15} color={palette.textMuted} />
                <Text style={styles.recentCompletedLabel}>Раніше сьогодні</Text>
              </View>
              <Text style={styles.recentCompletedCount}>Завершено · {completedToday.length}</Text>
            </View>

            <View style={styles.recentCompletedList}>
              {recentCompleted.map((task) => {
                const categoryColor = s.categories[task.category] || palette.textFaint;
                const timeLabel = task.time && task.durationMinutes
                  ? `${task.time}–${minutesToClock(clockToMinutes(task.time) + task.durationMinutes)}`
                  : task.time;
                const completedDate = formatTaskEventDate(task.completedAt, false);
                return (
                  <Pressable
                    key={task.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Відкрити виконану задачу ${task.title}`}
                    onPress={() => s.openTaskDetail(task.id)}
                    style={({ pressed }) => [styles.recentCompletedCard, pressed && styles.recentCompletedCardPressed]}
                  >
                    <View style={styles.recentCompletedBar} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Активувати задачу ${task.title}`}
                      hitSlop={7}
                      onPress={(event) => {
                        event.stopPropagation();
                        s.toggleComplete(task.id);
                      }}
                      style={({ pressed }) => [styles.recentCompletedCheck, pressed && styles.recentCompletedCheckPressed]}
                    >
                      <CheckCircleIcon size={18} color={palette.badgeGreen} />
                    </Pressable>
                    <View style={styles.recentCompletedBody}>
                      <Text numberOfLines={2} style={styles.recentCompletedTitle}>{task.title}</Text>
                      <View style={styles.recentCompletedMeta}>
                        {timeLabel ? <Text style={styles.recentCompletedTime}>{timeLabel}</Text> : null}
                        {completedDate ? <Text style={styles.lifecycleDate}>Завершено {completedDate}</Text> : null}
                        <CategoryTag name={task.category} color={categoryColor} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {completedToday.length > RECENT_COMPLETED_LIMIT ? (
              <Text style={styles.recentCompletedMore}>Ще {completedToday.length - RECENT_COMPLETED_LIMIT} — у розділі «Виконані» нижче</Text>
            ) : null}
          </View>
        ) : null}

        {activeFilterCount > 0 && visibleTaskCount === 0 ? (
          <View style={styles.filterEmpty}>
            <View style={styles.filterEmptyIcon}><FunnelIcon size={20} color={palette.textFaint} /></View>
            <Text style={styles.filterEmptyTitle}>Немає задач із такими фільтрами</Text>
            <Text style={styles.filterEmptyText}>Змініть пріоритети або категорії, щоб побачити найближчі задачі.</Text>
            <Pressable onPress={s.clearListFilters} style={styles.filterEmptyButton}><Text style={styles.filterEmptyButtonText}>Скинути фільтри</Text></Pressable>
          </View>
        ) : null}

        {groups.map((g) => (
          <View key={g.key} style={{ marginBottom: 22 }}>
            <View style={styles.groupHeading}>
              <View style={styles.groupTitleRow}>
                <Text style={styles.groupLabel}>{g.label}</Text>
                {g.key !== 'noDate' ? (
                  <Text accessibilityLabel={`${g.tasks.length} задач у секції ${g.label}`} style={styles.groupCount}>
                    {g.tasks.length > 99 ? '99+' : g.tasks.length}
                  </Text>
                ) : null}
              </View>
              {g.key === 'today' ? <Text style={styles.groupDate}>{formatDateLabel(new Date())}</Text> : null}
            </View>
            {g.tasks.map((t) => <TaskCard key={t.id} task={t} />)}
          </View>
        ))}

        {overdue.length > 0 ? (
          <View style={{ marginBottom: 22 }}>
            <Pressable
              onPress={s.toggleShowOverdue}
              accessibilityRole="button"
              accessibilityState={{ expanded: s.showOverdue }}
              accessibilityLabel={`Прострочені задачі: ${overdue.length}`}
              style={[styles.completedToggle, styles.overdueToggle]}
            >
              <Text style={[styles.completedToggleText, { color: palette.accent }]}>Прострочені — {overdue.length}</Text>
              <Text style={styles.completedToggleAction}>{s.showOverdue ? 'Сховати' : 'Показати'}</Text>
            </Pressable>
            {s.showOverdue && overdue.length > 0 ? <View style={{ marginTop: 10, gap: 8 }}>{overdue.map((t) => <TaskCard key={t.id} task={t} />)}</View> : null}
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
                  const completedDate = formatTaskEventDate(t.completedAt, false);
                  return (
                    <Pressable key={t.id} onPress={() => s.openTaskDetail(t.id)} style={styles.completedCard}>
                      <Pressable onPress={() => s.toggleComplete(t.id)} style={styles.completedCheckbox}>
                        <Text style={styles.completedCheck}>✓</Text>
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.completedTitle}>{t.title}</Text>
                        <View style={styles.lifecycleMeta}>
                          <CategoryTag name={t.category} color={cat} />
                          {completedDate ? <Text style={styles.lifecycleDate}>Завершено {completedDate}</Text> : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {cancelledCount > 0 ? (
          <View style={{ marginBottom: 22 }}>
            <Pressable
              onPress={s.toggleShowCancelled}
              accessibilityRole="button"
              accessibilityState={{ expanded: s.showCancelled }}
              accessibilityLabel={`Скасовані задачі: ${cancelledCount}`}
              style={[styles.completedToggle, styles.cancelledToggle]}
            >
              <Text style={styles.completedToggleText}>Скасовані — {cancelledCount}</Text>
              <Text style={styles.completedToggleAction}>{s.showCancelled ? 'Сховати' : 'Показати'}</Text>
            </Pressable>
            {s.showCancelled ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                {cancelled.map((task) => {
                  const cat = s.categories[task.category] || palette.textFaint;
                  const cancelledDate = formatTaskEventDate(task.cancelledAt);
                  return (
                    <Pressable key={task.id} onPress={() => s.openTaskDetail(task.id)} style={styles.cancelledCard}>
                      <Pressable
                        onPress={() => s.restoreTask(task.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Відновити задачу ${task.title}`}
                        style={styles.cancelledRestore}
                      >
                        <Text style={styles.cancelledRestoreIcon}>↺</Text>
                      </Pressable>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={styles.cancelledTitle}>{task.title}</Text>
                        <View style={styles.lifecycleMeta}>
                          <CategoryTag name={task.category} color={cat} />
                          {cancelledDate ? <Text style={styles.lifecycleDate}>Скасовано {cancelledDate}</Text> : null}
                        </View>
                      </View>
                      <Text style={styles.restoreLabel}>Відновити</Text>
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { position: 'relative', width: 40, height: 44, borderRadius: 13, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { borderColor: withAlpha(palette.accent, 0.65), backgroundColor: withAlpha(palette.accent, 0.09) },
  filterBadge: { position: 'absolute', top: -5, right: -4, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, overflow: 'hidden', color: palette.white, backgroundColor: palette.accent, fontSize: 9.5, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 14, paddingHorizontal: 14, height: 44, marginBottom: 18 },
  searchInput: { flex: 1, color: palette.text, fontSize: 14, padding: 0 },
  activeFilters: { alignItems: 'center', gap: 7, paddingRight: 14, paddingBottom: 16 },
  filterChip: { maxWidth: 170, minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 11, borderWidth: 1 },
  filterChipDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  filterChipText: { minWidth: 0, color: palette.textSecondary, fontSize: 11.5, fontWeight: '600' },
  filterChipX: { color: palette.textMuted, fontSize: 15, lineHeight: 17 },
  clearFiltersChip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 8 },
  clearFiltersText: { color: palette.accent, fontSize: 11.5, fontWeight: '700' },
  filterEmpty: { alignItems: 'center', marginBottom: 24, paddingVertical: 26, paddingHorizontal: 20, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  filterEmptyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border, marginBottom: 12 },
  filterEmptyTitle: { color: palette.text, fontSize: 14.5, fontWeight: '700', textAlign: 'center' },
  filterEmptyText: { maxWidth: 270, color: palette.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  filterEmptyButton: { minHeight: 44, justifyContent: 'center', marginTop: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: withAlpha(palette.accent, 0.1), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.4) },
  filterEmptyButtonText: { color: palette.accent, fontSize: 12.5, fontWeight: '700' },
  recentCompletedSection: { marginBottom: 22 },
  recentCompletedHeader: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 9 },
  recentCompletedHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 },
  recentCompletedLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.55, textTransform: 'uppercase' },
  recentCompletedCount: { color: palette.textFaint, fontSize: 11.5 },
  recentCompletedList: { gap: 8 },
  recentCompletedCard: { position: 'relative', minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: palette.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: palette.surfaceAltBorder, overflow: 'hidden' },
  recentCompletedCardPressed: { backgroundColor: palette.chip },
  recentCompletedBar: { position: 'absolute', left: 0, top: 13, bottom: 13, width: 3, borderRadius: 2, backgroundColor: palette.borderStrong },
  recentCompletedCheck: { width: 34, height: 44, marginLeft: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(palette.badgeGreen, 0.07), borderWidth: 1, borderColor: withAlpha(palette.badgeGreen, 0.2) },
  recentCompletedCheckPressed: { backgroundColor: withAlpha(palette.badgeGreen, 0.16), borderColor: withAlpha(palette.badgeGreen, 0.38) },
  recentCompletedBody: { flex: 1, minWidth: 0 },
  recentCompletedTitle: { color: palette.textFaint, fontSize: 13.5, lineHeight: 18, fontWeight: '600', textDecorationLine: 'line-through' },
  recentCompletedMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 5, opacity: 0.72 },
  recentCompletedTime: { color: palette.textMuted, backgroundColor: palette.chip, fontSize: 10.5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, overflow: 'hidden' },
  lifecycleMeta: { marginTop: 6, opacity: 0.68, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  lifecycleDate: { color: palette.textMuted, backgroundColor: palette.chip, fontSize: 10.5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, overflow: 'hidden' },
  recentCompletedMore: { color: palette.textFaint, fontSize: 10.5, lineHeight: 15, marginTop: 8, paddingLeft: 2 },
  groupHeading: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  groupTitleRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 7 },
  groupLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  groupCount: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, overflow: 'hidden', color: palette.textSecondary, backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.border, fontSize: 10.5, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  groupDate: { color: palette.textFaint, fontSize: 12, textTransform: 'none', letterSpacing: 0 },
  completedToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.surfaceAltBorder, borderRadius: 14 },
  overdueToggle: { backgroundColor: withAlpha(palette.accent, 0.08), borderColor: withAlpha(palette.accent, 0.3) },
  cancelledToggle: { backgroundColor: palette.surfaceAlt, borderColor: palette.border },
  completedToggleText: { fontSize: 13, color: palette.textMuted },
  completedToggleAction: { fontSize: 12.5, color: palette.accent, fontWeight: '600' },
  completedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: palette.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: palette.surfaceAltBorder },
  completedCheckbox: { width: 24, height: 24, borderRadius: 7, backgroundColor: withAlpha(palette.accent, 0.35), alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
  completedCheck: { color: palette.text, fontSize: 11, lineHeight: 12 },
  completedTitle: { fontSize: 14, fontWeight: '500', color: palette.textFaint, textDecorationLine: 'line-through' },
  cancelledCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: palette.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: palette.surfaceAltBorder, opacity: 0.8 },
  cancelledRestore: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.borderStrong },
  cancelledRestoreIcon: { color: palette.textSecondary, fontSize: 17, lineHeight: 19, fontWeight: '700' },
  cancelledTitle: { color: palette.textFaint, fontSize: 14, fontWeight: '500', textDecorationLine: 'line-through' },
  restoreLabel: { color: palette.textMuted, fontSize: 10.5, fontWeight: '600' },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  fabItem: { position: 'absolute', right: 24, width: 46, height: 46, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.chipBorder, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 9, shadowOffset: { width: 0, height: 6 } },
  textBar: { position: 'absolute', left: 20, right: 20, bottom: 110, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.accent, borderRadius: 16, height: 56, paddingLeft: 16, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 10 } },
  textBarInput: { flex: 1, color: palette.text, fontSize: 15, padding: 0 },
  textBarSubmit: { width: 38, height: 38, borderRadius: 11, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 110, width: 52, height: 52, borderRadius: 16, backgroundColor: palette.accentFab, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.26, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } },
});
