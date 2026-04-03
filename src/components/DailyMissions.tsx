import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated,
} from 'react-native';
import { Mission } from '../hooks/useDailyMissions';

interface Props {
  missions: Mission[];
  totalRewardAvailable: number;
  onClaim: (id: string) => Promise<number>;
}

export function DailyMissions({ missions, totalRewardAvailable, onClaim }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [claimedAnim] = useState(new Animated.Value(1));

  const handleClaim = async (id: string) => {
    const reward = await onClaim(id);
    if (reward > 0) {
      Animated.sequence([
        Animated.timing(claimedAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(claimedAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  };

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <>
      {/* Compact bar */}
      <TouchableOpacity onPress={() => setExpanded(true)} style={styles.bar}>
        <Text style={styles.barIcon}>📋</Text>
        <Text style={styles.barText}>DAILY MISSIONS</Text>
        <View style={styles.barProgress}>
          {missions.map((m, i) => (
            <View key={m.id} style={[
              styles.barDot,
              m.completed && styles.barDotDone,
              m.claimed && styles.barDotClaimed,
            ]} />
          ))}
        </View>
        {totalRewardAvailable > 0 && (
          <Animated.View style={[styles.rewardBadge, { transform: [{ scale: claimedAnim }] }]}>
            <Text style={styles.rewardBadgeText}>+{totalRewardAvailable}</Text>
          </Animated.View>
        )}
        <Text style={styles.barArrow}>›</Text>
      </TouchableOpacity>

      {/* Full modal */}
      <Modal visible={expanded} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 DAILY MISSIONS</Text>
              <Text style={styles.modalSub}>{completedCount}/{missions.length} completed</Text>
              <TouchableOpacity onPress={() => setExpanded(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {missions.map(m => (
                <View key={m.id} style={[
                  styles.missionRow,
                  m.completed && !m.claimed && styles.missionRowReady,
                  m.claimed && styles.missionRowClaimed,
                ]}>
                  <Text style={styles.missionIcon}>{m.icon}</Text>
                  <View style={styles.missionInfo}>
                    <Text style={styles.missionTitle}>{m.title}</Text>
                    <Text style={styles.missionDesc}>{m.description}</Text>
                    <View style={styles.progressBar}>
                      <View style={[
                        styles.progressFill,
                        { width: `${Math.min((m.current / m.target) * 100, 100)}%` },
                        m.completed && styles.progressFillDone,
                      ]} />
                    </View>
                    <Text style={styles.progressText}>{m.current}/{m.target}</Text>
                  </View>
                  <View style={styles.missionRight}>
                    <Text style={styles.rewardText}>+{m.reward}</Text>
                    <Text style={styles.rewardPts}>PTS</Text>
                    {m.completed && !m.claimed && (
                      <TouchableOpacity onPress={() => handleClaim(m.id)} style={styles.claimBtn}>
                        <Text style={styles.claimBtnText}>CLAIM</Text>
                      </TouchableOpacity>
                    )}
                    {m.claimed && <Text style={styles.claimedText}>✓ DONE</Text>}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>🔄 Missions reset daily at midnight</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 6, borderWidth: 1.5, borderColor: '#1a1a2e',
    gap: 8,
  },
  barIcon: { fontSize: 14 },
  barText: { color: '#555', fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  barProgress: { flexDirection: 'row', gap: 4 },
  barDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#222' },
  barDotDone: { backgroundColor: '#14F195' },
  barDotClaimed: { backgroundColor: '#444' },
  rewardBadge: {
    backgroundColor: '#FFD700', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  rewardBadgeText: { color: '#000', fontSize: 11, fontWeight: '900' },
  barArrow: { color: '#444', fontSize: 18 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#0d0d1a', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20,
    borderWidth: 1.5, borderColor: '#1a1a2e', maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1, flex: 1 },
  modalSub: { color: '#555', fontSize: 12, marginRight: 12 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#555', fontSize: 16, fontWeight: '900' },
  missionRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16,
    padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#1a1a2e', gap: 12,
  },
  missionRowReady: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.06)' },
  missionRowClaimed: { opacity: 0.5 },
  missionIcon: { fontSize: 28 },
  missionInfo: { flex: 1 },
  missionTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  missionDesc: { color: '#555', fontSize: 11, marginTop: 2, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: '#9945FF', borderRadius: 2 },
  progressFillDone: { backgroundColor: '#14F195' },
  progressText: { color: '#444', fontSize: 10 },
  missionRight: { alignItems: 'center', minWidth: 60 },
  rewardText: { color: '#FFD700', fontSize: 16, fontWeight: '900' },
  rewardPts: { color: '#444', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  claimBtn: {
    backgroundColor: '#FFD700', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 6,
  },
  claimBtnText: { color: '#000', fontSize: 10, fontWeight: '900' },
  claimedText: { color: '#14F195', fontSize: 10, fontWeight: '700', marginTop: 6 },
  footer: { paddingTop: 12, alignItems: 'center' },
  footerText: { color: '#333', fontSize: 11 },
});
