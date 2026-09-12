import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useVoice } from '@/contexts/VoiceContext';

export function MicButton() {
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoice();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const pressStartRef = useRef<number>(0);
  const isLongPressRef = useRef<boolean>(false);

  const handlePressIn = () => {
    pressStartRef.current = Date.now();
    isLongPressRef.current = false;
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handleLongPress}
      onPress={handlePress}
      delayLongPress={250}
      disabled={isProcessing}
      activeOpacity={0.8}
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
        <Animated.Text style={styles.micIcon}>
          {isProcessing ? '⏳' : isRecording ? '🔴' : '🎤'}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D4740F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4740F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#E53935',
    shadowColor: '#E53935',
  },
  micButtonProcessing: {
    backgroundColor: '#999',
  },
  micIcon: {
    fontSize: 48,
  },
});
