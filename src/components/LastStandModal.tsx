import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';

interface Props {
  visible: boolean;
  points: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function LastStandModal({ visible, points, onAccept, onDecline }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.delay(1500),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, {
          transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
          opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
        }]}>
          <Text style={styles.emoji}>💀</Text>
          <Text style={styles.title}>LAST STAND!</Text>
          <Text style={styles.subtitle}>You're down to {points} points</Text>
          <Text style={styles.desc}>Go all-in for a chance at x5 multiplier</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>YOUR BET</Text>
              <Text style={styles.infoValue}>{points}</Text>
              <Text style={styles.infoSub}>ALL IN</Text>
            </View>
            <View style={styles.infoArrow}>
              <Text style={styles.infoArrowText}>→</Text>
            </View>
            <View style={[styles.infoCard, { borderColor: '#FF6B35' }]}>
              <Text style={styles.infoLabel}>IF YOU WIN</Text>
              <Text style={[styles.infoValue, { color: '#FF6B35' }]}>{points * 5}</Text>
              <Text style={styles.infoSub}>x5 MULT</Text>
            </View>
          </View>

          <Text style={styles.warning}>One shot. Win or lose everything.</Text>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onDecline} style={styles.declineBtn}>
              <Text style={styles.declineBtnText}>🏳️ GIVE UP</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.acceptBtn}>
              <Text style={styles.acceptBtnText}>⚔️ LAST STAND</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#0d0d1a', borderRadius: 24, padding: 28,
    alignItems: 'center', width: '88%',
    borderWidth: 2, borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 20, elevation: 20,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { color: '#FF6B6B', fontSize: 26, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
  subtitle: { color: '#aaa', fontSize: 14, marginBottom: 4 },
  desc: { color: '#555', fontSize: 12, marginBottom: 24, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' },
  infoCard: { flex: 1, backgroundColor: '#111', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#222' },
  infoLabel: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  infoValue: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  infoSub: { color: '#444', fontSize: 10, fontWeight: '700', marginTop: 2 },
  infoArrow: { alignItems: 'center' },
  infoArrowText: { color: '#333', fontSize: 20, fontWeight: '900' },
  warning: { color: '#FF6B35', fontSize: 12, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10, width: '100%' },
  declineBtn: { flex: 1, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#333', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  declineBtnText: { color: '#555', fontWeight: '800', fontSize: 13 },
  acceptBtn: { flex: 1, backgroundColor: '#FF6B6B', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
