/** Profile tab: avatar, stats, level card, badges, grouped settings, logout. */
import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';
import {
  ProfileIcon, PencilIcon, CheckCircleIcon, FireIcon, StarIcon, PersonHeadIcon, LogoutIcon, CaretRight,
} from '../../components/icons';

function SettingRow({ label, value, first, last }: { label: string; value?: string; first?: boolean; last?: boolean }) {
  return (
    <View style={[styles.settingRow, !last && styles.settingDivider]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        <CaretRight size={7} color={palette.textFaint} />
      </View>
    </View>
  );
}

export default function ProfileTab() {
  const s = useV5();
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ProfileIcon size={22} color={palette.accent} />
        <Text style={styles.h1}>Профіль</Text>
      </View>

      <View style={styles.avatarBlock}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{s.userInitials}</Text></View>
          <Pressable onPress={s.openAvatarMenu} style={styles.avatarEdit}><PencilIcon size={13} color={palette.white} /></Pressable>
        </View>
        <Text style={styles.name}>{s.userFullName}</Text>
        <Text style={styles.email}>{s.userEmail}</Text>
      </View>

      <View style={styles.statsWrap}>
        <View style={styles.statCard}>
          <View style={styles.statTop}><CheckCircleIcon size={14} color={palette.badgeGreen} /><Text style={styles.statNum}>128</Text></View>
          <Text style={styles.statLabel}>Виконано</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTop}><FireIcon size={14} color={palette.badgeStreak} /><Text style={styles.statNum}>9</Text></View>
          <Text style={styles.statLabel}>Днів поспіль</Text>
        </View>
        <View style={styles.statWide}>
          <View style={styles.statWideTop}>
            <View>
              <Text style={styles.statWideLabel}>Вчасно виконано</Text>
              <Text style={styles.statWideSub}>за останні 30 днів</Text>
            </View>
            <Text style={styles.statWidePct}>78%</Text>
          </View>
          <View style={styles.track}><View style={{ width: '78%', height: '100%', backgroundColor: palette.accent, borderRadius: 3 }} /></View>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelRow}>
          <LinearGradient colors={[palette.accentLight, palette.accent] as const} start={{ x: 0.2, y: 0.15 }} end={{ x: 0.9, y: 1 }} style={styles.levelIcon}>
            <StarIcon size={20} color={palette.white} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={styles.levelTop}>
              <Text style={styles.levelTitle}>Рівень 3</Text>
              <Text style={styles.levelXp}>420 XP</Text>
            </View>
            <Text style={styles.levelSub}>Залишилось 80 XP до рівня 4</Text>
          </View>
        </View>
        <View style={[styles.track, { marginTop: 12 }]}><View style={{ width: '84%', height: '100%', backgroundColor: palette.accent, borderRadius: 3 }} /></View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Нагороди</Text>
        <Text style={styles.sectionAction}>Переглянути всі</Text>
      </View>
      <View style={styles.card}>
        <View style={[styles.badgeRow, styles.settingDivider]}>
          <View style={[styles.badgeCircle, { backgroundColor: withAlpha(palette.accent, 0.14), borderColor: withAlpha(palette.accent, 0.35) }]}><Text style={{ fontSize: 13, fontWeight: '700', color: palette.accent }}>7</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>7 днів поспіль</Text>
            <Text style={styles.badgeSub}>Виконуйте задачі 7 днів підряд</Text>
          </View>
          <Text style={styles.badgeDate}>Отримано{'\n'}18.07.2025</Text>
        </View>
        <View style={[styles.badgeRow, styles.settingDivider]}>
          <View style={[styles.badgeCircle, { backgroundColor: withAlpha(palette.badgeGold, 0.14), borderColor: withAlpha(palette.badgeGold, 0.4) }]}><Text style={{ fontSize: 12, fontWeight: '700', color: palette.badgeGold }}>50</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>50 виконаних задач</Text>
            <Text style={styles.badgeSub}>Досягніть 50 виконаних задач</Text>
          </View>
          <Text style={styles.badgeDate}>Отримано{'\n'}10.07.2025</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.badgeCircle, { backgroundColor: withAlpha(palette.badgePurple, 0.14), borderColor: withAlpha(palette.badgePurple, 0.4) }]}><PersonHeadIcon size={16} color={palette.badgePurple} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>Перша спільна задача</Text>
            <Text style={styles.badgeSub}>Створіть або прийміть спільну задачу</Text>
          </View>
          <Text style={styles.badgeDate}>Отримано{'\n'}05.07.2025</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Налаштування</Text>
      <View style={styles.card}>
        <SettingRow label="Сповіщення" value="Увімкнено" first />
        <SettingRow label="Оформлення" value="Темна" />
        <SettingRow label="Мова" value="Українська" />
        <SettingRow label="Часовий пояс" value="Київ, GMT+2" />
        <SettingRow label="Початок тижня" value="Понеділок" last />
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Акаунт</Text>
      <View style={styles.card}>
        <SettingRow label="Особисті дані" first />
        <SettingRow label="Безпека" />
        <SettingRow label="Експорт даних" last />
      </View>

      <View style={[styles.card, { marginBottom: 32 }]}>
        <SettingRow label="Про застосунок" first last />
      </View>

      <Pressable onPress={s.openLogoutConfirm} style={styles.logout}>
        <LogoutIcon size={15} color={palette.logout} />
        <Text style={styles.logoutText}>Вийти</Text>
      </Pressable>

      <Text style={styles.version}>Версія 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: '700', color: palette.text },
  avatarBlock: { alignItems: 'center', gap: 10, marginBottom: 24 },
  avatarWrap: { width: 80, height: 80 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.chipBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '600', color: palette.text },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: palette.accent, borderWidth: 2, borderColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '600', color: palette.text },
  email: { fontSize: 13, color: palette.textMuted },
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 100, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14, alignItems: 'center' },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  statNum: { fontSize: 19, fontWeight: '700', color: palette.text },
  statLabel: { fontSize: 11.5, color: palette.textMuted, marginTop: 3 },
  statWide: { width: '100%', backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14 },
  statWideTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statWideLabel: { fontSize: 12.5, color: palette.textMuted },
  statWideSub: { fontSize: 11, color: palette.textFaint, marginTop: 1 },
  statWidePct: { fontSize: 13, fontWeight: '600', color: palette.text },
  track: { height: 6, backgroundColor: palette.chip, borderRadius: 3, overflow: 'hidden' },
  levelCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14, marginBottom: 20 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  levelTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  levelXp: { fontSize: 13, fontWeight: '600', color: palette.accent },
  levelSub: { fontSize: 12, color: palette.textMuted, marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionAction: { fontSize: 12.5, color: palette.accent, fontWeight: '600' },
  card: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  settingDivider: { borderBottomWidth: 1, borderBottomColor: palette.border },
  settingLabel: { fontSize: 15, color: palette.text },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 13, color: palette.textMuted },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  badgeCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontSize: 14, fontWeight: '600', color: palette.text },
  badgeSub: { fontSize: 11.5, color: palette.textMuted, marginTop: 1 },
  badgeDate: { fontSize: 11, color: palette.textFaint, textAlign: 'right' },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  logoutText: { fontSize: 14, color: palette.logout },
  version: { textAlign: 'center', fontSize: 12, color: palette.textFainter, marginTop: 20 },
});
