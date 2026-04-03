import { useLang } from '../context/LanguageContext';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRecords } from '../hooks/useRecords';

export function RecordsScreen({ walletAddress }: { walletAddress: string | null }) {
  const { dailyRecords, weeklyRecords, loading, fetchRecords } = useRecords();
  const { t } = useLang();
  const [tab, setTab] = useState<'daily'|'weekly'>('daily');

  const records = tab === 'daily' ? dailyRecords : weeklyRecords;

  const getBetTypeIcon = (betType: string) => {
    if (betType === 'over') return '📈';
    if (betType === 'under') return '📉';
    if (betType === 'exact') return '🎯';
    return '🎲';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>⬡ DICE DUEL</Text>
      <Text style={styles.subtitle}>🏅 RECORDS</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab('daily')}
          style={[styles.tab, tab === 'daily' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'daily' && styles.tabTextActive]}>📅 TODAY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('weekly')}
          style={[styles.tab, tab === 'weekly' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>📆 THIS WEEK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchRecords} tintColor="#9945FF" />
        }
      >
        {loading && records.length === 0 ? (
          <ActivityIndicator color="#9945FF" style={{ marginTop: 40 }} />
        ) : records.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyText}>No records yet</Text>
            <Text style={styles.emptySub}>Be the first to set a record!</Text>
          </View>
        ) : (
          records.map((record, index) => {
            const isMe = record.wallet_address === walletAddress;
            const medals = ['🥇', '🥈', '🥉'];
            const medal = medals[index] || `#${index + 1}`;
            return (
              <View key={record.id} style={[styles.row, isMe && styles.rowMe]}>
                <Text style={styles.medal}>{medal}</Text>
                <View style={styles.info}>
                  <View style={styles.infoTop}>
                    <Text style={[styles.addr, isMe && styles.addrMe]}>
                      {record.short_address} {isMe ? '← YOU' : ''}
                    </Text>
                    {record.is_boss && <Text style={styles.bossBadge}>⚡ BOSS</Text>}
                  </View>
                  <Text style={styles.infoSub}>
                    {getBetTypeIcon(record.bet_type)} {record.bet_type.toUpperCase()} · x{record.multiplier}
                  </Text>
                </View>
                <View style={styles.winAmount}>
                  <Text style={styles.winValue}>+{record.win_amount}</Text>
                  <Text style={styles.winLabel}>PTS</Text>
                </View>
              </View>
            );
          })
        )}
        <Text style={styles.pullHint}>↓ Pull to refresh</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20 },
  title: { color: '#9945FF', fontSize: 20, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  subtitle: { color: '#14F195', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  tabActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.08)' },
  tabText: { color: '#555', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  tabTextActive: { color: '#FFD700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#555', fontSize: 16, fontWeight: '700' },
  emptySub: { color: '#333', fontSize: 13, marginTop: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#111', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: '#1a1a2e',
  },
  rowMe: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.08)' },
  medal: { fontSize: 22, marginRight: 12 },
  info: { flex: 1 },
  infoTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addr: { color: '#fff', fontWeight: '800', fontSize: 14 },
  addrMe: { color: '#9945FF' },
  bossBadge: { backgroundColor: 'rgba(255,165,0,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, color: '#FFA500', fontSize: 10, fontWeight: '800' },
  infoSub: { color: '#444', fontSize: 11, marginTop: 3 },
  winAmount: { alignItems: 'flex-end' },
  winValue: { color: '#14F195', fontSize: 20, fontWeight: '900' },
  winLabel: { color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  pullHint: { color: '#222', fontSize: 11, textAlign: 'center', marginTop: 8, marginBottom: 20 },
});
