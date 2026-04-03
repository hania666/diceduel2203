import { useLang } from '../context/LanguageContext';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { PlayerProgress, getLevelInfo } from '../hooks/usePlayerProgress';

interface Props {
  progress: PlayerProgress;
  walletAddress: string | null;
}

export function ProgressScreen({ progress, walletAddress }: Props) {
  const { t } = useLang();
  const [tab, setTab] = useState<'level'|'achievements'>('level');
  const { title, color } = getLevelInfo(progress.level);
  const xpForNext = progress.level * 100;
  const xpInLevel = progress.xp % 100;
  const xpPercent = (xpInLevel / 100) * 100;
  const unlocked = progress.achievements.filter(a => a.unlocked);
  const locked = progress.achievements.filter(a => !a.unlocked);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⬡ DICE DUEL</Text>
      <Text style={styles.subtitle}>{ t('progress') }</Text>

      {/* Level Card */}
      <View style={[styles.levelCard, { borderColor: color }]}>
        <View style={styles.levelLeft}>
          <Text style={[styles.levelBadge, { color }]}>LVL {progress.level}</Text>
          <Text style={[styles.levelTitle, { color }]}>{title}</Text>
        </View>
        <View style={styles.levelRight}>
          <Text style={styles.xpText}>{xpInLevel} / 100 XP</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpPercent}%`, backgroundColor: color }]} />
          </View>
          <Text style={styles.totalXp}>Total XP: {progress.xp}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab('level')}
          style={[styles.tab, tab === 'level' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'level' && styles.tabTextActive]}>
            🏅 ACHIEVEMENTS ({unlocked.length}/{progress.achievements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('achievements')}
          style={[styles.tab, tab === 'achievements' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'achievements' && styles.tabTextActive]}>
            🔒 LOCKED ({locked.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'level' ? (
          <>
            {unlocked.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{ t('noAchievements') }</Text>
                <Text style={styles.emptySub}>{ t('startPlaying') }</Text>
              </View>
            ) : (
              unlocked.map(a => (
                <View key={a.id} style={styles.achievementRow}>
                  <Text style={styles.achievementIcon}>{a.icon}</Text>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{a.title}</Text>
                    <Text style={styles.achievementDesc}>{a.description}</Text>
                  </View>
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementXP}>+50 XP</Text>
                    <Text style={styles.achievementCheck}>✓</Text>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          locked.map(a => (
            <View key={a.id} style={[styles.achievementRow, styles.achievementLocked]}>
              <Text style={[styles.achievementIcon, { opacity: 0.3 }]}>{a.icon}</Text>
              <View style={styles.achievementInfo}>
                <Text style={[styles.achievementTitle, { color: '#444' }]}>{a.title}</Text>
                <Text style={styles.achievementDesc}>{a.description}</Text>
              </View>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          ))
        )}

        {/* XP Guide */}
        <View style={styles.xpGuide}>
          <Text style={styles.xpGuideTitle}>{ t('howToEarnXP') }</Text>
          <Text style={styles.xpGuideItem}>{ t('xpWin') }</Text>
          <Text style={styles.xpGuideItem}>{ t('xpLose') }</Text>
          <Text style={styles.xpGuideItem}>{ t('xpAchievement') }</Text>
          <Text style={styles.xpGuideItem}>{ t('xpDaily') }</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20 },
  title: { color: '#9945FF', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  subtitle: { color: '#14F195', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  levelCard: {
    flexDirection: 'row', backgroundColor: '#111', borderRadius: 20,
    padding: 20, marginBottom: 16, borderWidth: 2, alignItems: 'center',
  },
  levelLeft: { marginRight: 20 },
  levelBadge: { fontSize: 28, fontWeight: '900' },
  levelTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  levelRight: { flex: 1 },
  xpText: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  xpBar: { height: 6, backgroundColor: '#1a1a2e', borderRadius: 3, marginBottom: 6 },
  xpFill: { height: 6, borderRadius: 3 },
  totalXp: { color: '#444', fontSize: 11, fontWeight: '600' },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  tabActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.12)' },
  tabText: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  tabTextActive: { color: '#9945FF' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#333', fontSize: 13, marginTop: 6 },
  achievementRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  achievementLocked: { opacity: 0.6 },
  achievementIcon: { fontSize: 28, marginRight: 14 },
  achievementInfo: { flex: 1 },
  achievementTitle: { color: '#fff', fontWeight: '800', fontSize: 14 },
  achievementDesc: { color: '#444', fontSize: 11, marginTop: 2 },
  achievementBadge: { alignItems: 'center' },
  achievementXP: { color: '#14F195', fontSize: 11, fontWeight: '700' },
  achievementCheck: { color: '#14F195', fontSize: 18, fontWeight: '900' },
  lockIcon: { fontSize: 18 },
  xpGuide: {
    backgroundColor: '#111', borderRadius: 16, padding: 16,
    marginTop: 8, marginBottom: 20, borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  xpGuideTitle: { color: '#555', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  xpGuideItem: { color: '#888', fontSize: 13, marginBottom: 6 },
});
