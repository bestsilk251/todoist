/** Full-screen task detail with date/category/priority, description and share. */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, priorityColor, priorityLabel, withAlpha } from '../../theme';
import { monthsGen, weekdaysFull, descByCategory } from '../../lib/v5data';
import { useV5 } from './store';
import { ChevronLeftIcon, DotsVerticalIcon, CalendarSlimIcon, FunnelIcon, FlagIcon, PersonPlusIcon, ShareArrowIcon } from '../../components/icons';

export default function TaskDetail() {
  const s = useV5();
  const t = s.tasks.find((x) => x.id === s.taskDetailId);
  if (!t) return null;

  const today = new Date();
  const cat = s.categories[t.category] || palette.textFaint;
  const pColor = priorityColor(t.priority);

  const dObj = new Date(today);
  if (t.dueInDays != null) dObj.setDate(today.getDate() + t.dueInDays);
  const fullDateLabel = t.dueInDays == null ? 'Без дати' : `${dObj.getDate()} ${monthsGen[dObj.getMonth()]} ${dObj.getFullYear()}, ${weekdaysFull[dObj.getDay()]}`;

  let timeRangeLabel = 'Без часу';
  if (t.time) {
    const [h, m] = t.time.split(':').map(Number);
    const end = new Date(0, 0, 0, h, m + 60);
    timeRangeLabel = `${t.time} – ${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  }

  let subtitleLabel: string;
  if (t.dueInDays == null) subtitleLabel = 'Без дати';
  else {
    const base = t.dueInDays === 0 ? 'Сьогодні' : t.dueInDays === 1 ? 'Завтра' : fullDateLabel;
    subtitleLabel = base + (t.time ? ', ' + t.time : '');
  }

  const tag = (fontSize: number) => ({ fontSize, color: withAlpha(cat, 0.95), backgroundColor: withAlpha(cat, 0.15), paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, fontWeight: '600' as const, overflow: 'hidden' as const });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={s.closeTaskDetail} style={styles.hBtn}><ChevronLeftIcon size={17} color={palette.textSecondary} /></Pressable>
        <View style={styles.hBtn}><DotsVerticalIcon size={17} color={palette.textSecondary} /></View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ marginTop: 3 }}><FlagIcon size={20} color={pColor} filled /></View>
          <Text style={styles.title}>{t.title}</Text>
        </View>
        <View style={styles.subRow}>
          <Text style={styles.subtitle}>{subtitleLabel}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={tag(12)}>{t.category}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.infoRow, styles.infoDivider]}>
            <CalendarSlimIcon size={17} color={palette.accent} />
            <View>
              <Text style={styles.infoMain}>{fullDateLabel}</Text>
              <Text style={styles.infoSub}>{timeRangeLabel}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, styles.infoBetween, styles.infoDivider]}>
            <View style={styles.infoLeft}><FunnelIcon size={17} color={palette.textMuted} /><Text style={styles.infoLabel}>Категорія</Text></View>
            <Text style={tag(12)}>{t.category}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoBetween]}>
            <View style={styles.infoLeft}><FlagIcon size={17} color={palette.textMuted} /><Text style={styles.infoLabel}>Пріоритет</Text></View>
            <Text style={{ fontSize: 12, color: pColor, backgroundColor: withAlpha(pColor, 0.15), paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, fontWeight: '600', overflow: 'hidden' }}>{priorityLabel(t.priority)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Опис</Text>
        <Text style={styles.description}>{descByCategory[t.category] || 'Опис відсутній.'}</Text>

        <Pressable onPress={s.openShareSheet} style={styles.shareBtn}>
          <PersonPlusIcon size={19} color={palette.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>Поділитися задачею</Text>
            <Text style={styles.shareSub}>Запросіть інших переглядати або виконувати</Text>
          </View>
          <View style={styles.shareIcon}><ShareArrowIcon size={16} color={palette.white} /></View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: palette.bg, zIndex: 25 },
  header: { paddingTop: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: palette.text, lineHeight: 29, flex: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22, paddingLeft: 30, flexWrap: 'wrap' },
  subtitle: { fontSize: 13.5, color: palette.textMuted },
  dot: { fontSize: 13, color: palette.textFaint },
  infoCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, overflow: 'hidden', marginBottom: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  infoBetween: { justifyContent: 'space-between' },
  infoDivider: { borderBottomWidth: 1, borderBottomColor: palette.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoMain: { fontSize: 14, color: palette.text, fontWeight: '500' },
  infoSub: { fontSize: 12.5, color: palette.textMuted, marginTop: 2 },
  infoLabel: { fontSize: 14, color: palette.text },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 },
  description: { fontSize: 14, color: palette.textSecondary, lineHeight: 22, marginBottom: 24 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16 },
  shareTitle: { fontSize: 14.5, fontWeight: '600', color: palette.text },
  shareSub: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  shareIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
});
