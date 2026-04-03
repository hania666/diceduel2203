import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSupabaseLeaderboard } from '../hooks/useSupabaseLeaderboard';

interface FeedItem {
  id: string;
  text: string;
  color: string;
}

export function LiveFeed() {
  const { globalLeaderboard } = useSupabaseLeaderboard();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [currentItem, setCurrentItem] = useState<FeedItem | null>(null);
  const translateX = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Generate feed from leaderboard
  useEffect(() => {
    if (globalLeaderboard.length === 0) return;
    const items: FeedItem[] = globalLeaderboard.flatMap(entry => [
      { id: `${entry.wallet_address}_win`, text: `🎯 ${entry.short_address} won ${Math.floor(Math.random() * 200 + 50)} pts`, color: '#14F195' },
      { id: `${entry.wallet_address}_streak`, text: `🔥 ${entry.short_address} is on a ${entry.best_streak} streak!`, color: '#FF6B35' },
      { id: `${entry.wallet_address}_boss`, text: `⚡ ${entry.short_address} beat a Boss Round!`, color: '#FFA500' },
    ]);
    setFeedItems(items);
  }, [globalLeaderboard]);

  // Animate feed items
  useEffect(() => {
    if (feedItems.length === 0) return;
    let index = 0;

    const showNext = () => {
      const item = feedItems[index % feedItems.length];
      setCurrentItem(item);
      index++;

      translateX.setValue(300);
      opacity.setValue(0);

      Animated.sequence([
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, friction: 8, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.delay(2500),
        Animated.parallel([
          Animated.timing(translateX, { toValue: -300, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start(() => setTimeout(showNext, 500));
    };

    const timer = setTimeout(showNext, 2000);
    return () => clearTimeout(timer);
  }, [feedItems]);

  if (!currentItem) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX }], opacity }]}>
      <Text style={[styles.text, { color: currentItem.color }]}>{currentItem.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1a1a2e',
    marginBottom: 6,
  },
  text: { fontSize: 12, fontWeight: '700' },
});
