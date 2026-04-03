import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Achievement } from '../hooks/usePlayerProgress';

interface Props {
  achievements: Achievement[];
}

export function AchievementToast({ achievements }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (achievements.length === 0) return;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.delay(2500),
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [achievements]);

  if (achievements.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      {achievements.map(a => (
        <View key={a.id} style={styles.toast}>
          <Text style={styles.icon}>{a.icon}</Text>
          <View>
            <Text style={styles.title}>Achievement Unlocked!</Text>
            <Text style={styles.name}>{a.title}</Text>
            <Text style={styles.desc}>{a.description}</Text>
          </View>
          <Text style={styles.xp}>+50 XP</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 60, left: 20, right: 20, zIndex: 999,
  },
  toast: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a2e', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#FFD700',
    marginBottom: 8, gap: 12,
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 10,
  },
  icon: { fontSize: 28 },
  title: { color: '#FFD700', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  name: { color: '#fff', fontSize: 15, fontWeight: '900' },
  desc: { color: '#888', fontSize: 11, marginTop: 1 },
  xp: { marginLeft: 'auto', color: '#14F195', fontWeight: '900', fontSize: 13 },
});
