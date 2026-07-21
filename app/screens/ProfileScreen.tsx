import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography, radius, hairline } from '../theme';

interface Props {
  email: string;
  initials: string;
  name: string;
  completed: number;
  onSignOut: () => void;
  topInset: number;
}

const SETTINGS = ['Сповіщення', 'Тема', 'Про застосунок'];

export default function ProfileScreen(p: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: p.topInset }]}>
      <Text style={styles.title}>Профіль</Text>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{p.initials}</Text>
        </View>
        <Text style={styles.name}>{p.name}</Text>
        <Text style={styles.email}>{p.email}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{p.completed}</Text>
          <Text style={styles.statLabel}>Виконано задач</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.accent }]}>—</Text>
          <Text style={styles.statLabel}>Днів поспіль</Text>
        </View>
      </View>

      <View style={styles.settings}>
        {SETTINGS.map((label, i) => (
          <View key={label} style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingDivider]}>
            <Text style={styles.settingLabel}>{label}</Text>
            <View style={styles.chevron} />
          </View>
        ))}
      </View>

      <Pressable onPress={p.onSignOut} testID="profile-signout">
        <Text style={styles.signOut}>Вийти</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  title: { ...typography.hero, color: colors.text, marginBottom: spacing.xxl },
  identity: { alignItems: 'center', gap: 10, marginBottom: spacing.xxl },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '600', color: colors.text },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  email: { ...typography.small, color: colors.textMuted },
  stats: { flexDirection: 'row', gap: 10, marginBottom: spacing.xxl },
  stat: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  settings: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.xl, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  settingDivider: { borderBottomWidth: hairline, borderBottomColor: colors.border },
  settingLabel: { fontSize: 15, color: colors.text },
  chevron: { width: 8, height: 8, borderRightWidth: 1.5, borderBottomWidth: 1.5, borderColor: colors.textMuted, transform: [{ rotate: '-45deg' }] },
  signOut: { textAlign: 'center', fontSize: 14, color: colors.accentDeep, marginTop: spacing.xl },
});
