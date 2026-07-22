/**
 * Background "drift" particles — the faint floating diamonds from the v5 mock's
 * z-index:0 layer. CSS keyframes become Animated interpolations: each diamond
 * walks through four waypoints (x/y offset + rotation around 45°) and loops,
 * with a per-particle duration and phase offset so the motion never syncs up.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform, StyleSheet } from 'react-native';

type DriftId = 1 | 2 | 3 | 4;

const DRIFTS: Record<DriftId, { times: number[]; tx: number[]; ty: number[]; rot: number[] }> = {
  1: { times: [0, 0.22, 0.48, 0.74, 1], tx: [0, 24, -16, -34, 0], ty: [0, -28, -48, -10, 0], rot: [45, 54, 38, 60, 45] },
  2: { times: [0, 0.30, 0.55, 0.80, 1], tx: [0, -28, 16, 34, 0], ty: [0, 22, 42, 6, 0], rot: [45, 31, 62, 39, 45] },
  3: { times: [0, 0.18, 0.44, 0.70, 1], tx: [0, 30, 10, -26, 0], ty: [0, 16, -38, 22, 0], rot: [45, 52, 33, 58, 45] },
  4: { times: [0, 0.26, 0.52, 0.78, 1], tx: [0, -24, 28, 12, 0], ty: [0, -24, -10, 30, 0], rot: [45, 62, 28, 50, 45] },
};

interface Spec {
  top: number; left: number; size: number; color: string; drift: DriftId; dur: number; delay: number;
}

// top/left in %, size in px, dur in seconds, delay negative seconds — from the mock.
const PARTICLES: Spec[] = [
  { top: 8, left: 12, size: 10, color: 'rgba(229,57,53,0.22)', drift: 1, dur: 26, delay: 0 },
  { top: 16, left: 78, size: 7, color: 'rgba(154,154,161,0.28)', drift: 2, dur: 32, delay: -6 },
  { top: 26, left: 35, size: 6, color: 'rgba(229,57,53,0.18)', drift: 3, dur: 22, delay: -11 },
  { top: 34, left: 90, size: 12, color: 'rgba(154,154,161,0.16)', drift: 4, dur: 30, delay: -4 },
  { top: 44, left: 6, size: 8, color: 'rgba(229,57,53,0.20)', drift: 2, dur: 28, delay: -14 },
  { top: 52, left: 58, size: 9, color: 'rgba(154,154,161,0.22)', drift: 1, dur: 34, delay: -19 },
  { top: 62, left: 20, size: 6, color: 'rgba(229,57,53,0.24)', drift: 3, dur: 24, delay: -8 },
  { top: 70, left: 82, size: 11, color: 'rgba(154,154,161,0.18)', drift: 4, dur: 27, delay: -2 },
  { top: 80, left: 44, size: 7, color: 'rgba(229,57,53,0.20)', drift: 2, dur: 20, delay: -16 },
  { top: 12, left: 52, size: 5, color: 'rgba(154,154,161,0.24)', drift: 1, dur: 23, delay: -9 },
  { top: 90, left: 14, size: 9, color: 'rgba(229,57,53,0.16)', drift: 3, dur: 31, delay: -21 },
  { top: 6, left: 64, size: 8, color: 'rgba(154,154,161,0.20)', drift: 4, dur: 25, delay: -13 },
  { top: 20, left: 8, size: 7, color: 'rgba(229,57,53,0.20)', drift: 2, dur: 29, delay: -3 },
  { top: 38, left: 70, size: 10, color: 'rgba(154,154,161,0.20)', drift: 1, dur: 21, delay: -17 },
  { top: 58, left: 92, size: 6, color: 'rgba(229,57,53,0.22)', drift: 3, dur: 33, delay: -7 },
  { top: 68, left: 30, size: 9, color: 'rgba(154,154,161,0.18)', drift: 4, dur: 19, delay: -18 },
  { top: 84, left: 66, size: 8, color: 'rgba(229,57,53,0.18)', drift: 2, dur: 24, delay: -10 },
];

function Particle({ spec }: { spec: Spec }) {
  const t = useRef(new Animated.Value(0)).current;
  const d = DRIFTS[spec.drift];
  const durMs = spec.dur * 1000;
  const phase = Math.min(0.999, Math.max(0, -spec.delay / spec.dur));
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    t.setValue(phase);
    const leadIn = Animated.timing(t, { toValue: 1, duration: durMs * (1 - phase), easing: Easing.inOut(Easing.ease), useNativeDriver, isInteraction: false });
    leadIn.start(({ finished }) => {
      if (!finished) return;
      t.setValue(0);
      loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: durMs, easing: Easing.inOut(Easing.ease), useNativeDriver, isInteraction: false }));
      loop.start();
    });
    return () => { t.stopAnimation(); loop?.stop(); };
  }, [t, durMs, phase, useNativeDriver]);

  const translateX = t.interpolate({ inputRange: d.times, outputRange: d.tx });
  const translateY = t.interpolate({ inputRange: d.times, outputRange: d.ty });
  const rotate = t.interpolate({ inputRange: d.times, outputRange: d.rot.map((r) => `${r}deg`) });
  const scale = t.interpolate({ inputRange: d.times, outputRange: [0.92, 1.06, 0.96, 1.03, 0.92] });
  const opacity = t.interpolate({ inputRange: d.times, outputRange: [0.72, 1, 0.82, 0.94, 0.72] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: `${spec.top}%`,
        left: `${spec.left}%`,
        width: spec.size,
        height: spec.size,
        backgroundColor: spec.color,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      }}
    />
  );
}

export default function ParticleField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((spec, i) => <Particle key={i} spec={spec} />)}
    </View>
  );
}
