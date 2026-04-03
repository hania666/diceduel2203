import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

const MISSION_DEFS = [
  { id: 'win_3', title: 'Hot Hands', description: 'Win 3 games', icon: '🔥', target: 3, reward: 150 },
  { id: 'win_5_streak', title: 'On Fire', description: 'Get a 5 win streak', icon: '⚡', target: 5, reward: 300 },
  { id: 'play_10', title: 'Grinder', description: 'Play 10 games', icon: '🎲', reward: 100, target: 10 },
  { id: 'exact_win', title: 'Psychic', description: 'Win with EXACT bet', icon: '🔮', target: 1, reward: 200 },
  { id: 'boss_win', title: 'Boss Slayer', description: 'Win a Boss Round', icon: '⚔️', target: 1, reward: 250 },
  { id: 'double_win', title: 'Gambler', description: 'Win Double or Nothing', icon: '🎰', target: 1, reward: 200 },
  { id: 'win_10', title: 'Dominator', description: 'Win 10 games today', icon: '👑', target: 10, reward: 500 },
];

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function generateDailyMissions(): Mission[] {
  // Каждый день 3 случайные миссии
  const shuffled = [...MISSION_DEFS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map(m => ({
    ...m,
    current: 0,
    completed: false,
    claimed: false,
  }));
}

export function useDailyMissions(walletAddress: string | null) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [totalRewardAvailable, setTotalRewardAvailable] = useState(0);

  const key = walletAddress ? `missions_${walletAddress}_${getTodayKey()}` : null;

  useEffect(() => {
    if (!key) return;
    AsyncStorage.getItem(key).then(data => {
      if (data) {
        setMissions(JSON.parse(data));
      } else {
        const newMissions = generateDailyMissions();
        setMissions(newMissions);
        AsyncStorage.setItem(key, JSON.stringify(newMissions));
      }
    });
  }, [key]);

  useEffect(() => {
    const available = missions
      .filter(m => m.completed && !m.claimed)
      .reduce((sum, m) => sum + m.reward, 0);
    setTotalRewardAvailable(available);
  }, [missions]);

  const updateMissions = useCallback(async (params: {
    won: boolean;
    streak: number;
    betType: string;
    isBoss: boolean;
    doubleWin: boolean;
  }) => {
    if (!key) return 0;
    const { won, streak, betType, isBoss, doubleWin } = params;

    const updated = missions.map(m => {
      if (m.completed) return m;
      let newCurrent = m.current;

      if (m.id === 'win_3' && won) newCurrent++;
      if (m.id === 'win_10' && won) newCurrent++;
      if (m.id === 'win_5_streak') newCurrent = Math.max(newCurrent, streak);
      if (m.id === 'play_10') newCurrent++;
      if (m.id === 'exact_win' && won && betType === 'exact') newCurrent++;
      if (m.id === 'boss_win' && won && isBoss) newCurrent++;
      if (m.id === 'double_win' && doubleWin) newCurrent++;

      const completed = newCurrent >= m.target;
      return { ...m, current: Math.min(newCurrent, m.target), completed };
    });

    setMissions(updated);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return 0;
  }, [missions, key]);

  const claimMission = useCallback(async (missionId: string): Promise<number> => {
    if (!key) return 0;
    const mission = missions.find(m => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) return 0;

    const updated = missions.map(m =>
      m.id === missionId ? { ...m, claimed: true } : m
    );
    setMissions(updated);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return mission.reward;
  }, [missions, key]);

  return { missions, totalRewardAvailable, updateMissions, claimMission };
}
