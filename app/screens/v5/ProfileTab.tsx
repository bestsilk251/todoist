/** Profile tab: avatar, stats, level card, badges, grouped settings, logout. */
import React from 'react';
import { Image, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';
import { calculateStreak } from '../../lib/analyticsMath';
import { ScreenHeader } from './ui';
import {
  ProfileIcon, PencilIcon, CheckCircleIcon, FireIcon, StarIcon, PersonHeadIcon, LogoutIcon, CaretRight,
} from '../../components/icons';
import { useAppTheme } from '../../ThemeProvider';

function SettingRow({ label, value, last, onPress }: { label: string; value?: string; last?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.settingRow, !last && styles.settingDivider]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingRight}>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
        <CaretRight size={7} color={palette.textFaint} />
      </View>
    </Pressable>
  );
}

export default function ProfileTab() {
  const s = useV5();
  const { mode } = useAppTheme();
  const completedTasks = s.tasks.filter((task) => task.completed).length;
  const completedAt = s.tasks.flatMap((task) => task.completedAt ? [task.completedAt] : []);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const streakDays = calculateStreak(completedAt, new Date(), timezone);
  const today = new Date();
  const onTimeEligible = s.tasks.filter((task) => task.completedAt && task.dueInDays != null);
  const onTimeCount = onTimeEligible.filter((task) => {
    const due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + task.dueInDays!);
    if (task.time) {
      const [hours, minutes] = task.time.split(':').map(Number);
      due.setHours(hours, minutes, 59, 999);
    } else {
      due.setHours(23, 59, 59, 999);
    }
    return new Date(task.completedAt!).getTime() <= due.getTime();
  }).length;
  const onTimeRate = onTimeEligible.length ? Math.round((onTimeCount / onTimeEligible.length) * 100) : null;
  const xp = completedTasks * 10 + s.sharedTaskCount * 20;
  const level = Math.floor(xp / 500) + 1;
  const levelXp = xp % 500;
  const levelProgress = Math.round((levelXp / 500) * 100);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <ScreenHeader icon={<ProfileIcon size={24} color={palette.accent} />} title="Профіль" />

      <View style={styles.avatarBlock}>
        <View style={styles.avatarWrap}>
          <Pressable onPress={s.openAvatarMenu} style={styles.avatar}>
            {s.avatarUrl
              ? <Image source={{ uri: s.avatarUrl }} resizeMode="cover" style={styles.avatarImage} />
              : <Text style={styles.avatarText}>{s.userInitials}</Text>}
          </Pressable>
          <Pressable onPress={s.openAvatarMenu} style={styles.avatarEdit}><PencilIcon size={13} color={palette.white} /></Pressable>
        </View>
        <Text style={styles.name}>{s.userFullName}</Text>
        <Text style={styles.email}>{s.userEmail}</Text>
      </View>

      <View style={styles.statsWrap}>
        <View style={styles.statCard}>
          <View style={styles.statTop}><CheckCircleIcon size={14} color={palette.badgeGreen} /><Text style={styles.statNum}>{completedTasks}</Text></View>
          <Text style={styles.statLabel}>Виконано за весь час</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statTop}><FireIcon size={14} color={palette.badgeStreak} /><Text style={styles.statNum}>{streakDays}</Text></View>
          <Text style={styles.statLabel}>Днів поспіль</Text>
        </View>
        <View style={styles.statWide}>
          <View style={styles.statWideTop}>
            <View>
              <Text style={styles.statWideLabel}>Вчасно виконано</Text>
              <Text style={styles.statWideSub}>за останні 30 днів</Text>
            </View>
            <Text style={styles.statWidePct}>{onTimeRate == null ? '—' : `${onTimeRate}%`}</Text>
          </View>
          <View style={styles.track}><View style={{ width: `${onTimeRate ?? 0}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 3 }} /></View>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelRow}>
          <LinearGradient colors={[palette.accentLight, palette.accent] as const} start={{ x: 0.2, y: 0.15 }} end={{ x: 0.9, y: 1 }} style={styles.levelIcon}>
            <StarIcon size={20} color={palette.white} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={styles.levelTop}>
              <Text style={styles.levelTitle}>Рівень {level}</Text>
              <Text style={styles.levelXp}>{xp} XP</Text>
            </View>
            <Text style={styles.levelSub}>Залишилось {500 - levelXp} XP до рівня {level + 1}</Text>
          </View>
        </View>
        <View style={[styles.track, { marginTop: 12 }]}><View style={{ width: `${levelProgress}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 3 }} /></View>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Нагороди</Text>
        <Pressable onPress={s.openAchievements} hitSlop={10}><Text style={styles.sectionAction}>Переглянути всі</Text></Pressable>
      </View>
      <View style={styles.card}>
        <View style={[styles.badgeRow, styles.settingDivider]}>
          <View style={[styles.badgeCircle, { backgroundColor: withAlpha(palette.accent, 0.14), borderColor: withAlpha(palette.accent, 0.35) }]}><Text style={{ fontSize: 13, fontWeight: '700', color: palette.accent }}>7</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>7 днів поспіль</Text>
            <Text style={styles.badgeSub}>Виконуйте задачі 7 днів підряд</Text>
          </View>
          <Text style={styles.badgeDate}>{streakDays >= 7 ? 'Отримано' : `${streakDays}/7`}</Text>
        </View>
        <View style={[styles.badgeRow, styles.settingDivider]}>
          <View style={[styles.badgeCircle, { backgroundColor: withAlpha(palette.badgeGold, 0.14), borderColor: withAlpha(palette.badgeGold, 0.4) }]}><Text style={{ fontSize: 12, fontWeight: '700', color: palette.badgeGold }}>50</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>50 виконаних задач</Text>
            <Text style={styles.badgeSub}>Досягніть 50 виконаних задач</Text>
          </View>
          <Text style={styles.badgeDate}>{completedTasks >= 50 ? 'Отримано' : `${completedTasks}/50`}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.badgeCircle, { backgroundColor: withAlpha(palette.badgePurple, 0.14), borderColor: withAlpha(palette.badgePurple, 0.4) }]}><PersonHeadIcon size={16} color={palette.badgePurple} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.badgeTitle}>Командний старт</Text>
            <Text style={styles.badgeSub}>Поділіться задачею з другом</Text>
          </View>
          <Text style={styles.badgeDate}>{s.sharedTaskCount > 0 ? 'Отримано' : '0/1'}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Налаштування</Text>
      <View style={styles.card}>
        <SettingRow label="Сповіщення" value={s.notificationsEnabled ? 'Увімкнено' : 'Вимкнено'} onPress={s.toggleNotifications} />
        <SettingRow label="Вільні вікна" value={s.freeWindowsEnabled ? 'Увімкнено' : 'Вимкнено'} onPress={s.toggleFreeWindows} />
        <SettingRow label="Оформлення" value={mode === 'light' ? 'Світла' : 'Темна'} onPress={s.openAppearance} last />
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Акаунт</Text>
      <View style={styles.card}>
        <SettingRow label="Особисті дані" onPress={s.openPersonalData} />
        <SettingRow label="Безпека" onPress={s.openSecurityInfo} last />
      </View>

      <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Допомога</Text>
      <View style={[styles.card, { marginBottom: 32 }]}>
        <SettingRow label="Як користуватися" value="Гайд" onPress={s.openUsageGuide} />
        <SettingRow label="Про застосунок" onPress={s.openAboutApp} last />
      </View>

      <Pressable onPress={s.openLogoutConfirm} style={styles.logout}>
        <LogoutIcon size={15} color={palette.logout} />
        <Text style={styles.logoutText}>Вийти</Text>
      </Pressable>

      <Text style={styles.version}>Версія 0.1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 110 },
  avatarBlock: { alignItems: 'center', gap: 10, marginBottom: 24 },
  avatarWrap: { width: 80, height: 80 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: palette.chip, borderWidth: 1, borderColor: palette.chipBorder, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarText: { fontSize: 26, fontWeight: '600', color: palette.text },
  avatarEdit: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: palette.accent, borderWidth: 2, borderColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '600', color: palette.text },
  email: { fontSize: 13, color: palette.textMuted },
  statsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 100, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 14, alignItems: 'center' },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  statNum: { fontSize: 19, fontWeight: '700', color: palette.text },
  statLabel: { minHeight: 28, fontSize: 11.5, lineHeight: 14, color: palette.textMuted, marginTop: 3, textAlign: 'center' },
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
