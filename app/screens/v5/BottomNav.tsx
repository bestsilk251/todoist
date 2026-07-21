/** Bottom tab bar — Головна / Список / Календар / Профіль. */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { palette } from '../../theme';
import { useV5, type TabKey } from './store';
import { HomeIcon, ListIcon, CalendarIcon, ProfileIcon } from '../../components/icons';

const ITEMS: { key: TabKey; label: string; Icon: typeof HomeIcon }[] = [
  { key: 'home', label: 'Головна', Icon: HomeIcon },
  { key: 'list', label: 'Список', Icon: ListIcon },
  { key: 'calendar', label: 'Календар', Icon: CalendarIcon },
  { key: 'profile', label: 'Профіль', Icon: ProfileIcon },
];

export default function BottomNav() {
  const s = useV5();
  return (
    <View style={styles.bar}>
      {ITEMS.map(({ key, label, Icon }) => {
        const active = s.activeTab === key;
        const color = active ? palette.accent : palette.textFaint;
        return (
          <Pressable key={key} onPress={() => s.setTab(key)} style={styles.item}>
            <View style={styles.iconWrap}><Icon size={20} color={color} /></View>
            <Text style={[styles.label, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 78,
    backgroundColor: palette.bg, borderTopWidth: 1, borderTopColor: palette.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingBottom: 8,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 5, width: 64, height: 52 },
  iconWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '500' },
});
