import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { TabKey } from '../types';
import { colors, spacing, hairline } from '../theme';

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  bottomInset: number;
}

const TABS: { key: TabKey; label: string; round?: boolean; dot?: boolean }[] = [
  { key: 'home', label: 'Головна', dot: true },
  { key: 'list', label: 'Список' },
  { key: 'calendar', label: 'Календар' },
  { key: 'profile', label: 'Профіль', round: true },
];

export default function BottomNav({ active, onChange, bottomInset }: Props) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(bottomInset, spacing.sm) }]}>
      {TABS.map((tab) => {
        const on = active === tab.key;
        const tint = on ? colors.accent : colors.textFaint;
        return (
          <Pressable key={tab.key} style={styles.item} onPress={() => onChange(tab.key)} testID={`tab-${tab.key}`}>
            <View style={[styles.icon, { borderColor: tint }, tab.round && styles.iconRound]}>
              {tab.dot ? <View style={[styles.dot, { backgroundColor: tint }]} /> : null}
            </View>
            <Text style={[styles.label, { color: tint }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: hairline,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: { alignItems: 'center', gap: 5, width: 64, paddingTop: 4 },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRound: { borderRadius: 11 },
  dot: { width: 6, height: 6, borderRadius: 1 },
  label: { fontSize: 11, fontWeight: '500' },
});
