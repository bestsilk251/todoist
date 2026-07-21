import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, Easing } from 'react-native';
import { colors, spacing, typography, radius } from '../theme';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onFinish: (transcript: string) => void;
}

function WaveBar({ delay }: { delay: number }) {
  const v = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 400, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.35, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  return <Animated.View style={[styles.bar, { transform: [{ scaleY: v }] }]} />;
}

/**
 * Full-screen voice capture overlay. On web it records via the browser's
 * SpeechRecognition (uk-UA) and returns the transcript on finish. On native it
 * shows the same UI; wiring a native recognizer is a later step.
 */
export default function VoiceOverlay({ visible, onCancel, onFinish }: Props) {
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const w = globalThis as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    transcriptRef.current = '';
    const recognition = new SR();
    recognition.lang = 'uk-UA';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptRef.current += (transcriptRef.current ? ' ' : '') + event.results[i][0].transcript;
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* ignore double-start */
    }
    return () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, [visible]);

  if (!visible) return null;

  function handleFinish() {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    onFinish(transcriptRef.current.trim());
  }

  function handleCancel() {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    onCancel();
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.waves}>
        {[0, 60, 120, 180, 120, 60, 0].map((delay, i) => (
          <WaveBar key={i} delay={delay} />
        ))}
      </View>

      <View style={styles.mic}>
        <View style={styles.micInner} />
      </View>

      <Text style={styles.caption}>
        {supported ? 'Говоріть, я слухаю' : 'Голос недоступний у цьому браузері'}
      </Text>

      <View style={styles.buttons}>
        <Pressable style={styles.cancel} onPress={handleCancel} testID="voice-cancel">
          <Text style={styles.cancelText}>Скасувати</Text>
        </Pressable>
        <Pressable style={styles.finish} onPress={handleFinish} testID="voice-finish">
          <Text style={styles.finishText}>Завершити</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0 as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
    zIndex: 20,
  },
  waves: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36 },
  bar: { width: 4, height: 32, borderRadius: 2, backgroundColor: colors.accent },
  mic: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micInner: { width: 22, height: 22, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: colors.text },
  caption: { ...typography.body, color: colors.text, fontWeight: '500' },
  buttons: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  cancel: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { ...typography.label, color: colors.textMuted },
  finish: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  finishText: { ...typography.label, color: colors.text, fontWeight: '600' },
});
