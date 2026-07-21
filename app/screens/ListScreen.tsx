import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import type { Task } from '../types';
import type { TaskGroup } from '../lib/useTasks';
import { colors, spacing, typography, radius } from '../theme';

interface Props {
  dateLabel: string;
  groups: TaskGroup[];
  completed: number;
  total: number;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onPostpone: (task: Task) => void;
  onOpen: (task: Task) => void;
  onGoToProfile: () => void;
  topInset: number;
}

export default function ListScreen(p: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: p.topInset }]}>
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Мої задачі</Text>
          <Text style={styles.date}>{p.dateLabel}</Text>
        </View>
        <Pressable style={styles.profileBtn} onPress={p.onGoToProfile} testID="list-profile">
          <View style={styles.avatarDot} />
        </Pressable>
      </View>

      <View style={styles.progress}>
        <ProgressBar completed={p.completed} total={p.total} />
      </View>

      {p.groups.length === 0 ? (
        <Text style={styles.empty}>Поки що немає задач</Text>
      ) : (
        p.groups.map((grp) => (
          <View key={grp.key} style={styles.group}>
            <Text style={styles.groupLabel}>{grp.label.toUpperCase()}</Text>
            {grp.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => p.onToggle(task)}
                onDelete={() => p.onDelete(task.id)}
                onPostpone={() => p.onPostpone(task)}
                onOpen={() => p.onOpen(task)}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xxl - 2 },
  title: { ...typography.hero, color: colors.text },
  date: { ...typography.label, color: colors.textMuted, marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted },
  progress: { marginBottom: spacing.xxl },
  group: { marginBottom: spacing.xxl - 2 },
  groupLabel: { ...typography.section, color: colors.textMuted, marginBottom: 10 },
  empty: { ...typography.label, color: colors.textFaint, textAlign: 'center', marginTop: spacing.xxl * 2 },
});
