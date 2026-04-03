import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, SafeAreaView, Vibration,
} from 'react-native';
import { useAuthorization } from '../utils/useAuthorization';
import { SignInFeature } from '../components/sign-in/sign-in-feature';
import { useGameStats } from '../hooks/useGameStats';
import { useSupabaseLeaderboard } from '../hooks/useSupabaseLeaderboard';
import { useRecords } from '../hooks/useRecords';
import { usePlayerProgress, getLevelInfo } from '../hooks/usePlayerProgress';
import { useLang } from '../context/LanguageContext';
import { AchievementToast } from '../components/AchievementToast';
import { DailyBonusModal } from '../components/DailyBonusModal';
import { DoubleOrNothingModal } from '../components/DoubleOrNothingModal';
import { LastStandModal } from '../components/LastStandModal';
import { LiveFeed } from '../components/LiveFeed';
import { DailyMissions } from '../components/DailyMissions';
import { useDailyMissions } from '../hooks/useDailyMissions';

const STARTING_POINTS = 1000;
const LAST_STAND_THRESHOLD = 100;
const BET_OPTIONS = [10, 25, 50, 100, 250];
const BET_TYPES = [
  { id: 'over', label: 'OVER 3', description: 'Roll 4-6', multiplier: 2 },
  { id: 'under', label: 'UNDER 4', description: 'Roll 1-3', multiplier: 2 },
  { id: 'exact', label: 'EXACT', description: 'Guess number', multiplier: 6 },
];
const BOT_NAMES = ['SolanaBot', 'CryptoKing', 'DiceGod', 'LuckySOL', 'WhaleHunter'];

const DOTS: Record<number, [number, number][]> = {
  1: [[1,1]],
  2: [[0,0],[2,2]],
  3: [[0,0],[1,1],[2,2]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
};

function DiceFace({ value, size = 120, slowRoll = false }: { value: number; size?: number; slowRoll?: boolean }) {
  const dots = DOTS[value] || DOTS[1];
  const dotSize = size * 0.16;
  const gridSize = size * 0.65;
  const dotAnims = useRef(
    Array(9).fill(null).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (slowRoll) {
      dotAnims.forEach(a => a.setValue(0));
      const activeDots = dots;
      let delay = 0;
      [0,1,2].forEach(row => [0,1,2].forEach(col => {
        const idx = row * 3 + col;
        const hasDot = activeDots.some(([r,c]) => r === row && c === col);
        if (hasDot) {
          setTimeout(() => {
            Animated.spring(dotAnims[idx], { toValue: 1, friction: 4, useNativeDriver: true }).start();
          }, delay);
          delay += 200;
        }
      }));
    } else {
      dotAnims.forEach(a => a.setValue(1));
    }
  }, [value, slowRoll]);

  return (
    <View style={[diceStyles.dice, { width: size, height: size, borderRadius: size * 0.18 }]}>
      <View style={[diceStyles.grid, { width: gridSize, height: gridSize }]}>
        {[0,1,2].map(row => [0,1,2].map(col => {
          const idx = row * 3 + col;
          const hasDot = dots.some(([r,c]) => r === row && c === col);
          return (
            <View key={`${row}-${col}`} style={{ width: gridSize/3, height: gridSize/3, alignItems:'center', justifyContent:'center' }}>
              {hasDot && (
                <Animated.View style={[
                  diceStyles.dot,
                  { width: dotSize, height: dotSize, borderRadius: dotSize/2 },
                  { transform: [{ scale: dotAnims[idx] }], opacity: dotAnims[idx] }
                ]} />
              )}
            </View>
          );
        }))}
      </View>
    </View>
  );
}

const diceStyles = StyleSheet.create({
  dice: {
    backgroundColor: '#1a1a2e', borderWidth: 2, borderColor: '#9945FF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#9945FF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 20, elevation: 20,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dot: {
    backgroundColor: '#14F195',
    shadowColor: '#14F195', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 6,
  },
});

export function GameScreen() {
  const { selectedAccount } = useAuthorization();
  const walletAddress = selectedAccount?.publicKey.toBase58() ?? null;
  const { stats, recordGame } = useGameStats(walletAddress);
  const { updateScore } = useSupabaseLeaderboard();
  const { addRecord } = useRecords();
  const { t } = useLang();
  const { progress, newAchievements, checkAchievements, claimDailyBonus, canClaimDaily } = usePlayerProgress(walletAddress);
  const { missions, totalRewardAvailable, updateMissions, claimMission } = useDailyMissions(walletAddress);

  const [points, setPoints] = useState(STARTING_POINTS);
  const [bet, setBet] = useState(25);
  const [betType, setBetType] = useState('over');
  const [exactGuess, setExactGuess] = useState(4);
  const [diceValue, setDiceValue] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [slowRollActive, setSlowRollActive] = useState(false);
  const [result, setResult] = useState<'win'|'lose'|null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalRolls, setTotalRolls] = useState(0);
  const [exactWins, setExactWins] = useState(0);
  const [isBossRound, setIsBossRound] = useState(false);
  const [bossResult, setBossResult] = useState<string | null>(null);
  const [duelMode, setDuelMode] = useState(false);
  const [botName] = useState(BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [botDice, setBotDice] = useState(1);
  const [duelResult, setDuelResult] = useState<'win'|'lose'|'draw'|null>(null);
  const [dailyBonus, setDailyBonus] = useState<number | null>(null);
  const [showDailyModal, setShowDailyModal] = useState(false);

  // Double or Nothing
  const [showDoubleModal, setShowDoubleModal] = useState(false);
  const [pendingWin, setPendingWin] = useState(0);
  const [isDoubleRoll, setIsDoubleRoll] = useState(false);

  // Last Stand
  const [showLastStand, setShowLastStand] = useState(false);
  const [lastStandMode, setLastStandMode] = useState(false);
  const [lastStandUsed, setLastStandUsed] = useState(false);

  // Hot Streak protection
  const [streakProtected, setStreakProtected] = useState(false);
  const [protectionUsed, setProtectionUsed] = useState(false);

  const resultOpacity = useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bossAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    setTimeout(() => { if (canClaimDaily()) setShowDailyModal(true); }, 1000);
  }, [walletAddress]);

  // Show Last Stand when points are low
  useEffect(() => {
    if (points <= LAST_STAND_THRESHOLD && points > 0 && !lastStandUsed && !showLastStand && !rolling) {
      setTimeout(() => setShowLastStand(true), 500);
    }
  }, [points]);

  // Hot streak protection offer
  useEffect(() => {
    if (streak === 5 && !protectionUsed && !streakProtected) {
      setStreakProtected(false);
    }
  }, [streak]);

  const handleClaimDaily = useCallback(async () => {
    const bonus = await claimDailyBonus();
    if (bonus) { setPoints(prev => prev + bonus); setDailyBonus(bonus); }
    setShowDailyModal(false);
  }, [claimDailyBonus]);

  const showResultAnim = useCallback(() => {
    Animated.parallel([
      Animated.spring(resultOpacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(resultScale, { toValue: 1, friction: 4, tension: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const { title: levelTitle, color: levelColor } = getLevelInfo(progress.level);

  const executeRoll = useCallback(async (currentBet: number, currentBetType: string, multiplierOverride?: number) => {
    resultOpacity.setValue(0);
    resultScale.setValue(0.5);

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 120, useNativeDriver: true }),
      ]), { iterations: 7 }
    ).start();

    intervalRef.current = setInterval(() => {
      setDiceValue(Math.ceil(Math.random() * 6));
      if (duelMode) setBotDice(Math.ceil(Math.random() * 6));
    }, 100);

    return new Promise<{ final: number; won: boolean; delta: number }>((resolve) => {
      setTimeout(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; };
        const final = Math.ceil(Math.random() * 6);
        const botFinal = Math.ceil(Math.random() * 6);

        setRolling(false);
        scaleAnim.stopAnimation();

        // Slow roll — reveal dots one by one
        setSlowRollActive(true);
        setDiceValue(final);
        if (duelMode) setBotDice(botFinal);

        setTimeout(() => setSlowRollActive(false), 1500);

        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();

        let won = false;
        let multiplier = multiplierOverride || BET_TYPES.find(b => b.id === currentBetType)!.multiplier;

        if (duelMode) {
          const dRes = final > botFinal ? 'win' : final < botFinal ? 'lose' : 'draw';
          setDuelResult(dRes);
          won = dRes === 'win';
          if (dRes === 'draw') { resolve({ final, won: false, delta: 0 }); return; }
          multiplier = 2;
        } else {
          if (currentBetType === 'over') won = final > 3;
          else if (currentBetType === 'under') won = final < 4;
          else if (currentBetType === 'exact') won = final === exactGuess;
        }

        const delta = won ? Math.floor(currentBet * (multiplier - 1)) : -currentBet;
        resolve({ final, won, delta });
      }, 1800);
    });
  }, [duelMode, exactGuess, scaleAnim]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  const rollDice = useCallback(async () => {
    if (rolling || bet > points) return;
    setRolling(true);
    const safetyTimer = setTimeout(() => setRolling(false), 6000);
    setResult(null);
    setDuelResult(null);
    setBossResult(null);

    const nextRoll = totalRolls + 1;
    const isBoss = nextRoll % 10 === 0;
    setIsBossRound(isBoss);

    if (isBoss) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bossAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(bossAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]), { iterations: 5 }
      ).start();
    }

    let multiplierOverride = isBoss ? BET_TYPES.find(b => b.id === betType)!.multiplier * 1.5 : undefined;
    if (lastStandMode) multiplierOverride = 5;

    const { final, won, delta } = await executeRoll(bet, betType, multiplierOverride);
    setTotalRolls(nextRoll);

    if (isBoss) setBossResult(won ? `⚡ BOSS WIN!` : '💀 BOSS LOSS');

    const newBalance = points + delta;
    const newStreak = won ? streak + 1 : (streakProtected && !protectionUsed ? streak : 0);

    // Use streak protection
    if (!won && streak >= 5 && !protectionUsed && streakProtected) {
      setProtectionUsed(true);
      setStreakProtected(false);
    }

    const newExactWins = (won && betType === 'exact') ? exactWins + 1 : exactWins;

    setPoints(newBalance);
    setResult(won ? 'win' : 'lose');
    setStreak(newStreak);
    setExactWins(newExactWins);
    setLastStandMode(false);
    if (lastStandMode) setLastStandUsed(true);

    setHistory(prev => [
      { value: final, won, bet, delta, betType, isBoss, ts: Date.now() },
      ...prev.slice(0, 9),
    ]);

    if (won) {
      Vibration.vibrate([0, 50, 50, 100]);
      if (newStreak >= 3) Vibration.vibrate([0, 100, 50, 100, 50, 200]);

      // Offer Double or Nothing
      setTimeout(() => {
        setPendingWin(delta);
        setShowDoubleModal(true);
      }, 1200);
    } else {
      Vibration.vibrate(300);
    }

    await recordGame(won, newStreak, newBalance);
    if (walletAddress) {
      await updateScore(walletAddress, newBalance,
        (stats.totalWins || 0) + (won ? 1 : 0),
        (stats.totalGames || 0) + 1,
        Math.max(stats.bestStreak || 0, newStreak),
      );
    }

    if (walletAddress && won && delta > 0) {
      await addRecord(walletAddress, delta, betType, multiplierOverride || BET_TYPES.find(b => b.id === betType)!.multiplier, isBoss);
    }
    await checkAchievements({
      won, streak: newStreak,
      totalGames: (stats.totalGames || 0) + 1,
      betType, isBoss, balance: newBalance,
      exactWins: newExactWins, dailyDays: 0,
    });

    await updateMissions({ won, streak, betType, isBoss: isBossRound, doubleWin: false });
    showResultAnim();
  }, [rolling, bet, betType, points, streak, totalRolls, lastStandMode, streakProtected, protectionUsed, exactWins, executeRoll, recordGame, updateScore, checkAchievements, walletAddress, stats]);

  const handleDouble = useCallback(async () => {
    setShowDoubleModal(false);
    setIsDoubleRoll(true);
    setRolling(true);
    setResult(null);

    const { won, delta } = await executeRoll(pendingWin, betType);

    if (won) {
      setPoints(prev => prev + pendingWin);
      setResult('win');
      Vibration.vibrate([0, 100, 50, 200]);
    } else {
      setPoints(prev => prev - pendingWin);
      setResult('lose');
      Vibration.vibrate([0, 300, 100, 300]);
    }

    setIsDoubleRoll(false);
    await updateMissions({ won, streak, betType, isBoss: isBossRound, doubleWin: false });
    showResultAnim();
  }, [pendingWin, betType, executeRoll, showResultAnim]);

  const handleTake = useCallback(() => {
    setShowDoubleModal(false);
  }, []);

  const handleLastStandAccept = useCallback(() => {
    setShowLastStand(false);
    setLastStandMode(true);
    setBet(points);
  }, [points]);

  const handleLastStandDecline = useCallback(() => {
    setShowLastStand(false);
    setLastStandUsed(true);
  }, []);

  const reset = useCallback(() => {
    setPoints(STARTING_POINTS);
    setHistory([]);
    setResult(null);
    setStreak(0);
    setDiceValue(1);
    setTotalRolls(0);
    setIsBossRound(false);
    setBossResult(null);
    setDuelResult(null);
    setLastStandUsed(false);
    setLastStandMode(false);
    setProtectionUsed(false);
    setStreakProtected(false);
  }, []);

  const winRate = history.length > 0
    ? Math.round(history.filter(h => h.won).length / history.length * 100) : 0;
  const nextBoss = 10 - (totalRolls % 10);

  if (!selectedAccount) {
    return (
      <View style={styles.connectContainer}>
        <Text style={styles.appTitle}>⬡ DICE DUEL</Text>
        <Text style={styles.networkBadge}>{ t('networkBadge') }</Text>
        <Text style={styles.connectHint}>Connect your wallet to play</Text>
        <SignInFeature />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AchievementToast achievements={newAchievements} />
      <DailyBonusModal visible={showDailyModal} bonus={100} onClaim={handleClaimDaily} />
      <DoubleOrNothingModal
        visible={showDoubleModal}
        currentWin={pendingWin}
        onDouble={handleDouble}
        onTake={handleTake}
      />
      <LastStandModal
        visible={showLastStand}
        points={points}
        onAccept={handleLastStandAccept}
        onDecline={handleLastStandDecline}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>⬡ DICE DUEL</Text>
          <Text style={styles.networkBadge}>{ t('networkBadge') }</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.levelBadge, { borderColor: levelColor }]}>
            <Text style={[styles.levelText, { color: levelColor }]}>LVL {progress.level} · {levelTitle}</Text>
          </View>
          {streak >= 3 && <Text style={styles.streakBadge}>🔥 {streak} STREAK</Text>}
        </View>
      </View>

      {/* Live Feed */}
      <LiveFeed />
      <DailyMissions
        missions={missions}
        totalRewardAvailable={totalRewardAvailable}
        onClaim={async (id) => {
          const reward = await claimMission(id);
          if (reward > 0) setPoints(prev => prev + reward);
          return reward;
        }}
      />

      {/* Boss Banner */}
      {isBossRound && (
        <Animated.View style={[styles.bossBanner, { opacity: bossAnim.interpolate({ inputRange: [0,1], outputRange: [0.7, 1] }) }]}>
          <Text style={styles.bossText}>⚡ BOSS ROUND! x1.5 MULTIPLIER ⚡</Text>
        </Animated.View>
      )}

      {/* Last Stand Banner */}
      {lastStandMode && (
        <View style={styles.lastStandBanner}>
          <Text style={styles.lastStandText}>⚔️ LAST STAND — x5 MULTIPLIER ⚔️</Text>
        </View>
      )}

      {/* Hot Streak Protection */}
      {streak >= 5 && !protectionUsed && (
        <TouchableOpacity
          onPress={() => setStreakProtected(true)}
          style={[styles.protectionBtn, streakProtected && styles.protectionBtnActive]}
        >
          <Text style={styles.protectionText}>
            {streakProtected ? t('streakProtected') : t('protectStreak')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Next Boss Bar */}
      {!isBossRound && totalRolls > 0 && (
        <View style={styles.nextBossBar}>
          <Text style={styles.nextBossText}>⚡ Boss in {nextBoss} rolls</Text>
          <View style={styles.nextBossProgress}>
            <View style={[styles.nextBossProgressFill, { width: `${((10 - nextBoss) / 10) * 100}%` }]} />
          </View>
        </View>
      )}

      {/* Points */}
      <View style={styles.pointsBar}>
        <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>{ t('points') }</Text>
        {dailyBonus && <Text style={styles.dailyBonusTag}>+{dailyBonus} 🎁</Text>}
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity onPress={() => setDuelMode(false)}
          style={[styles.modeBtn, !duelMode && styles.modeBtnActive]}>
          <Text style={[styles.modeBtnText, !duelMode && styles.modeBtnTextActive]}>{ t('solo') }</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDuelMode(true)}
          style={[styles.modeBtn, duelMode && styles.modeBtnActiveDuel]}>
          <Text style={[styles.modeBtnText, duelMode && styles.modeBtnTextActive]}>{ t('vsBot') }</Text>
        </TouchableOpacity>
      </View>

      {/* Dice Area */}
      <View style={styles.diceArea}>
        <View style={styles.diceWrapper}>
          {duelMode && <Text style={styles.diceLabel}>YOU</Text>}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <DiceFace value={diceValue} size={duelMode ? 100 : 130} slowRoll={slowRollActive && !rolling} />
          </Animated.View>
        </View>

        {duelMode && (
          <>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              {duelResult && (
                <Text style={[styles.duelResultText,
                  { color: duelResult === 'win' ? '#14F195' : duelResult === 'lose' ? '#FF6B6B' : '#FFD700' }
                ]}>
                  {duelResult === 'win' ? 'WIN' : duelResult === 'lose' ? 'LOSE' : 'DRAW'}
                </Text>
              )}
            </View>
            <View style={styles.diceWrapper}>
              <Text style={styles.diceLabel}>{botName}</Text>
              <DiceFace value={botDice} size={100} />
            </View>
          </>
        )}

        {!duelMode && result && !rolling && (
          <Animated.View style={[
            styles.resultBanner,
            result === 'win' ? styles.resultWin : styles.resultLose,
            { opacity: resultOpacity, transform: [{ scale: resultScale }] }
          ]}>
            <Text style={styles.resultText}>
              {bossResult || (result === 'win' ? '🎯 WIN!' : '💀 LOSE')}
            </Text>
            <Text style={styles.resultSub}>
              {result === 'win' ? `+${history[0]?.delta} pts` : `-${bet} pts`}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bet Type */}
      {!duelMode && !lastStandMode && (
        <View style={styles.betTypeRow}>
          {BET_TYPES.map(type => (
            <TouchableOpacity key={type.id} onPress={() => setBetType(type.id)}
              style={[styles.betTypeBtn, betType === type.id && styles.betTypeBtnActive]}>
              <Text style={[styles.betTypeLabel, betType === type.id && styles.betTypeLabelActive]}>
                {type.label}
              </Text>
              <Text style={styles.betTypeMult}>x{type.multiplier}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!duelMode && betType === 'exact' && !lastStandMode && (
        <View style={styles.exactRow}>
          <Text style={styles.exactLabel}>PICK:</Text>
          {[1,2,3,4,5,6].map(n => (
            <TouchableOpacity key={n} onPress={() => setExactGuess(n)}
              style={[styles.exactBtn, exactGuess===n && styles.exactBtnActive]}>
              <Text style={[styles.exactBtnText, exactGuess===n && styles.exactBtnTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Bet Amount */}
      {!lastStandMode && (
        <View style={styles.betRow}>
          <Text style={styles.betLabel}>BET:</Text>
          {BET_OPTIONS.map(amount => (
            <TouchableOpacity key={amount} onPress={() => setBet(amount)}
              disabled={amount > points}
              style={[styles.betBtn, bet===amount && styles.betBtnActive, amount>points && styles.betBtnDisabled]}>
              <Text style={[styles.betBtnText, bet===amount && styles.betBtnTextActive]}>{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Roll / Restart */}
      {points > 0 ? (
        <TouchableOpacity onPress={rollDice} disabled={rolling || bet > points}
          style={[
            styles.rollBtn,
            rolling && styles.rollBtnDisabled,
            isBossRound && styles.rollBtnBoss,
            lastStandMode && styles.rollBtnLastStand,
          ]}>
          <Text style={styles.rollBtnText}>
            {rolling ? t('rolling') :
             lastStandMode ? t('lastStandRoll') :
             isBossRound ? t('bossRoll') :
             duelMode ? t('duelRoll') : t('roll')}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={reset} style={styles.restartBtn}>
          <Text style={styles.restartBtnText}>{ t('restart') }</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      {history.length > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalRolls}</Text>
            <Text style={styles.statLabel}>{ t('rolls') }</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#14F195' }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>{ t('winRate') }</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: points >= STARTING_POINTS ? '#14F195' : '#FF6B6B' }]}>
              {points >= STARTING_POINTS ? '+' : ''}{points - STARTING_POINTS}
            </Text>
            <Text style={styles.statLabel}>P&L</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FF6B35' }]}>{streak}</Text>
            <Text style={styles.statLabel}>{ t('streak') }</Text>
          </View>
        </View>
      )}

      {/* History */}
      {history.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
          {history.map(item => (
            <View key={item.ts} style={[
              styles.historyItem,
              item.won ? styles.historyWin : styles.historyLose,
              item.isBoss && styles.historyBoss,
            ]}>
              <Text style={styles.historyDice}>{item.value}</Text>
              <Text style={[styles.historyPts, { color: item.won ? '#14F195' : '#FF6B6B' }]}>
                {item.won ? '+' : ''}{item.delta}
              </Text>
              {item.isBoss && <Text style={styles.historyBossIcon}>⚡</Text>}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 20 },
  connectContainer: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', padding: 20 },
  connectHint: { color: '#555', fontSize: 14, marginBottom: 24, letterSpacing: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  appTitle: { color: '#9945FF', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  networkBadge: { color: '#14F195', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  levelBadge: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  levelText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  streakBadge: { color: '#FF6B35', fontWeight: '800', fontSize: 12, marginTop: 4 },
  bossBanner: { backgroundColor: 'rgba(255,165,0,0.15)', borderWidth: 1.5, borderColor: '#FFA500', borderRadius: 12, paddingVertical: 7, alignItems: 'center', marginBottom: 4 },
  bossText: { color: '#FFA500', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  lastStandBanner: { backgroundColor: 'rgba(255,107,107,0.15)', borderWidth: 1.5, borderColor: '#FF6B6B', borderRadius: 12, paddingVertical: 7, alignItems: 'center', marginBottom: 4 },
  lastStandText: { color: '#FF6B6B', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  protectionBtn: { backgroundColor: '#111', borderWidth: 1.5, borderColor: '#9945FF', borderRadius: 10, paddingVertical: 6, alignItems: 'center', marginBottom: 4 },
  protectionBtnActive: { backgroundColor: 'rgba(153,69,255,0.2)', borderColor: '#14F195' },
  protectionText: { color: '#9945FF', fontSize: 11, fontWeight: '800' },
  nextBossBar: { marginBottom: 4 },
  nextBossText: { color: '#444', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  nextBossProgress: { height: 3, backgroundColor: '#1a1a2e', borderRadius: 2 },
  nextBossProgressFill: { height: 3, backgroundColor: '#FFA500', borderRadius: 2 },
  pointsBar: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  pointsValue: { color: '#fff', fontSize: 38, fontWeight: '900', letterSpacing: -1 },
  pointsLabel: { color: '#555', fontSize: 13, fontWeight: '700', letterSpacing: 2, paddingBottom: 5 },
  dailyBonusTag: { color: '#FFD700', fontSize: 13, fontWeight: '800', paddingBottom: 5 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  modeBtnActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.12)' },
  modeBtnActiveDuel: { borderColor: '#14F195', backgroundColor: 'rgba(20,241,149,0.12)' },
  modeBtnText: { color: '#555', fontWeight: '800', fontSize: 13 },
  modeBtnTextActive: { color: '#fff' },
  diceArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 150, marginVertical: 4 },
  diceWrapper: { alignItems: 'center' },
  diceLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  vsContainer: { alignItems: 'center', marginHorizontal: 16 },
  vsText: { color: '#333', fontSize: 18, fontWeight: '900' },
  duelResultText: { fontSize: 13, fontWeight: '900', marginTop: 6, letterSpacing: 1 },
  resultBanner: { marginLeft: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, alignItems: 'center', borderWidth: 1.5 },
  resultWin: { borderColor: '#14F195', backgroundColor: 'rgba(20,241,149,0.12)' },
  resultLose: { borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.12)' },
  resultText: { fontSize: 17, fontWeight: '900', color: '#fff' },
  resultSub: { fontSize: 12, fontWeight: '700', color: '#aaa', marginTop: 2 },
  betTypeRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  betTypeBtn: { flex: 1, paddingVertical: 9, borderRadius: 14, alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  betTypeBtnActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.12)' },
  betTypeLabel: { color: '#555', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  betTypeLabelActive: { color: '#9945FF' },
  betTypeMult: { color: '#14F195', fontSize: 13, fontWeight: '900', marginTop: 2 },
  exactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  exactLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  exactBtn: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  exactBtnActive: { borderColor: '#14F195', backgroundColor: 'rgba(20,241,149,0.1)' },
  exactBtnText: { color: '#555', fontWeight: '800', fontSize: 13 },
  exactBtnTextActive: { color: '#14F195' },
  betRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  betLabel: { color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  betBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: 'center', backgroundColor: '#111', borderWidth: 1.5, borderColor: '#222' },
  betBtnActive: { borderColor: '#9945FF', backgroundColor: 'rgba(153,69,255,0.12)' },
  betBtnDisabled: { opacity: 0.3 },
  betBtnText: { color: '#555', fontWeight: '800', fontSize: 12 },
  betBtnTextActive: { color: '#9945FF' },
  rollBtn: { backgroundColor: '#9945FF', paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginBottom: 8 },
  rollBtnBoss: { backgroundColor: '#FFA500' },
  rollBtnLastStand: { backgroundColor: '#FF6B6B' },
  rollBtnDisabled: { opacity: 0.6 },
  rollBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  restartBtn: { backgroundColor: '#14F195', paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginBottom: 8 },
  restartBtnText: { color: '#000', fontSize: 17, fontWeight: '900', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#111', borderRadius: 16, paddingVertical: 9, marginBottom: 7, borderWidth: 1, borderColor: '#1a1a2e' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 15, fontWeight: '900' },
  statLabel: { color: '#444', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  historyScroll: { maxHeight: 58 },
  historyItem: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginRight: 7 },
  historyWin: { borderColor: '#14F195', backgroundColor: 'rgba(20,241,149,0.08)' },
  historyLose: { borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.08)' },
  historyBoss: { borderColor: '#FFA500' },
  historyDice: { color: '#fff', fontSize: 15, fontWeight: '900' },
  historyPts: { fontSize: 9, fontWeight: '700' },
  historyBossIcon: { fontSize: 8, position: 'absolute', top: 2, right: 2 },
});
// hotfix: auto-reset rolling state after 5 seconds
