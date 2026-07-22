/** Bottom tab bar — five compact destinations that remain usable at 320 pt. */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../theme';
import { useV5, type TabKey } from './store';
import { HomeIcon, ListIcon, CalendarIcon, AnalyticsIcon, ProfileIcon } from '../../components/icons';

const ITEMS: { key: TabKey; label: string; Icon: typeof HomeIcon }[] = [
  { key: 'home', label: 'Головна', Icon: HomeIcon },
  { key: 'list', label: 'Список', Icon: ListIcon },
  { key: 'calendar', label: 'Календар', Icon: CalendarIcon },
  { key: 'analytics', label: 'Аналітика', Icon: AnalyticsIcon },
  { key: 'profile', label: 'Профіль', Icon: ProfileIcon },
];

export default function BottomNav() {
  const s = useV5();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { height: 66 + insets.bottom, paddingBottom: Math.max(insets.bottom, 6) }]}>
      {ITEMS.map(({ key, label, Icon }) => {
        const active = s.activeTab === key;
        const color = active ? palette.accent : palette.textFaint;
        return (
          <Pressable key={key} onPress={() => s.setTab(key)} style={styles.item}>
            <View style={styles.iconWrap}><Icon size={21} color={color} /></View>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: palette.bg, borderTopWidth: 1, borderTopColor: palette.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 54 },
  iconWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10.5, fontWeight: '500' },
});
