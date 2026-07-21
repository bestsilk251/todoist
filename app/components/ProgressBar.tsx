import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

interface Props {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: Props) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{`${completed} з ${total} задач виконано`}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  label: { ...typography.small, color: colors.textMuted, marginBottom: spacing.sm },
  track: { height: 6, backgroundColor: colors.card, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
});
