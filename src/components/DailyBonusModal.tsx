import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';

interface Props {
  visible: boolean;
  bonus: number;
  onClaim: () => void;
}

export function DailyBonusModal({ visible, bonus, onClaim }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.Text style={[styles.giftIcon, { transform: [{ rotate }] }]}>🎁</Animated.Text>
          <Text style={styles.title}>DAILY BONUS!</Text>
          <Text style={styles.subtitle}>Come back every day for bigger rewards</Text>
          <View style={styles.bonusAmount}>
            <Text style={styles.plus}>+</Text>
            <Text style={styles.amount}>{bonus}</Text>
            <Text style={styles.pts}>PTS</Text>
          </View>
          <TouchableOpacity onPress={onClaim} style={styles.claimBtn}>
            <Text style={styles.claimText}>CLAIM BONUS</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0d0d1a', borderRadius: 24,
    padding: 32, alignItems: 'center', width: '80%',
    borderWidth: 2, borderColor: '#FFD700',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  giftIcon: { fontSize: 64, marginBottom: 16 },
  title: {
    color: '#FFD700', fontSize: 24, fontWeight: '900',
    letterSpacing: 3, marginBottom: 8,
  },
  subtitle: { color: '#555', fontSize: 12, textAlign: 'center', marginBottom: 24 },
  bonusAmount: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 28, gap: 4 },
  plus: { color: '#14F195', fontSize: 28, fontWeight: '900', paddingBottom: 4 },
  amount: { color: '#fff', fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  pts: { color: '#555', fontSize: 16, fontWeight: '700', paddingBottom: 10, letterSpacing: 2 },
  claimBtn: {
    backgroundColor: '#FFD700', paddingHorizontal: 40,
    paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center',
  },
  claimText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
