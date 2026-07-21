import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import type { Task } from '../types';
import { groupOf, GROUP_LABELS } from '../lib/useTasks';
import { colors, spacing, typography, radius, touch } from '../theme';

interface Props {
  userName: string;
  dateLabel: string;
  completed: number;
  total: number;
  nearest: Task[];
  quickText: string;
  quickFocused: boolean;
  onQuickChange: (t: string) => void;
  onQuickFocus: () => void;
  onQuickBlur: () => void;
  onSubmitQuick: () => void;
  onOpenMic: () => void;
  onGoToList: () => void;
  onGoToProfile: () => void;
  topInset: number;
}

export default function HomeScreen(p: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.profileBtnWrap, { top: p.topInset }]}>
        <Pressable style={styles.profileBtn} onPress={p.onGoToProfile} testID="home-profile">
          <View style={styles.avatarDot} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
        <View style={styles.greeting}>
          <Text style={styles.hello}>Привіт, {p.userName}</Text>
          <Text style={styles.date}>{p.dateLabel}</Text>
        </View>

        <View style={[styles.quickBox, (p.quickFocused || p.quickText) && styles.quickBoxActive]}>
          <View style={styles.quickRow}>
            <TextInput
              value={p.quickText}
              onChangeText={p.onQuickChange}
              onFocus={p.onQuickFocus}
              onBlur={p.onQuickBlur}
              onSubmitEditing={p.onSubmitQuick}
              placeholder="Що потрібно зробити?"
              placeholderTextColor={colors.textFaint}
              style={styles.quickInput}
              testID="quick-input"
            />
            <Pressable style={styles.micBtn} onPress={p.onOpenMic} testID="quick-mic">
              <Text style={styles.micIcon}>🎤</Text>
            </Pressable>
            <Pressable style={styles.addBtn} onPress={p.onSubmitQuick} testID="quick-add">
              <Text style={styles.addPlus}>＋</Text>
            </Pressable>
          </View>
        </View>

        <ProgressBar completed={p.completed} total={p.total} />

        <Pressable onPress={p.onGoToList} testID="home-view-all">
          <Text style={styles.viewAll}>Переглянути всі задачі →</Text>
        </Pressable>

        <View style={styles.nearest}>
          {p.nearest.map((t) => {
            const when = t.due_time
              ? `${GROUP_LABELS[groupOf(t)]}, ${t.due_time.slice(0, 5)}`
              : GROUP_LABELS[groupOf(t)];
            return (
              <View key={t.id} style={styles.nearestRow}>
                <View style={[styles.dot, { backgroundColor: t.important ? colors.accent : colors.textFaint }]} />
                <Text style={styles.nearestTitle} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={styles.nearestWhen}>{when}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileBtnWrap: { position: 'absolute', right: spacing.xl, zIndex: 2 },
  profileBtn: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl, gap: spacing.lg },
  greeting: { alignItems: 'center' },
  hello: { ...typography.title, color: colors.text },
  date: { ...typography.label, color: colors.textMuted, marginTop: 6 },
  quickBox: { width: '100%', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.xxl, padding: spacing.lg - 2 },
  quickBoxActive: { borderColor: colors.accent },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickInput: { flex: 1, color: colors.text, fontSize: 16, minWidth: 0 },
  micBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 18 },
  addBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  addPlus: { color: colors.text, fontSize: 22, lineHeight: 24, fontWeight: '400' },
  viewAll: { ...typography.small, color: colors.textMuted, padding: 6 },
  nearest: { width: '100%', gap: spacing.sm },
  nearestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nearestTitle: { flex: 1, fontSize: 13.5, color: colors.text },
  nearestWhen: { fontSize: 11.5, color: colors.textMuted },
});
