import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { AppIcon } from '@/components/AppIcon';
import { api } from '@/lib/api';

interface FieldMicButtonProps {
  onTranscribe: (text: string) => void;
  fieldName?: string; // e.g. "نام" or "دکان"
  size?: number;
  disabled?: boolean;
}

export function FieldMicButton({
  onTranscribe,
  fieldName,
  size = 36,
  disabled = false,
}: FieldMicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef<number>(0);
  const isStartingRef = useRef<boolean>(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => {
    let loopAnim: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      loopAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      loopAnim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      loopAnim?.stop();
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (isRecording || isProcessing || isStartingRef.current || disabled) return;
    isStartingRef.current = true;

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        alert('مائیکروفون کی اجازت درکار ہے');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      if (recorder.isRecording) {
        try {
          await recorder.stop();
        } catch {
          // ignore
        }
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
    } finally {
      isStartingRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!isRecording && !recorderState.isRecording) return;

    // Minimum 600ms duration
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      // Flush delay
      await new Promise((resolve) => setTimeout(resolve, 350));

      const uri = recorder.uri;
      if (!uri) throw new Error('No recording URI');

      const transcript = await api.transcribeAudio(uri);
      if (transcript && transcript.trim()) {
        onTranscribe(transcript.trim());
      }
    } catch (err) {
      console.error('Failed to process voice transcription:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelRecording = async () => {
    isStartingRef.current = false;
    setIsRecording(false);
    setIsProcessing(false);

    try {
      if (recorder.isRecording || recorderState.isRecording) {
        await recorder.stop();
      }
      await setAudioModeAsync({ allowsRecording: false });
    } catch (e) {
      console.warn('Error during cancelRecording:', e);
    }
  };

  const toggleRecording = () => {
    if (isProcessing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelRecording}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={toggleRecording}
        disabled={isProcessing || disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          { width: size, height: size, borderRadius: size / 2 },
          isRecording && styles.buttonActive,
          isProcessing && styles.buttonProcessing,
        ]}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#F05700" />
        ) : (
          <Animated.View
            style={[
              styles.iconWrapper,
              isRecording && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <AppIcon
              name="speaker_small"
              size={Math.round(size * 0.45)}
              tintColor={isRecording ? '#FFFFFF' : '#F05700'}
            />
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(240, 87, 0, 0.1)',
      },
      default: {
        shadowColor: '#F05700',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  buttonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    ...Platform.select({
      web: {
        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
      },
      default: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  buttonProcessing: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FDBA74',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    lineHeight: 13,
  },
});
