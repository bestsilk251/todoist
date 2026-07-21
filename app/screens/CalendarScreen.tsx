import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <View style={styles.pinLeft} />
        <View style={styles.pinRight} />
        <View style={styles.bar} />
      </View>
      <Text style={styles.title}>Календар</Text>
      <Text style={styles.subtitle}>Цей розділ у розробці</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: 40 },
  icon: { width: 56, height: 56, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.border },
  pinLeft: { position: 'absolute', top: -1.5, left: 12, width: 1.5, height: 10, backgroundColor: colors.textMuted },
  pinRight: { position: 'absolute', top: -1.5, right: 12, width: 1.5, height: 10, backgroundColor: colors.textMuted },
  bar: { position: 'absolute', top: 16, left: 0, right: 0, height: 1.5, backgroundColor: colors.border },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  subtitle: { ...typography.label, color: colors.textMuted },
});
