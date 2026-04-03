import { useLang } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { PlayerStats } from '../hooks/useGameStats';
import { useSupabaseLeaderboard } from '../hooks/useSupabaseLeaderboard';

interface Props {
  stats: PlayerStats;
  walletAddress: string | null;
}

export function LeaderboardScreen({ stats, walletAddress }: Props) {
  const { globalLeaderboard, loading, fetchLeaderboard } = useSupabaseLeaderboard();

  // Realtime — обновляем каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => fetchLeaderboard(), 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboard]);
  const { t } = useLang();
  const [tab, setTab] = useState<'global'|'stats'>('global');

  const winRate = stats.totalGames > 0
    ? Math.round(stats.totalWins / stats.totalGames * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⬡ DICE DUEL</Text>
      <Text style={styles.subtitle}>STATS & LEADERBOARD</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab('global')}
          style={[styles.tab, tab === 'global' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'global' && styles.tabTextActive]}>{ t('global') }</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('stats')}
          style={[styles.tab, tab === 'stats' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'stats' && styles.tabTextActive]}>{ t('myStats') }</Text>
        </TouchableOpacity>
      </View>

      {tab === 'global' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchLeaderboard} tintColor="#9945FF" />
          }
        >
          {loading && globalLeaderboard.length === 0 ? (
            <ActivityIndicator color="#9945FF" style={{ marginTop: 40 }} />
          ) : globalLeaderboard.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{ t('noPlayers') }</Text>
              <Text style={styles.emptySub}>Play a game to appear here!</Text>
            </View>
          ) : (
            globalLeaderboard.map((entry, index) => {
              const isMe = entry.wallet_address === walletAddress;
              const medals = ['🥇', '🥈', '🥉'];
              const medal = medals[index] || `#${index + 1}`;
              return (
                <View key={entry.wallet_address}
                  style={[styles.row, isMe && styles.rowMe]}>
                  <Text style={styles.medal}>{medal}</Text>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerAddr, isMe && styles.playerAddrMe]}>
                      {entry.short_address} {isMe ? '← YOU' : ''}
                    </Text>
                    <Text style={styles.playerSub}>
                      {entry.total_games} games · 🔥 {entry.best_streak} streak
                    </Text>
                  </View>
                  <View style={styles.playerRight}>
                    <Text style={styles.playerPoints}>{entry.points.toLocaleString()}</Text>
                    <Text style={styles.playerPtsLabel}>PTS</Text>
                  </View>
                </View>
              );
            })
          )}
          <Text style={styles.pullHint}>{ t('pullRefresh') }</Text>
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalGames}</Text>
              <Text style={styles.statLabel}>{ t('totalGames') }</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#14F195' }]}>{winRate}%</Text>
              <Text style={styles.statLabel}>WIN RATE</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF6B35' }]}>{stats.bestStreak}</Text>
              <Text style={styles.statLabel}>{ t('bestStreak') }</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#9945FF' }]}>{stats.bestBalance}</Text>
              <Text style={styles.statLabel}>{ t('bestBalance') }</Text>
            </View>
            <View style={[styles.statCard, { flex: 2 }]}>
              <Text style={[styles.statValue, { color: '#14F195' }]}>{stats.totalWins}</Text>
              <Text style={styles.statLabel}>{ t('totalWins') }</Text>
            </View>
            <View style={[styles.statCard, { flex: 2 }]}>
              <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                {stats.totalGames - stats.totalWins}
              </Text>
              <Text style={styles.statLabel}>{ t('totalLosses') }</Text>
            </View>
          </View>

          {walletAddress && (
            <View style={styles.walletCard}>
              <Text style={styles.walletLabel}>WALLET</Text>
              <Text style={styles.walletAddr}>{walletAddress}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20 },
  title: { color: '#9945FF', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  subtitle: { color: '#14F195', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  tabActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.12)' },
  tabText: { color: '#555', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  tabTextActive: { color: '#9945FF' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#333', fontSize: 13, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#1a1a2e' },
  rowMe: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.08)' },
  medal: { fontSize: 22, marginRight: 12 },
  playerInfo: { flex: 1 },
  playerAddr: { color: '#fff', fontWeight: '800', fontSize: 14 },
  playerAddrMe: { color: '#9945FF' },
  playerSub: { color: '#444', fontSize: 11, marginTop: 2 },
  playerRight: { alignItems: 'flex-end' },
  playerPoints: { color: '#14F195', fontSize: 18, fontWeight: '900' },
  playerPtsLabel: { color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  pullHint: { color: '#222', fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#111', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#1a1a2e' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#444', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 },
  walletCard: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#1a1a2e' },
  walletLabel: { color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  walletAddr: { color: '#14F195', fontSize: 11, fontWeight: '600' },
});
