import { useLang } from '../context/LanguageContext';
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Modal, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthorization } from '../utils/useAuthorization';
import { useGameStats } from '../hooks/useGameStats';
import { usePlayerProgress, getLevelInfo } from '../hooks/usePlayerProgress';

const AVATARS = ['🎲', '👑', '💎', '🔥', '⚡', '🐋', '🦁', '🐉', '🎯', '🚀', '💀', '🤖', '🧠', '🎰', '🌙', '⚔️'];

interface Profile {
  nickname: string;
  avatar: string;
}

export function ProfileScreen() {
  const { selectedAccount } = useAuthorization();
  const walletAddress = selectedAccount?.publicKey.toBase58() ?? null;
  const { stats } = useGameStats(walletAddress);
  const { progress } = usePlayerProgress(walletAddress);
  const { title: levelTitle, color: levelColor } = getLevelInfo(progress.level);

  const { t } = useLang();
  const [profile, setProfile] = useState<Profile>({ nickname: '', avatar: '🎲' });
  const [editModal, setEditModal] = useState(false);
  const [tempNick, setTempNick] = useState('');
  const [tempAvatar, setTempAvatar] = useState('🎲');
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    if (!walletAddress) return;
    AsyncStorage.getItem(`profile_${walletAddress}`).then(data => {
      if (data) setProfile(JSON.parse(data));
    });
  }, [walletAddress]);

  const saveProfile = useCallback(async () => {
    if (!walletAddress) return;
    const newProfile = { nickname: tempNick.trim() || shortAddr, avatar: tempAvatar };
    setProfile(newProfile);
    await AsyncStorage.setItem(`profile_${walletAddress}`, JSON.stringify(newProfile));
    setEditModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [walletAddress, tempNick, tempAvatar]);

  const openEdit = useCallback(() => {
    setTempNick(profile.nickname);
    setTempAvatar(profile.avatar);
    setEditModal(true);
  }, [profile]);

  const winRate = stats.totalGames > 0
    ? Math.round(stats.totalWins / stats.totalGames * 100) : 0;
  const shortAddr = walletAddress
    ? walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4) : '????';

  if (!selectedAccount) {
    return (
      <View style={styles.connectContainer}>
        <Text style={styles.bigEmoji}>👤</Text>
        <Text style={styles.connectText}>Connect wallet to view profile</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⬡ DICE DUEL</Text>
      <Text style={styles.subtitle}>PROFILE</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + Name Card */}
        <View style={[styles.profileCard, { borderColor: levelColor }]}>
          <Text style={styles.avatar}>{profile.avatar}</Text>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>
              {profile.nickname || shortAddr}
            </Text>
            <Text style={styles.walletAddr}>{shortAddr}</Text>
            <View style={[styles.levelPill, { borderColor: levelColor }]}>
              <Text style={[styles.levelPillText, { color: levelColor }]}>
                LVL {progress.level} · {levelTitle}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={openEdit} style={styles.editBtn}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {saved && (
          <View style={styles.savedBadge}>
            <Text style={styles.savedText}>✓ Profile saved!</Text>
          </View>
        )}

        {/* XP Bar */}
        <View style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>XP PROGRESS</Text>
            <Text style={styles.xpValue}>{progress.xp % 100} / 100</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, {
              width: `${(progress.xp % 100)}%`,
              backgroundColor: levelColor,
            }]} />
          </View>
          <Text style={styles.xpTotal}>Total XP: {progress.xp}</Text>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>LIFETIME STATS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>GAMES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#14F195' }]}>{stats.totalWins}</Text>
            <Text style={styles.statLabel}>WINS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
              {stats.totalGames - stats.totalWins}
            </Text>
            <Text style={styles.statLabel}>LOSSES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#14F195' }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>WIN RATE</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF6B35' }]}>{stats.bestStreak}</Text>
            <Text style={styles.statLabel}>BEST STREAK</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#9945FF' }]}>{stats.bestBalance}</Text>
            <Text style={styles.statLabel}>BEST BALANCE</Text>
          </View>
        </View>

        {/* Achievements preview */}
        <Text style={styles.sectionTitle}>ACHIEVEMENTS ({progress.achievements.filter(a => a.unlocked).length}/{progress.achievements.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achScroll}>
          {progress.achievements.filter(a => a.unlocked).map(a => (
            <View key={a.id} style={styles.achBadge}>
              <Text style={styles.achIcon}>{a.icon}</Text>
              <Text style={styles.achName}>{a.title}</Text>
            </View>
          ))}
          {progress.achievements.filter(a => a.unlocked).length === 0 && (
            <Text style={styles.noAch}>No achievements yet — start playing!</Text>
          )}
        </ScrollView>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>EDIT PROFILE</Text>

            <Text style={styles.modalLabel}>NICKNAME</Text>
            <TextInput
              style={styles.input}
              value={tempNick}
              onChangeText={setTempNick}
              placeholder={shortAddr}
              placeholderTextColor="#333"
              maxLength={16}
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>AVATAR</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setTempAvatar(emoji)}
                  style={[styles.avatarOption, tempAvatar === emoji && styles.avatarOptionActive]}
                >
                  <Text style={styles.avatarEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProfile} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20 },
  connectContainer: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  bigEmoji: { fontSize: 64, marginBottom: 16 },
  connectText: { color: '#555', fontSize: 16, fontWeight: '700' },
  title: { color: '#9945FF', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  subtitle: { color: '#14F195', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 20,
    padding: 20, marginBottom: 12,
    borderWidth: 2, gap: 14,
  },
  avatar: { fontSize: 48 },
  profileInfo: { flex: 1 },
  nickname: { color: '#fff', fontSize: 20, fontWeight: '900' },
  walletAddr: { color: '#555', fontSize: 12, marginTop: 2 },
  levelPill: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginTop: 6,
  },
  levelPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  editBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontSize: 18 },
  savedBadge: {
    backgroundColor: 'rgba(20,241,149,0.12)', borderRadius: 10,
    padding: 10, alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: '#14F195',
  },
  savedText: { color: '#14F195', fontWeight: '700' },
  xpCard: {
    backgroundColor: '#111', borderRadius: 16,
    padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  xpValue: { color: '#fff', fontSize: 11, fontWeight: '700' },
  xpBar: { height: 8, backgroundColor: '#1a1a2e', borderRadius: 4, marginBottom: 6 },
  xpFill: { height: 8, borderRadius: 4 },
  xpTotal: { color: '#444', fontSize: 11 },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: {
    width: '31%', backgroundColor: '#111', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#444', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },
  achScroll: { marginBottom: 20 },
  achBadge: {
    backgroundColor: '#111', borderRadius: 14,
    padding: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFD700',
    marginRight: 8, minWidth: 70,
  },
  achIcon: { fontSize: 24, marginBottom: 4 },
  achName: { color: '#FFD700', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  noAch: { color: '#333', fontSize: 13, paddingVertical: 20 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0d0d1a', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
    borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  modalTitle: { color: '#9945FF', fontSize: 18, fontWeight: '900', letterSpacing: 2, marginBottom: 20 },
  modalLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  input: {
    backgroundColor: '#111', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 16, fontWeight: '700',
    borderWidth: 1.5, borderColor: '#222', marginBottom: 16,
  },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  avatarOption: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#222',
  },
  avatarOptionActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.15)' },
  avatarEmoji: { fontSize: 24 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#111', borderWidth: 1.5, borderColor: '#333', alignItems: 'center',
  },
  cancelBtnText: { color: '#555', fontWeight: '800', fontSize: 14 },
  saveBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#9945FF', alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
