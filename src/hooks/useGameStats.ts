import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  bestStreak: number;
  totalPoints: number;
  bestBalance: number;
}

export interface LeaderboardEntry {
  address: string;
  shortAddress: string;
  points: number;
  wins: number;
  games: number;
  bestStreak: number;
  timestamp: number;
}

const DEFAULT_STATS: PlayerStats = {
  totalGames: 0,
  totalWins: 0,
  bestStreak: 0,
  totalPoints: 1000,
  bestBalance: 1000,
};

export function useGameStats(walletAddress: string | null) {
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const statsKey = walletAddress ? `stats_${walletAddress}` : null;
  const leaderboardKey = 'global_leaderboard';

  useEffect(() => {
    if (!statsKey) return;
    AsyncStorage.getItem(statsKey).then(data => {
      if (data) setStats(JSON.parse(data));
    });
    AsyncStorage.getItem(leaderboardKey).then(data => {
      if (data) setLeaderboard(JSON.parse(data));
    });
  }, [statsKey]);

  const recordGame = useCallback(async (
    won: boolean,
    currentStreak: number,
    currentBalance: number,
  ) => {
    if (!statsKey || !walletAddress) return;

    const newStats: PlayerStats = {
      totalGames: stats.totalGames + 1,
      totalWins: stats.totalWins + (won ? 1 : 0),
      bestStreak: Math.max(stats.bestStreak, currentStreak),
      totalPoints: currentBalance,
      bestBalance: Math.max(stats.bestBalance, currentBalance),
    };

    setStats(newStats);
    await AsyncStorage.setItem(statsKey, JSON.stringify(newStats));

    const shortAddress = walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
    const entry: LeaderboardEntry = {
      address: walletAddress,
      shortAddress,
      points: currentBalance,
      wins: newStats.totalWins,
      games: newStats.totalGames,
      bestStreak: newStats.bestStreak,
      timestamp: Date.now(),
    };

    const existing = leaderboard.filter(e => e.address !== walletAddress);
    const updated = [...existing, entry]
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);

    setLeaderboard(updated);
    await AsyncStorage.setItem(leaderboardKey, JSON.stringify(updated));
  }, [stats, leaderboard, statsKey, walletAddress]);

  const resetStats = useCallback(async () => {
    if (!statsKey) return;
    setStats(DEFAULT_STATS);
    await AsyncStorage.setItem(statsKey, JSON.stringify(DEFAULT_STATS));
  }, [statsKey]);

  return { stats, leaderboard, recordGame, resetStats };
}
