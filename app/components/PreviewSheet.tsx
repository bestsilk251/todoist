import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { isoToDisplayDate } from '../lib/dateTime';
import { colors, spacing, typography, radius } from '../theme';

/** A parsed task shown in the confirmation sheet before it is saved. */
export interface PreviewTask {
  key: string;
  title: string;
  date: string | null;
  time: string | null;
  is_all_day: boolean;
  needs_confirmation: boolean;
  category: string;
  important: boolean;
}

interface Props {
  visible: boolean;
  tasks: PreviewTask[];
  onDelete: (key: string) => void;
  onResolve: (key: string) => void;
  onCancel: () => void;
  onSave: () => void;
  bottomInset: number;
}

export default function PreviewSheet({ visible, tasks, onDelete, onResolve, onCancel, onSave, bottomInset }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={styles.head}>
          <Text style={styles.title}>Перевірте задачі</Text>
          <Text style={styles.subtitle}>
            Ми розпізнали {tasks.length === 1 ? 'задачу' : 'декілька задач'}. Перевірте інформацію перед збереженням.
          </Text>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: spacing.sm }}>
          {tasks.map((t) => (
            <View key={t.key} style={[styles.card, t.needs_confirmation && styles.cardFlagged]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{t.title}</Text>
                <Pressable style={styles.del} onPress={() => onDelete(t.key)} testID={`preview-del-${t.key}`}>
                  <Text style={styles.delText}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.chips}>
                {t.date ? <Text style={styles.chip}>{isoToDisplayDate(t.date)}</Text> : null}
                {t.time ? <Text style={styles.chip}>{t.time}</Text> : null}
                <Text style={styles.chip}>{t.category}</Text>
                {t.important ? <Text style={styles.importantChip}>Важливо</Text> : null}
              </View>

              {t.needs_confirmation ? (
                <View style={styles.confirmRow}>
                  <View style={styles.confirmLeft}>
                    <View style={styles.bang}>
                      <Text style={styles.bangText}>!</Text>
                    </View>
                    <View>
                      <Text style={styles.confirmTitle}>Потрібне уточнення</Text>
                      <Text style={styles.confirmHint}>Оберіть точний час</Text>
                    </View>
                  </View>
                  <Pressable style={styles.resolve} onPress={() => onResolve(t.key)} testID={`preview-resolve-${t.key}`}>
                    <Text style={styles.resolveText}>Уточнити</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomInset + spacing.xxl }]}>
          <Pressable style={styles.cancel} onPress={onCancel} testID="preview-cancel">
            <Text style={styles.cancelText}>Скасувати</Text>
          </Pressable>
          <Pressable style={styles.save} onPress={onSave} testID="preview-save">
            <Text style={styles.saveText}>Зберегти всі задачі</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 30,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: 1,
    borderColor: colors.border,
    maxHeight: '86%',
  },
  head: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  list: { paddingHorizontal: spacing.xl },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg - 2, marginBottom: 10 },
  cardFlagged: { backgroundColor: 'rgba(143,29,36,0.28)', borderColor: colors.accentDeep },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  del: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  delText: { color: colors.textMuted, fontSize: 14 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  chip: { ...typography.chip, color: colors.textMuted, backgroundColor: colors.chip, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },
  importantChip: { ...typography.chip, color: colors.accent, backgroundColor: colors.accentDim, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },
  confirmRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(229,57,53,0.25)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  confirmLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  bang: { width: 16, height: 16, borderRadius: 4, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  bangText: { color: colors.surface, fontSize: 11, fontWeight: '700' },
  confirmTitle: { fontSize: 11.5, color: colors.text, fontWeight: '600' },
  confirmHint: { fontSize: 11.5, color: colors.accentText },
  resolve: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.accent },
  resolveText: { fontSize: 11.5, fontWeight: '600', color: colors.text },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  cancel: { flex: 1, paddingVertical: 15, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelText: { fontSize: 15, color: colors.textMuted },
  save: { flex: 2, paddingVertical: 15, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '600', color: colors.text },
});
