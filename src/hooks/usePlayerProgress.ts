import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayerProgress {
  xp: number;
  level: number;
  lastDailyBonus: number;
  achievements: Achievement[];
}

const XP_PER_LEVEL = 100;

const ACHIEVEMENT_DEFS = [
  { id: 'first_win', title: 'First Blood', description: 'Win your first game', icon: '🎯' },
  { id: 'streak_3', title: 'Hot Hands', description: '3 wins in a row', icon: '🔥' },
  { id: 'streak_5', title: 'On Fire', description: '5 wins in a row', icon: '⚡' },
  { id: 'streak_10', title: 'Unstoppable', description: '10 wins in a row', icon: '💎' },
  { id: 'games_10', title: 'Rookie', description: 'Play 10 games', icon: '🎲' },
  { id: 'games_50', title: 'Veteran', description: 'Play 50 games', icon: '🏆' },
  { id: 'games_100', title: 'Legend', description: 'Play 100 games', icon: '👑' },
  { id: 'exact_win', title: 'Psychic', description: 'Win with EXACT bet', icon: '🔮' },
  { id: 'exact_3', title: 'Mind Reader', description: 'Win EXACT 3 times', icon: '🧠' },
  { id: 'boss_win', title: 'Boss Slayer', description: 'Win a Boss Round', icon: '⚔️' },
  { id: 'balance_2x', title: 'Double Up', description: 'Double your starting balance', icon: '💰' },
  { id: 'balance_5x', title: 'Whale', description: '5x your starting balance', icon: '🐋' },
  { id: 'daily_3', title: 'Consistent', description: 'Claim daily bonus 3 days', icon: '📅' },
  { id: 'daily_7', title: 'Dedicated', description: 'Claim daily bonus 7 days', icon: '🗓️' },
];

const DEFAULT_PROGRESS: PlayerProgress = {
  xp: 0,
  level: 1,
  lastDailyBonus: 0,
  achievements: ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: false })),
};

export function getLevelInfo(level: number) {
  const titles = ['Newcomer', 'Rookie', 'Player', 'Gambler', 'Shark', 'Veteran', 'Master', 'Legend', 'Myth', 'God'];
  const colors = ['#888', '#14F195', '#9945FF', '#FFA500', '#FF6B35', '#FF6B6B', '#FFD700', '#14F195', '#9945FF', '#FF6B35'];
  const idx = Math.min(level - 1, titles.length - 1);
  return { title: titles[idx], color: colors[idx] };
}

export function usePlayerProgress(walletAddress: string | null) {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const key = walletAddress ? `progress_${walletAddress}` : null;

  useEffect(() => {
    if (!key) return;
    AsyncStorage.getItem(key).then(data => {
      if (data) {
        const saved = JSON.parse(data);
        // Merge new achievements that might not exist in saved data
        const mergedAchievements = ACHIEVEMENT_DEFS.map(def => {
          const saved_a = saved.achievements?.find((a: Achievement) => a.id === def.id);
          return saved_a || { ...def, unlocked: false };
        });
        setProgress({ ...saved, achievements: mergedAchievements });
      }
    });
  }, [key]);

  const save = useCallback(async (newProgress: PlayerProgress) => {
    if (!key) return;
    setProgress(newProgress);
    await AsyncStorage.setItem(key, JSON.stringify(newProgress));
  }, [key]);

  const addXP = useCallback(async (amount: number) => {
    const newXP = progress.xp + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    await save({ ...progress, xp: newXP, level: newLevel });
  }, [progress, save]);

  const checkAchievements = useCallback(async (params: {
    won: boolean;
    streak: number;
    totalGames: number;
    betType: string;
    isBoss: boolean;
    balance: number;
    exactWins: number;
    dailyDays: number;
  }) => {
    const { won, streak, totalGames, betType, isBoss, balance, exactWins, dailyDays } = params;
    const unlocked: Achievement[] = [];

    const check = (id: string, condition: boolean) => {
      const a = progress.achievements.find(a => a.id === id);
      if (a && !a.unlocked && condition) {
        unlocked.push({ ...a, unlocked: true, unlockedAt: Date.now() });
      }
    };

    check('first_win', won && totalGames >= 1);
    check('streak_3', streak >= 3);
    check('streak_5', streak >= 5);
    check('streak_10', streak >= 10);
    check('games_10', totalGames >= 10);
    check('games_50', totalGames >= 50);
    check('games_100', totalGames >= 100);
    check('exact_win', won && betType === 'exact');
    check('exact_3', exactWins >= 3);
    check('boss_win', won && isBoss);
    check('balance_2x', balance >= 2000);
    check('balance_5x', balance >= 5000);
    check('daily_3', dailyDays >= 3);
    check('daily_7', dailyDays >= 7);

    if (unlocked.length > 0) {
      const newAchievements = progress.achievements.map(a => {
        const u = unlocked.find(u => u.id === a.id);
        return u || a;
      });
      const xpGain = unlocked.length * 50;
      const newXP = progress.xp + xpGain;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      await save({ ...progress, achievements: newAchievements, xp: newXP, level: newLevel });
      setNewAchievements(unlocked);
      setTimeout(() => setNewAchievements([]), 4000);
    }

    // XP за игру
    const xpGain = won ? 15 : 5;
    await addXP(xpGain);

    return unlocked;
  }, [progress, save, addXP]);

  const claimDailyBonus = useCallback(async (): Promise<number | null> => {
    const now = Date.now();
    const lastClaim = progress.lastDailyBonus;
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastClaim < oneDayMs) return null;

    const daysSinceStart = Math.floor((now - (progress.lastDailyBonus || now)) / oneDayMs);
    const bonus = Math.min(50 + daysSinceStart * 10, 200);

    await save({ ...progress, lastDailyBonus: now });
    return bonus;
  }, [progress, save]);

  const canClaimDaily = useCallback(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return now - progress.lastDailyBonus >= oneDayMs;
  }, [progress]);

  return { progress, newAchievements, checkAchievements, claimDailyBonus, canClaimDaily, addXP };
}
