import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, withAlpha } from '../../theme';
import {
  AnalyticsIcon,
  CalendarIcon,
  CheckCircleIcon,
  FireIcon,
  ListIcon,
  MicSimpleIcon,
  PlusIcon,
  ProfileIcon,
  StarIcon,
  TextLinesIcon,
} from '../../components/icons';
import { calculateStreak } from '../../lib/analyticsMath';
import { useV5 } from './store';

const SLIDE_COUNT = 3;

function FeatureRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>{icon}</View>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function GuideIllustration({ page }: { page: number }) {
  if (page === 1) {
    return (
      <View style={styles.illustrationWrap}>
        <View style={[styles.illustrationCard, styles.taskIllustration]}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.miniTaskRow}>
              <View style={[styles.miniCheck, item === 0 && styles.miniCheckDone]}>{item === 0 ? <Text style={styles.miniCheckGlyph}>✓</Text> : null}</View>
              <View style={[styles.miniLine, { width: item === 1 ? '72%' : '58%' }]} />
            </View>
          ))}
        </View>
        <View style={styles.floatingMic}><MicSimpleIcon size={19} color={palette.white} /></View>
      </View>
    );
  }

  if (page === 2) {
    return (
      <View style={styles.illustrationWrap}>
        <View style={[styles.illustrationCard, styles.chartIllustration]}>
          <View style={styles.chartBars}>
            {[18, 30, 24, 42].map((height, index) => <View key={height + index} style={[styles.chartBar, { height }]} />)}
          </View>
          <View style={styles.chartBaseline} />
        </View>
        <View style={styles.floatingStar}><StarIcon size={18} color={palette.badgeGold} /></View>
      </View>
    );
  }

  return (
    <View style={styles.illustrationWrap}>
      <View style={[styles.illustrationCard, styles.welcomeIllustration]}>
        <ListIcon size={39} color={palette.textSecondary} />
        <View style={styles.welcomeCheck}><CheckCircleIcon size={18} color={palette.accent} /></View>
      </View>
      <View style={styles.floatingPlus}><PlusIcon size={14} color={palette.white} /></View>
    </View>
  );
}

function ProgressStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.progressStat}>
      {icon}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.progressLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.progressValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function UsageGuide() {
  const s = useV5();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const compact = width < 360 || height < 720;

  useEffect(() => {
    if (s.usageGuideOpen) setPage(0);
  }, [s.usageGuideOpen]);

  const completedTasks = s.tasks.filter((task) => task.completed).length;
  const streakDays = useMemo(() => calculateStreak(
    s.tasks.flatMap((task) => task.completedAt ? [task.completedAt] : []),
    new Date(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ), [s.tasks]);

  if (!s.usageGuideOpen) return null;

  const slide = [
    {
      eyebrow: 'Перші кроки',
      title: 'Ласкаво просимо',
      subtitle: 'Організовуйте день швидко й без зайвого хаосу.',
      features: [
        { icon: <PlusIcon size={17} color={palette.accent} />, title: 'Створюйте задачі вручну', detail: 'Додавайте нові справи за кілька секунд.' },
        { icon: <MicSimpleIcon size={18} color={palette.accent} />, title: 'Додавайте голосом', detail: 'Швидко фіксуйте ідеї, дати й час.' },
        { icon: <CalendarIcon size={18} color={palette.accent} />, title: 'Плануйте день у календарі', detail: 'Бачте зайнятий час і вільні вікна.' },
      ],
    },
    {
      eyebrow: 'Швидке створення',
      title: 'Додавайте задачі за секунди',
      subtitle: 'Пишіть вручну або диктуйте — застосунок допоможе структурувати задачу.',
      features: [
        { icon: <TextLinesIcon size={18} color={palette.accent} />, title: 'Швидкий ввід', detail: 'Введіть одну або кілька задач звичайним текстом.' },
        { icon: <MicSimpleIcon size={18} color={palette.accent} />, title: 'Голосовий запис', detail: 'Назвіть справу, дату, час і тривалість.' },
        { icon: <CheckCircleIcon size={18} color={palette.accent} />, title: 'Перевірка перед збереженням', detail: 'Відредагуйте розпізнані дані перед додаванням.' },
      ],
    },
    {
      eyebrow: 'Ваш результат',
      title: 'Стежте за прогресом',
      subtitle: 'Переглядайте продуктивність, серії днів і нагороди за виконані задачі.',
      features: [
        { icon: <AnalyticsIcon size={18} color={palette.accent} />, title: 'Аналітика', detail: 'Відстежуйте виконані задачі та продуктивність.' },
        { icon: <FireIcon size={18} color={palette.accent} />, title: 'Нагороди', detail: 'Заробляйте серії днів і відкривайте досягнення.' },
        { icon: <ProfileIcon size={18} color={palette.accent} />, title: 'Особистий прогрес', detail: 'Слідкуйте за рівнем і власними результатами.' },
      ],
    },
  ][page];

  const isLast = page === SLIDE_COUNT - 1;
  const sheetHeight = compact
    ? Math.min(height, Math.max(420, height - Math.max(insets.top, 12) - 8))
    : Math.min(690, height * 0.78);

  return (
    <View
      testID="usage-guide"
      accessibilityViewIsModal
      onAccessibilityEscape={s.closeUsageGuide}
      style={styles.overlay}
    >
      <View style={[styles.sheet, { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.grabber} />
        <ScrollView
          style={styles.bodyScroll}
          contentContainerStyle={[styles.body, compact && styles.bodyCompact]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={[styles.title, compact && styles.titleCompact]}>{slide.title}</Text>
              <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{slide.subtitle}</Text>
            </View>
            <GuideIllustration page={page} />
          </View>

          <View style={[styles.features, compact && styles.featuresCompact]}>
            {slide.features.map((feature) => <FeatureRow key={feature.title} {...feature} />)}
          </View>

          {page === 1 ? (
            <View style={styles.exampleCard}>
              <Text style={styles.exampleLabel}>ПРИКЛАД</Text>
              <Text numberOfLines={1} style={styles.exampleText}>• Купити продукти завтра · 18:00</Text>
              <Text numberOfLines={1} style={styles.exampleText}>• Подзвонити лікарю</Text>
            </View>
          ) : null}

          {page === 2 ? (
            <View style={[styles.progressGrid, width < 370 && styles.progressGridCompact]}>
              <ProgressStat icon={<CheckCircleIcon size={18} color={palette.badgeGreen} />} label="Виконано" value={String(completedTasks)} />
              <ProgressStat icon={<FireIcon size={18} color={palette.badgeStreak} />} label="Днів поспіль" value={String(streakDays)} />
              <ProgressStat icon={<StarIcon size={18} color={palette.badgeGold} />} label="Категорій" value={String(Object.keys(s.categories).length)} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.dots} accessibilityLabel={`Крок ${page + 1} з ${SLIDE_COUNT}`}>
          {Array.from({ length: SLIDE_COUNT }, (_, index) => (
            <View key={index} style={[styles.dot, page === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={page === 0 ? s.closeUsageGuide : () => setPage((current) => current - 1)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText}>{page === 0 ? 'Пропустити' : 'Назад'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={isLast ? s.closeUsageGuide : () => setPage((current) => current + 1)}
            style={styles.primaryPressable}
          >
            <LinearGradient colors={[palette.accent, palette.accentFab] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primaryButton}>
              <Text style={styles.primaryText}>{isLast ? 'Почати' : 'Далі'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 80, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: '#111114', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, borderColor: palette.borderStrong, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: -10 }, elevation: 24 },
  grabber: { width: 38, height: 4, borderRadius: 2, backgroundColor: palette.textFainter, alignSelf: 'center', marginTop: 11, marginBottom: 2 },
  bodyScroll: { flex: 1 },
  body: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14 },
  bodyCompact: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  heroRow: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: palette.accent, fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  title: { color: palette.text, fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5 },
  titleCompact: { fontSize: 24, lineHeight: 29 },
  subtitle: { color: palette.textMuted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  subtitleCompact: { fontSize: 13, lineHeight: 18 },
  illustrationWrap: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  illustrationCard: { width: 78, height: 88, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B1B20', borderWidth: 1, borderColor: palette.borderStrong, transform: [{ rotate: '8deg' }], shadowColor: palette.accent, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  welcomeIllustration: { gap: 8 },
  welcomeCheck: { position: 'absolute', top: 12, right: 10 },
  floatingPlus: { position: 'absolute', right: 2, bottom: 5, width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accent, borderWidth: 2, borderColor: '#111114' },
  taskIllustration: { alignItems: 'stretch', paddingHorizontal: 11, gap: 9 },
  miniTaskRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  miniCheck: { width: 13, height: 13, borderRadius: 4, borderWidth: 1, borderColor: palette.textFaint, alignItems: 'center', justifyContent: 'center' },
  miniCheckDone: { backgroundColor: withAlpha(palette.accent, 0.3), borderColor: palette.accent },
  miniCheckGlyph: { color: palette.accent, fontSize: 8, lineHeight: 9, fontWeight: '900' },
  miniLine: { height: 4, borderRadius: 2, backgroundColor: palette.textFainter },
  floatingMic: { position: 'absolute', right: 0, bottom: 2, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17171B', borderWidth: 1, borderColor: palette.accent },
  chartIllustration: { alignItems: 'stretch', justifyContent: 'flex-end', paddingHorizontal: 13, paddingBottom: 16 },
  chartBars: { height: 48, flexDirection: 'row', alignItems: 'flex-end', gap: 5 },
  chartBar: { flex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: palette.accent },
  chartBaseline: { height: 1, backgroundColor: palette.borderStrong, marginTop: 3 },
  floatingStar: { position: 'absolute', right: 0, bottom: 3, width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2A2015', borderWidth: 1, borderColor: withAlpha(palette.badgeGold, 0.55) },
  features: { gap: 13, marginTop: 22 },
  featuresCompact: { gap: 10, marginTop: 14 },
  featureRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border },
  featureCopy: { flex: 1, minWidth: 0 },
  featureTitle: { color: palette.text, fontSize: 15, lineHeight: 19, fontWeight: '700' },
  featureDetail: { color: palette.textMuted, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  exampleCard: { marginTop: 18, gap: 7, padding: 13, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  exampleLabel: { color: palette.accent, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.8 },
  exampleText: { color: palette.textSecondary, fontSize: 12.5, lineHeight: 17 },
  progressGrid: { flexDirection: 'row', gap: 8, marginTop: 18 },
  progressGridCompact: { flexWrap: 'wrap' },
  progressStat: { flex: 1, minWidth: 98, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, borderRadius: 13, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  progressLabel: { color: palette.textMuted, fontSize: 10.5 },
  progressValue: { color: palette.text, fontSize: 16, lineHeight: 19, fontWeight: '800', marginTop: 1 },
  dots: { height: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.chipBorder },
  dotActive: { width: 11, height: 11, borderRadius: 6, backgroundColor: palette.accent },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 8 },
  secondaryButton: { flex: 0.8, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  secondaryText: { color: palette.textMuted, fontSize: 15, fontWeight: '600' },
  primaryPressable: { flex: 1.45, minHeight: 52, borderRadius: 15, overflow: 'hidden' },
  primaryButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  primaryText: { color: palette.white, fontSize: 16, fontWeight: '800' },
});
