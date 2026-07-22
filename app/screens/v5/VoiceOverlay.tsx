/** Full-screen voice capture overlay: waveform, pulsing mic, controls and a
 * processing spinner. Speech stays private until the confirmation preview. */
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, withAlpha } from '../../theme';
import { useV5 } from './store';
import { MicFilledIcon } from '../../components/icons';

function WaveBar({ index, paused }: { index: number; paused: boolean }) {
  const v = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (paused) { v.stopAnimation(); v.setValue(0.35); return; }
    const dur = 700 + (index % 3) * 150;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: dur / 2, delay: index * 60, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.35, duration: dur / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [paused, index, v]);

  if (paused) return <View style={{ width: 4, height: 8, borderRadius: 2, backgroundColor: palette.priorityLow }} />;
  return <Animated.View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: palette.accent, transform: [{ scaleY: v }] }} />;
}

function RingPulse({ delay, paused }: { delay: number; paused: boolean }) {
  const scale = useRef(new Animated.Value(0.55)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    if (paused) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 2.3, duration: 2000, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 2000, delay, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    );
    const reset = () => { scale.setValue(0.55); opacity.setValue(0.6); };
    reset();
    loop.start();
    return () => loop.stop();
  }, [delay, paused, scale, opacity]);
  if (paused) return null;
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { borderRadius: 60, borderWidth: 1.5, borderColor: withAlpha(palette.accent, 0.55), transform: [{ scale }], opacity }]}
    />
  );
}

function MicOrb({ paused }: { paused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (paused) { scale.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [paused, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <LinearGradient colors={[palette.accentLight, palette.accent] as const} start={{ x: 0.2, y: 0.15 }} end={{ x: 0.9, y: 1 }} style={styles.orb}>
        <MicFilledIcon size={26} color={palette.white} />
      </LinearGradient>
    </Animated.View>
  );
}

function Spinner() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rot]);
  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Svg width={64} height={64} viewBox="0 0 64 64">
        <Path d="M32 4 A28 28 0 0 1 60 32" stroke={palette.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

export default function VoiceOverlay() {
  const s = useV5();
  const recording = s.voiceState === 'recording';
  const processing = s.voiceState === 'processing';
  if (!recording && !processing) return null;

  const mins = String(Math.floor((s.recordSeconds || 0) / 60)).padStart(2, '0');
  const secs = String((s.recordSeconds || 0) % 60).padStart(2, '0');

  return (
    <View style={styles.overlay}>
      {processing ? (
        <>
          <View style={styles.spinnerRing}><Spinner /></View>
          <Text style={styles.processing}>Обробляю запис…</Text>
        </>
      ) : (
        <>
          <Text style={styles.timer}>{`${mins}:${secs}`}</Text>
          <View style={styles.waves}>
            {Array.from({ length: 7 }, (_, i) => <WaveBar key={i} index={i} paused={s.isPaused} />)}
          </View>
          <View style={styles.orbWrap}>
            <RingPulse delay={0} paused={s.isPaused} />
            <RingPulse delay={650} paused={s.isPaused} />
            <RingPulse delay={1300} paused={s.isPaused} />
            <MicOrb paused={s.isPaused} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.listening}>{s.isPaused ? 'Запис призупинено' : 'Говоріть, я слухаю'}</Text>
            <Text style={styles.silenceHint}>Після 5 секунд тиші відкриється підтвердження</Text>
          </View>
          <View style={styles.controls}>
            <Pressable onPress={s.cancelVoice} style={styles.secondaryBtn}><Text style={styles.secondaryText}>Скасувати</Text></Pressable>
            <Pressable onPress={s.togglePauseVoice} style={styles.pauseBtn}>
              {s.isPaused ? (
                <Svg width={16} height={16} viewBox="0 0 24 24"><Path d="M6 4l14 8-14 8V4Z" fill={palette.white} /></Svg>
              ) : (
                <Svg width={16} height={16} viewBox="0 0 24 24"><Rect x={6} y={4} width={4} height={16} rx={1.2} fill={palette.white} /><Rect x={14} y={4} width={4} height={16} rx={1.2} fill={palette.white} /></Svg>
              )}
            </Pressable>
            <Pressable onPress={s.finishVoice} style={styles.finishBtn}><Text style={styles.finishText}>Завершити</Text></Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', gap: 26, zIndex: 20 },
  processing: { fontSize: 15, color: palette.textSecondary, fontWeight: '500' },
  spinnerRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 15, color: palette.textMuted, letterSpacing: 0.5 },
  waves: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36 },
  orbWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  orb: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  listening: { fontSize: 16, color: palette.text, fontWeight: '500' },
  silenceHint: { fontSize: 12, color: palette.textFaint, marginTop: 7, maxWidth: 280, textAlign: 'center' },
  controls: { flexDirection: 'row', gap: 14, marginTop: 8, alignItems: 'center' },
  secondaryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  secondaryText: { color: palette.textMuted, fontSize: 14 },
  pauseBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  finishBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, backgroundColor: palette.accent },
  finishText: { color: palette.white, fontSize: 14, fontWeight: '600' },
});
