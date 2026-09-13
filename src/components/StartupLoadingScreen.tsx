import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Logo } from '@/components/Logo';

interface StartupLoadingScreenProps {
  statusText?: string;
}

const { width } = Dimensions.get('window');

export function StartupLoadingScreen({
  statusText = 'لوڈ ہو رہا ہے...',
}: StartupLoadingScreenProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle breathing pulse for the logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.97,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Smooth progress bar animation from 0% to 92%
    Animated.timing(progressAnim, {
      toValue: 0.92,
      duration: 2400,
      useNativeDriver: false,
    }).start();

    // Looping shimmer effect on progress bar
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.centerCard}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Logo size={128} />
        </Animated.View>

        {/* Brand Titles */}
        <Text style={styles.brandTitle}>ڈیجی منشی</Text>
        <Text style={styles.brandSubtitle}>
          ڈیجیٹل کھاتہ اور آواز کا رجسٹر
        </Text>

        {/* Progress Bar under logo */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              { width: progressWidth },
            ]}
          />
        </View>

        {/* Status Text */}
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>100% محفوظ اور آسان</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 340,
  },
  logoContainer: {
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 12px 28px rgba(240, 87, 0, 0.16)',
      },
      default: {
        shadowColor: '#F05700',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
        elevation: 6,
      },
    }),
    borderRadius: 28,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 6,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '500',
    marginBottom: 28,
    textAlign: 'center',
  },
  progressTrack: {
    width: 200,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F05700',
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '500',
  },
});

export default StartupLoadingScreen;
