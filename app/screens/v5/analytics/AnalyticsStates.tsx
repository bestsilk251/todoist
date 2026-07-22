import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { palette } from '../../../theme';
import { AnalyticsIcon } from '../../../components/icons';

export function AnalyticsSkeleton() {
  return (
    <View accessibilityLabel="Завантаження аналітики" style={styles.skeletonWrap}>
      <View style={styles.skeletonGrid}>{[0, 1, 2, 3].map((item) => <View key={item} style={styles.skeletonCard} />)}</View>
      <View style={styles.skeletonChart} />
      <View style={styles.skeletonShort} />
    </View>
  );
}

export function AnalyticsEmptyState({ detail }: { detail?: string }) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.icon}><AnalyticsIcon size={28} color={palette.accent} /></View>
      <Text style={styles.stateTitle}>Поки що немає даних</Text>
      <Text style={styles.stateText}>{detail ?? 'За цей період ще немає даних. Виконайте кілька задач, щоб побачити аналітику'}</Text>
    </View>
  );
}

export function AnalyticsErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Не вдалося завантажити аналітику</Text>
      <Text style={styles.stateText}>{message ?? 'Перевірте з’єднання та спробуйте ще раз.'}</Text>
      <Pressable onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Повторити</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: { gap: 12 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  skeletonCard: { width: '48.5%', height: 132, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  skeletonChart: { height: 220, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  skeletonShort: { height: 110, borderRadius: 16, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  stateCard: { minHeight: 240, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 16, padding: 28, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 58, height: 58, borderRadius: 18, backgroundColor: 'rgba(229,57,53,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  stateTitle: { color: palette.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  stateText: { color: palette.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  retry: { minWidth: 126, minHeight: 44, backgroundColor: palette.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  retryText: { color: palette.text, fontSize: 14, fontWeight: '700' },
});
