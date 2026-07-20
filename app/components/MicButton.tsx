import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { touch, colors, radius } from '../theme';

interface Props {
  onTranscript: (text: string) => void;
}

/**
 * Voice capture button.
 *
 * On web it uses the browser's built-in SpeechRecognition (Web Speech API,
 * available in Chrome/Edge, supports uk-UA) so voice works in the dev browser
 * with no native module. On native (Expo Go / a future dev build) it stays a
 * stub until expo-speech-recognition is linked. Either way the `onTranscript`
 * contract is the same, so CaptureScreen never changes.
 */
export default function MicButton({ onTranscript }: Props) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const w = globalThis as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'uk-UA';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      if (transcript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    };
  }, [onTranscript]);

  function handlePress() {
    if (Platform.OS !== 'web') {
      // Native STT is wired later via a dev build; no-op for now.
      return;
    }
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch {
        // start() throws if already started; ignore.
      }
    }
  }

  const disabled = Platform.OS === 'web' && !supported;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.button, listening && styles.listening, disabled && styles.disabled]}
      accessibilityLabel={listening ? 'Зупинити запис' : 'Голосовий ввід'}
      accessibilityRole="button"
      testID="mic-button"
    >
      <Text style={styles.icon}>{listening ? '⏹' : '🎤'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touch.iconButton,
    height: touch.iconButton,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listening: { backgroundColor: '#fee2e2', borderColor: colors.danger },
  disabled: { opacity: 0.4 },
  icon: { fontSize: 22 },
});
