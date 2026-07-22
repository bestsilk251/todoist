import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircleIcon, UndoIcon } from '../../components/icons';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';

export default function TaskActionToast() {
  const s = useV5();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const visible = s.undoTaskId != null && s.undoTaskKind != null;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    translateY.setValue(18);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, speed: 22, bounciness: 3, useNativeDriver: true }),
    ]).start();
  }, [visible, s.undoTaskId, s.undoTaskKind, opacity, translateY]);

  if (!visible) return null;

  const completed = s.undoTaskKind === 'completed';
  const message = completed ? 'Завдання виконано' : 'Задачу скасовано';
  const action = completed ? 'Скасувати' : 'Повернути';
  const iconColor = completed ? palette.badgeGreen : palette.accent;

  return (
    <View pointerEvents="box-none" style={[styles.positioner, { bottom: 74 + insets.bottom }]}>
      <Animated.View
        testID="task-action-toast"
        accessibilityRole="alert"
        accessibilityLabel={`${message}. Доступна дія: ${action}`}
        style={[styles.toast, { opacity, transform: [{ translateY }] }]}
      >
        <Pressable
          onPress={s.undoLastAction}
          accessibilityRole="button"
          accessibilityLabel={completed ? 'Скасувати виконання задачі' : 'Повернути скасовану задачу'}
          hitSlop={5}
          style={({ pressed }) => [
            styles.iconWrap,
            { borderColor: withAlpha(iconColor, 0.65), backgroundColor: withAlpha(iconColor, 0.08) },
            pressed && styles.iconPressed,
          ]}
        >
          {completed
            ? <CheckCircleIcon size={25} color={iconColor} />
            : <UndoIcon size={24} color={iconColor} />}
        </Pressable>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88} style={styles.message}>{message}</Text>
        <Pressable
          onPress={s.undoLastAction}
          accessibilityRole="button"
          accessibilityLabel={`${action}: ${message.toLowerCase()}`}
          hitSlop={8}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{action}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 45,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    width: '100%',
    maxWidth: 520,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 19,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: withAlpha(palette.accent, 0.28),
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1.2,
  },
  iconPressed: { opacity: 0.78, transform: [{ scale: 0.94 }] },
  message: { flex: 1, minWidth: 0, color: palette.text, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  actionButton: { minHeight: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 10 },
  actionPressed: { backgroundColor: withAlpha(palette.accent, 0.09) },
  actionText: { color: palette.accentLight, fontSize: 13.5, fontWeight: '700' },
});
