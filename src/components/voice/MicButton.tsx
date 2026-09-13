import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useVoice } from '@/contexts/VoiceContext';
import { AppIcon } from '@/components/AppIcon';

const WAVE_HEIGHTS = [14, 28, 42, 20, 50, 28, 14, 32, 50, 28, 14, 28, 42, 10, 28, 32];

export function MicButton() {
  const { isRecording, isProcessing, startRecording, stopRecording, cancelRecording } = useVoice();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef(WAVE_HEIGHTS.map(() => new Animated.Value(0.4))).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animate waveform bars
      const animations = waveAnims.map((anim, idx) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 250 + (idx % 4) * 80,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.25,
              duration: 250 + (idx % 4) * 80,
              useNativeDriver: true,
            }),
          ])
        )
      );
      Animated.parallel(animations).start();
    } else {
      pulseAnim.setValue(1);
      waveAnims.forEach((anim) => anim.setValue(0.4));
    }
  }, [isRecording]);

  const pressStartRef = useRef<number>(0);
  const isLongPressRef = useRef<boolean>(false);

  const handlePressIn = () => {
    pressStartRef.current = Date.now();
    isLongPressRef.current = false;
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    isLongPressRef.current = true;
    if (!isRecording && !isProcessing) {
      startRecording();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const duration = Date.now() - pressStartRef.current;
    if (isLongPressRef.current || duration > 500) {
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const handlePress = () => {
    const duration = Date.now() - pressStartRef.current;
    if (!isLongPressRef.current && duration <= 500) {
      if (isRecording) {
        stopRecording();
      } else if (!isProcessing) {
        startRecording();
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Waveform Soundwave Bars Left */}
      <View style={styles.waveRow}>
        {WAVE_HEIGHTS.slice(0, 7).map((h, i) => (
          <Animated.View
            key={`left-${i}`}
            style={[
              styles.waveBar,
              {
                height: h,
                backgroundColor: isRecording ? '#F05700' : '#E5E7EB',
                transform: [{ scaleY: isRecording ? waveAnims[i] : 1 }],
              },
            ]}
          />
        ))}

        {/* Center Mic Trigger with floating Cancel Cross Button */}
        <View style={styles.micAnchor}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onLongPress={handleLongPress}
            onPress={handlePress}
            delayLongPress={250}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            <Animated.View
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive,
                isProcessing && styles.micButtonProcessing,
                {
                  transform: [
                    { scale: scaleAnim },
                    { scale: isRecording ? pulseAnim : 1 },
                  ],
                },
              ]}
            >
              <AppIcon
                name="speaker_big"
                width={26}
                height={34}
                tintColor={isRecording ? '#FFFFFF' : '#F05700'}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Floating Cross Button on top-right of mic when recording */}
          {isRecording && (
            <TouchableOpacity
              style={styles.floatingCancelBtn}
              onPress={cancelRecording}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AppIcon name="cross" size={10} tintColor="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Waveform Soundwave Bars Right */}
        {WAVE_HEIGHTS.slice(7, 14).map((h, i) => (
          <Animated.View
            key={`right-${i}`}
            style={[
              styles.waveBar,
              {
                height: h,
                backgroundColor: isRecording ? '#F05700' : '#E5E7EB',
                transform: [{ scaleY: isRecording ? waveAnims[7 + i] : 1 }],
              },
            ]}
          />
        ))}
      </View>

      {/* Prominent Cancel Button below mic when recording */}
      {isRecording && (
        <TouchableOpacity
          style={styles.cancelActionPill}
          onPress={cancelRecording}
          activeOpacity={0.75}
        >
          <View style={styles.cancelIconCircle}>
            <AppIcon name="cross" size={10} tintColor="#DC2626" />
          </View>
          <Text style={styles.cancelActionText}>منسوخ کریں (Cancel)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
  },
  micButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: '#F05700',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 10px rgba(240, 87, 0, 0.18)' }
      : {
          shadowColor: '#F05700',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 6,
        }),
  },
  micButtonActive: {
    backgroundColor: '#F05700',
    borderColor: '#F05700',
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(240, 87, 0, 0.4)' } : { shadowOpacity: 0.4 }),
  },
  micButtonProcessing: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  micAnchor: {
    position: 'relative',
  },
  floatingCancelBtn: {
    position: 'absolute',
    top: -2,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(220, 38, 38, 0.35)' }
      : {
          shadowColor: '#DC2626',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.35,
          shadowRadius: 4,
          elevation: 6,
        }),
    zIndex: 20,
  },
  cancelActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 14,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(220, 38, 38, 0.1)' }
      : {
          shadowColor: '#DC2626',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        }),
  },
  cancelIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
