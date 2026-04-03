import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';

interface Props {
  visible: boolean;
  currentWin: number;
  onDouble: () => void;
  onTake: () => void;
}

export function DoubleOrNothingModal({ visible, currentWin, onDouble, onTake }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.emoji}>🎰</Text>
          <Text style={styles.title}>DOUBLE OR NOTHING?</Text>
          <Text style={styles.subtitle}>Roll again — win double or lose it all</Text>

          <View style={styles.amountRow}>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>CURRENT WIN</Text>
              <Text style={styles.amountValue}>+{currentWin}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.amountCard, { borderColor: '#14F195' }]}>
              <Text style={styles.amountLabel}>IF YOU WIN</Text>
              <Text style={[styles.amountValue, { color: '#14F195' }]}>+{currentWin * 2}</Text>
            </View>
          </View>

          <Text style={styles.risk}>⚠️ Lose = you get nothing</Text>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onTake} style={styles.takeBtn}>
              <Text style={styles.takeBtnText}>✋ TAKE {currentWin}</Text>
            </TouchableOpacity>
            <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
              <TouchableOpacity onPress={onDouble} style={styles.doubleBtn}>
                <Text style={styles.doubleBtnText}>🎲 DOUBLE!</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: '#0d0d1a', borderRadius: 24, padding: 28,
    alignItems: 'center', width: '88%',
    borderWidth: 2, borderColor: '#9945FF',
    shadowColor: '#9945FF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  subtitle: { color: '#555', fontSize: 12, marginBottom: 24, textAlign: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' },
  amountCard: { flex: 1, backgroundColor: '#111', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#222' },
  amountLabel: { color: '#555', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  amountValue: { color: '#9945FF', fontSize: 22, fontWeight: '900', marginTop: 4 },
  arrow: { color: '#333', fontSize: 20, fontWeight: '900' },
  risk: { color: '#FF6B6B', fontSize: 12, fontWeight: '700', marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 10, width: '100%' },
  takeBtn: { flex: 1, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#555', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  takeBtnText: { color: '#aaa', fontWeight: '800', fontSize: 14 },
  doubleBtn: { backgroundColor: '#9945FF', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  doubleBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});
