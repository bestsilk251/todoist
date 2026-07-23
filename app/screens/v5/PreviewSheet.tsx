/** Bottom sheet showing parsed tasks for review before saving. */
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../theme';
import { previewDateLabel } from '../../lib/tasksRepo';
import { parseDurationMinutes } from '../../lib/analyticsMath';
import { useV5 } from './store';
import PreviewDatePicker from './PreviewDatePicker';
import DurationPicker, { formatDurationLabel } from './DurationPicker';

export default function PreviewSheet() {
  const s = useV5();
  const [dateTargetId, setDateTargetId] = useState<string | null>(null);
  const [categoryTargetId, setCategoryTargetId] = useState<string | null>(null);
  const [durationTargetId, setDurationTargetId] = useState<string | null>(null);
  useEffect(() => {
    if (!s.previewOpen) {
      setDateTargetId(null);
      setCategoryTargetId(null);
      setDurationTargetId(null);
    }
  }, [s.previewOpen]);
  if (!s.previewOpen) return null;

  const dateTarget = s.previewTasks.find((task) => task.id === dateTargetId) ?? null;
  const durationTarget = s.previewTasks.find((task) => task.id === durationTargetId) ?? null;

  return (
    <>
      <View style={styles.overlay}>
        <Pressable
          testID="preview-save-backdrop"
          accessibilityRole="button"
          accessibilityLabel="Зберегти задачі, натиснувши поза шторкою"
          accessibilityHint="Виконує ту саму дію, що й кнопка Зберегти всі задачі"
          onPress={s.confirmSave}
          style={({ pressed }) => [styles.saveBackdrop, pressed && styles.saveBackdropPressed]}
        />
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Text style={styles.title}>{s.previewTasks.length ? 'Перевірте задачі' : 'Перевірте команду'}</Text>
            <Text style={styles.subtitle}>Перевірте розпізнані дані перед застосуванням змін.</Text>
          </View>

          {s.previewCommand ? (
            <View style={[styles.commandBanner, s.previewCommand.taskIds.length === 0 && styles.commandBannerEmpty]}>
              <View style={styles.commandIcon}><Text style={styles.commandIconText}>{s.previewCommand.kind === 'shift' ? '↦' : '↶'}</Text></View>
              <View style={styles.commandBody}>
                <Text style={styles.commandEyebrow}>{s.previewCommand.kind === 'shift' ? 'Перенесення розкладу' : 'Звільнення часу'}</Text>
                <Text style={styles.commandSummary}>{s.previewCommand.summary}</Text>
                <Text style={styles.commandHint}>
                  {s.previewCommand.taskIds.length
                    ? 'Команда виконається лише після підтвердження.'
                    : 'У цьому проміжку немає активних задач — інші задачі не зміняться.'}
                </Text>
              </View>
            </View>
          ) : null}

          {s.previewError ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Text style={styles.errorTitle}>Неможливо зберегти задачу</Text>
              <Text style={styles.errorText}>{s.previewError}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {s.previewTasks.map((p) => {
            const editing = s.editingPreviewId === p.id;
            const choosingCategory = categoryTargetId === p.id;
            const cat = s.categories[p.category] || palette.textFaint;
            const cardBorder = editing ? palette.accent : p.needsConfirmation ? palette.accentDeep : palette.border;
            const cardBg = p.needsConfirmation ? withAlpha(palette.accentDeep, 0.14) : palette.surface;
            return (
              <Pressable key={p.id} onPress={() => s.togglePreviewEdit(p.id)} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.cardTop}>
                  {editing ? (
                    <TextInput
                      value={p.title}
                      onChangeText={(v) => s.updatePreviewField(p.id, 'title', v)}
                      autoFocus
                      style={styles.titleInput}
                    />
                  ) : (
                    <Text style={styles.cardTitle}>{p.title}</Text>
                  )}
                  <Pressable onPress={() => s.deletePreviewTask(p.id)} style={styles.deleteBtn}><Text style={styles.deleteX}>✕</Text></Pressable>
                </View>

                <View style={styles.tags}>
                  <Pressable onPress={() => setDateTargetId(p.id)} style={styles.datePill}>
                    <Text style={styles.datePillText}>{previewDateLabel(p.iso)}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${p.time ? 'Змінити' : 'Додати'} час задачі ${p.title}`}
                    onPress={(event) => { event?.stopPropagation?.(); s.openTimePicker(p.id); }}
                    style={[styles.timePill, !p.time && styles.timePillEmpty]}
                  >
                    <Text style={styles.timePillText}>{p.time || 'Додати час'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: durationTargetId === p.id }}
                    accessibilityLabel={`Змінити тривалість задачі ${p.title}`}
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      setDurationTargetId(p.id);
                      setCategoryTargetId(null);
                    }}
                    style={[styles.editablePill, durationTargetId === p.id && styles.editablePillActive]}
                  >
                    <Text style={[styles.editablePillText, durationTargetId === p.id && styles.editablePillTextActive]}>{p.duration || 'Тривалість'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: choosingCategory }}
                    accessibilityLabel={`Змінити категорію задачі ${p.title}`}
                    onPress={(event) => {
                      event?.stopPropagation?.();
                      setCategoryTargetId(choosingCategory ? null : p.id);
                      setDurationTargetId(null);
                    }}
                    style={[styles.categoryPill, { backgroundColor: withAlpha(cat, 0.15), borderColor: choosingCategory ? cat : 'transparent' }]}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: cat }]} />
                    <Text numberOfLines={1} style={[styles.categoryPillText, { color: withAlpha(cat, 0.95) }]}>{p.category}</Text>
                  </Pressable>
                  {p.important ? (
                    <Pressable onPress={() => s.togglePreviewImportant(p.id)} style={styles.importantPill}><Text style={styles.importantText}>{p.priority === 'urgent' ? 'Терміново' : p.priority === 'high' ? 'Високий' : 'Важливо · середній'}</Text></Pressable>
                  ) : null}
                </View>

                {choosingCategory ? (
                  <View style={styles.optionPanel}>
                    <View style={styles.optionPanelHeader}>
                      <View>
                        <Text style={styles.optionPanelTitle}>Категорія</Text>
                        <Text style={styles.optionPanelHint}>Оберіть одну зі своїх категорій</Text>
                      </View>
                      <Pressable onPress={(event) => { event?.stopPropagation?.(); setCategoryTargetId(null); }} style={styles.optionDone}><Text style={styles.optionDoneText}>Закрити</Text></Pressable>
                    </View>
                    <View style={styles.categoryOptions}>
                      {Object.entries(s.categories).map(([category, color]) => {
                        const active = category === p.category;
                        return (
                          <Pressable
                            key={category}
                            accessibilityLabel={`Обрати категорію ${category}`}
                            accessibilityState={{ selected: active }}
                            onPress={(event) => {
                              event?.stopPropagation?.();
                              s.updatePreviewField(p.id, 'category', category);
                              setCategoryTargetId(null);
                            }}
                            style={[styles.categoryOption, active && { borderColor: color, backgroundColor: withAlpha(color, 0.12) }]}
                          >
                            <View style={[styles.categoryOptionDot, { backgroundColor: color }]} />
                            <Text numberOfLines={1} style={[styles.categoryOptionText, active && { color }]}>{category}</Text>
                            {active ? <Text style={[styles.categoryOptionCheck, { color }]}>✓</Text> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {p.needsConfirmation ? (
                  <View style={styles.confirmRow}>
                    <View style={styles.confirmLeft}>
                      <View style={styles.bang}><Text style={styles.bangText}>!</Text></View>
                      <View>
                        <Text style={styles.confirmTitle}>Потрібне уточнення</Text>
                        <Text style={styles.confirmSub}>Оберіть точний час</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => s.openTimePicker(p.id)} style={styles.resolveBtn}><Text style={styles.resolveText}>Обрати</Text></Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={s.cancelPreview} style={styles.cancelBtn}><Text style={styles.cancelText}>Скасувати</Text></Pressable>
            <Pressable onPress={s.confirmSave} style={styles.saveBtn}><Text style={styles.saveText}>{s.previewCommand ? 'Застосувати' : 'Зберегти всі задачі'}</Text></Pressable>
          </View>
        </View>
      </View>
      <PreviewDatePicker
        visible={dateTarget != null}
        value={dateTarget?.iso ?? null}
        onClose={() => setDateTargetId(null)}
        onSelect={(iso) => {
          if (dateTargetId) s.updatePreviewField(dateTargetId, 'iso', iso);
        }}
      />
      <DurationPicker
        visible={durationTarget != null}
        valueMinutes={parseDurationMinutes(durationTarget?.duration ?? '') ?? 60}
        onClose={() => setDurationTargetId(null)}
        onSelect={(minutes) => {
          if (durationTargetId) s.updatePreviewField(durationTargetId, 'duration', formatDurationLabel(minutes));
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 30 },
  saveBackdrop: { flex: 1 },
  saveBackdropPressed: { backgroundColor: 'rgba(255,255,255,0.02)' },
  sheet: { backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: palette.border, maxHeight: '86%' },
  head: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 10 },
  title: { fontSize: 19, fontWeight: '700', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted, marginTop: 4, lineHeight: 18 },
  commandBanner: { marginHorizontal: 20, marginBottom: 8, padding: 12, flexDirection: 'row', gap: 10, borderRadius: 13, backgroundColor: withAlpha(palette.badgeGreen, 0.08), borderWidth: 1, borderColor: withAlpha(palette.badgeGreen, 0.28) },
  commandBannerEmpty: { backgroundColor: palette.surface, borderColor: palette.border },
  commandIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  commandIconText: { color: palette.badgeGreen, fontSize: 20, fontWeight: '700' },
  commandBody: { flex: 1, minWidth: 0 },
  commandEyebrow: { color: palette.badgeGreen, fontSize: 10.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.45 },
  commandSummary: { color: palette.text, fontSize: 12.5, lineHeight: 17, fontWeight: '700', marginTop: 2 },
  commandHint: { color: palette.textMuted, fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  list: { paddingHorizontal: 20, paddingVertical: 6 },
  errorBanner: { marginHorizontal: 20, marginBottom: 4, padding: 12, borderRadius: 12, backgroundColor: withAlpha(palette.accent, 0.1), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.38) },
  errorTitle: { color: palette.accent, fontSize: 12.5, fontWeight: '700' },
  errorText: { color: palette.accentSoftText, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: palette.text, flex: 1 },
  titleInput: { fontSize: 15, fontWeight: '600', color: palette.text, flex: 1, backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.chipBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: palette.chip, alignItems: 'center', justifyContent: 'center' },
  deleteX: { color: palette.textMuted, fontSize: 14 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  datePill: { minHeight: 30, justifyContent: 'center', backgroundColor: withAlpha(palette.accent, 0.08), borderWidth: 1, borderColor: withAlpha(palette.accent, 0.24), paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9 },
  datePillText: { fontSize: 11, color: palette.accent, fontWeight: '600' },
  editablePill: { minHeight: 30, justifyContent: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.border },
  editablePillActive: { borderColor: palette.accent, backgroundColor: withAlpha(palette.accent, 0.09) },
  editablePillText: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
  editablePillTextActive: { color: palette.accent },
  categoryPill: { maxWidth: 160, minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: 1 },
  categoryDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  categoryPillText: { minWidth: 0, fontSize: 11, fontWeight: '600' },
  timePill: { backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.textFainter, borderStyle: 'dashed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  timePillEmpty: { borderColor: withAlpha(palette.accent, 0.48), backgroundColor: withAlpha(palette.accent, 0.07) },
  timePillText: { fontSize: 11, color: palette.text },
  importantPill: { backgroundColor: withAlpha(palette.accent, 0.12), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  importantText: { fontSize: 11, color: palette.accent },
  optionPanel: { marginTop: 11, padding: 11, borderRadius: 13, backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  optionPanelHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  optionPanelTitle: { color: palette.text, fontSize: 13, fontWeight: '700' },
  optionPanelHint: { color: palette.textFaint, fontSize: 10.5, marginTop: 2 },
  optionDone: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: palette.chip },
  optionDoneText: { color: palette.textSecondary, fontSize: 11, fontWeight: '700' },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryOption: { width: '48%', minHeight: 42, flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, borderRadius: 11, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  categoryOptionDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  categoryOptionText: { flex: 1, minWidth: 0, color: palette.textSecondary, fontSize: 11.5, fontWeight: '600' },
  categoryOptionCheck: { fontSize: 12, fontWeight: '800' },
  confirmRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: withAlpha(palette.accent, 0.25), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  confirmLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bang: { width: 16, height: 16, borderRadius: 4, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' },
  bangText: { color: palette.bg, fontSize: 11, fontWeight: '700' },
  confirmTitle: { fontSize: 11.5, color: palette.text, fontWeight: '600' },
  confirmSub: { fontSize: 11.5, color: palette.accentSoftText },
  resolveBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: palette.accent },
  resolveText: { color: palette.text, fontSize: 11.5, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center' },
  cancelText: { color: palette.textMuted, fontSize: 15 },
  saveBtn: { flex: 2, padding: 15, borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center' },
  saveText: { color: palette.text, fontSize: 15, fontWeight: '600' },
});
