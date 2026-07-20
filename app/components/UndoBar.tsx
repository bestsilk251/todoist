import { View, Text, Pressable, StyleSheet } from 'react-native';
import { spacing, touch, typography, colors, radius } from '../theme';

interface Props {
  message: string;
  onUndo: () => void;
  bottomInset: number;
}

/** Floating snackbar with an Undo action, pinned above the home indicator. */
export default function UndoBar({ message, onUndo, bottomInset }: Props) {
  return (
    <View style={[styles.wrap, { bottom: bottomInset + spacing.md }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <Text style={styles.message} numberOfLines={1}>
          {message}
        </Text>
        <Pressable onPress={onUndo} hitSlop={8} testID="undo-button">
          <Text style={styles.action}>Скасувати</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: touch.minTarget,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  message: { ...typography.subhead, color: colors.background, flex: 1 },
  action: { ...typography.callout, color: '#93c5fd', fontWeight: '600' },
});
