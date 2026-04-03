import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Dice dots appear one by one
    const dotAnimations = dotsAnim.map((dot, i) =>
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.spring(dot, { toValue: 1, friction: 4, useNativeDriver: true }),
      ])
    );

    // Glow pulse
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );

    Animated.sequence([
      // Logo появляется
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ...dotAnimations,
      ]),
      Animated.delay(300),
      // Заголовок
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Подзаголовок
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(800),
      // Уходим
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(subtitleOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start(() => onFinish());

    glowLoop.start();

    return () => glowLoop.stop();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  // Dice face with 6 dots
  const DICE_DOTS = [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]];

  return (
    <View style={styles.container}>
      {/* Background particles */}
      {[...Array(12)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              left: `${(i * 37 + 10) % 90}%`,
              top: `${(i * 23 + 5) % 85}%`,
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.05, 0.15],
              }),
            },
          ]}
        />
      ))}

      {/* Dice Logo */}
      <Animated.View style={[
        styles.diceContainer,
        {
          transform: [{ scale: logoScale }],
          opacity: Animated.multiply(logoOpacity, glowOpacity),
        }
      ]}>
        <View style={styles.dice}>
          {DICE_DOTS.map(([row, col], i) => (
            <Animated.View
              key={i}
              style={[
                styles.diceDotContainer,
                { left: col * 36 + 12, top: row * 36 + 12 }
              ]}
            >
              <Animated.View style={[
                styles.diceDot,
                {
                  transform: [{ scale: dotsAnim[i] }],
                  opacity: dotsAnim[i],
                }
              ]} />
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[
        styles.title,
        { opacity: titleOpacity, transform: [{ translateY: titleY }] }
      ]}>
        DICE DUEL
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        ⬡ POWERED BY SOLANA
      </Animated.Text>

      {/* Bottom tagline */}
      <Animated.Text style={[styles.tagline, { opacity: subtitleOpacity }]}>
        Roll. Win. Dominate.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9945FF',
  },
  diceContainer: {
    marginBottom: 40,
    shadowColor: '#9945FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 30,
  },
  dice: {
    width: 120,
    height: 120,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#9945FF',
    position: 'relative',
  },
  diceDotContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#14F195',
    shadowColor: '#14F195',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 12,
  },
  subtitle: {
    color: '#9945FF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  tagline: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    position: 'absolute',
    bottom: 60,
  },
});
