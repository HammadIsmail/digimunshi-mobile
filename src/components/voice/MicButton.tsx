import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useVoice } from '@/contexts/VoiceContext';
import { AppIcon } from '@/components/AppIcon';

const WAVE_HEIGHTS = [14, 28, 42, 20, 50, 28, 14, 32, 50, 28, 14, 28, 42, 10, 28, 32];

export function MicButton() {
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
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

        {/* Center Mic Trigger (White with #F05700 Orange Border matching reference image) */}
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
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  micButtonActive: {
    backgroundColor: '#F05700',
    borderColor: '#F05700',
    shadowOpacity: 0.4,
  },
  micButtonProcessing: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
});
