/** Bottom sheet showing parsed tasks for review before saving. */
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { palette, withAlpha } from '../../theme';
import { previewDateLabel } from '../../lib/tasksRepo';
import { useV5 } from './store';

export default function PreviewSheet() {
  const s = useV5();
  if (!s.previewOpen) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.head}>
          <Text style={styles.title}>Перевірте задачі</Text>
          <Text style={styles.subtitle}>Ми розпізнали декілька задач. Перевірте інформацію перед збереженням.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {s.previewTasks.map((p) => {
            const editing = s.editingPreviewId === p.id;
            const cat = s.categories[p.category] || palette.textFaint;
            const cardBorder = editing ? palette.accent : p.needsConfirmation ? palette.accentDeep : palette.border;
            const cardBg = p.needsConfirmation ? 'rgba(143,29,36,0.28)' : palette.surface;
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
                  <Pressable onPress={() => s.cyclePreviewDate(p.id)} style={styles.pill}><Text style={styles.pillText}>{previewDateLabel(p.iso)}</Text></Pressable>
                  {editing ? (
                    <Pressable onPress={() => s.openTimePicker(p.id)} style={styles.timePill}><Text style={styles.timePillText}>{p.time || 'Час ⏱'}</Text></Pressable>
                  ) : p.time ? (
                    <Text style={styles.pillStatic}>{p.time}</Text>
                  ) : null}
                  {p.duration ? <Text style={styles.pillStatic}>{p.duration}</Text> : null}
                  <Pressable onPress={() => s.cyclePreviewCategory(p.id)} style={{ backgroundColor: withAlpha(cat, 0.15), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: withAlpha(cat, 0.9) }}>{p.category}</Text>
                  </Pressable>
                  {p.important ? (
                    <Pressable onPress={() => s.togglePreviewImportant(p.id)} style={styles.importantPill}><Text style={styles.importantText}>Важливо</Text></Pressable>
                  ) : null}
                </View>

                {p.needsConfirmation ? (
                  <View style={styles.confirmRow}>
                    <View style={styles.confirmLeft}>
                      <View style={styles.bang}><Text style={styles.bangText}>!</Text></View>
                      <View>
                        <Text style={styles.confirmTitle}>Потрібне уточнення</Text>
                        <Text style={styles.confirmSub}>Оберіть точний час</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => s.resolvePreviewTime(p.id)} style={styles.resolveBtn}><Text style={styles.resolveText}>19:00</Text></Pressable>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={s.cancelPreview} style={styles.cancelBtn}><Text style={styles.cancelText}>Скасувати</Text></Pressable>
          <Pressable onPress={s.confirmSave} style={styles.saveBtn}><Text style={styles.saveText}>Зберегти всі задачі</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 30 },
  sheet: { backgroundColor: palette.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: palette.border, maxHeight: '86%' },
  head: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 10 },
  title: { fontSize: 19, fontWeight: '700', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textMuted, marginTop: 4, lineHeight: 18 },
  list: { paddingHorizontal: 20, paddingVertical: 6 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: palette.text, flex: 1 },
  titleInput: { fontSize: 15, fontWeight: '600', color: palette.text, flex: 1, backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.chipBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: palette.chip, alignItems: 'center', justifyContent: 'center' },
  deleteX: { color: palette.textMuted, fontSize: 14 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  pill: { backgroundColor: palette.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, color: palette.textMuted },
  pillStatic: { fontSize: 11, color: palette.textMuted, backgroundColor: palette.chip, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  timePill: { backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.textFainter, borderStyle: 'dashed', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  timePillText: { fontSize: 11, color: palette.text },
  importantPill: { backgroundColor: withAlpha(palette.accent, 0.12), paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  importantText: { fontSize: 11, color: palette.accent },
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
