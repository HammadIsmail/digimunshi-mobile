import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  createAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { api } from '@/lib/api';
import * as FileSystem from 'expo-file-system/legacy';

function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface VoiceResponse {
  transcript: string;
  intent: string;
  requires_confirmation: boolean;
  pending_action_id: string | null;
  response_text: string;
  response_audio_url: string | null;
  resolved_entities: any;
  ledger_updated?: boolean;
}

interface VoiceContextType {
  isRecording: boolean;
  isProcessing: boolean;
  lastResponse: VoiceResponse | null;
  ledgerVersion: number;
  triggerRefresh: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  confirmAction: (pendingActionId: string, confirmed: boolean) => Promise<any>;
  clearResponse: () => void;
}

const VoiceContext = createContext<VoiceContextType>({
  isRecording: false,
  isProcessing: false,
  lastResponse: null,
  ledgerVersion: 0,
  triggerRefresh: () => {},
  startRecording: async () => {},
  stopRecording: async () => {},
  confirmAction: async () => {},
  clearResponse: () => {},
});

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const [ledgerVersion, setLedgerVersion] = useState(0);
  const sessionIdRef = useRef<string>(generateSessionId());
  const isStartingRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);

  const triggerRefresh = useCallback(() => {
    setLedgerVersion((v) => v + 1);
  }, []);


  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const startRecording = async () => {
    if (isRecording || isStartingRef.current || isProcessing) return;
    isStartingRef.current = true;

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission denied');
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
      throw err;
    } finally {
      isStartingRef.current = false;
    }
  };

  const playAudioResponse = async (audioData: string | null) => {
    if (!audioData) return;
    try {
      let playUri = audioData;

      // Handle Base64 data URI (data:audio/mp3;base64,...) from stateless backend
      if (audioData.startsWith('data:audio') || (!audioData.startsWith('http') && !audioData.startsWith('file:'))) {
        const base64Content = audioData.includes(',') ? audioData.split(',')[1] : audioData;
        const tempPath = `${FileSystem.cacheDirectory}reply_${Date.now()}.mp3`;
        await FileSystem.writeAsStringAsync(tempPath, base64Content, {
          encoding: FileSystem.EncodingType.Base64,
        });
        playUri = tempPath;
      }

      const player = createAudioPlayer({ uri: playUri });
      player.play();
    } catch (err) {
      console.warn('Voice playback failed:', err);
    }
  };

  const stopRecording = async () => {
    // If recorder is still preparing, wait briefly so we don't drop the stop call
    let waitCount = 0;
    while (isStartingRef.current && waitCount < 20) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      waitCount++;
    }

    if (!recorder.isRecording && !recorderState.isRecording && !isRecording) return;

    // Enforce at least 600ms of recording to avoid native MediaRecorder 'stop failed' errors
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < 600) {
      await new Promise((resolve) => setTimeout(resolve, 600 - elapsed));
    }

    setIsRecording(false);
    setIsProcessing(true);

    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      // Settle delay so native MediaRecorder completely finishes writing file trailer to storage
      await new Promise((resolve) => setTimeout(resolve, 350));

      const uri = recorder.uri;
      if (!uri) throw new Error('No recording URI');

      const result = await api.processVoice(uri, sessionIdRef.current);
      setLastResponse(result);

      if (
        result.ledger_updated ||
        (!result.requires_confirmation && ['add_entry', 'record_udhaar', 'record_payment', 'add_customer', 'delete_entry'].includes(result.intent))
      ) {
        triggerRefresh();
      }


      if (result.response_audio_url) {
        await playAudioResponse(result.response_audio_url);
      }
    } catch (err) {
      console.error('Failed to process recording:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = async (pendingActionId: string, confirmed: boolean) => {
    setIsProcessing(true);
    try {
      const result = await api.confirmVoice(pendingActionId, confirmed);
      setLastResponse({
        ...lastResponse!,
        response_text: result.response_text,
        response_audio_url: result.response_audio_url,
        requires_confirmation: false,
        pending_action_id: null,
      });

      if (result.ledger_updated || confirmed) {
        triggerRefresh();
      }

      if (result.response_audio_url) {
        await playAudioResponse(result.response_audio_url);
      }

      return result;
    } finally {
      setIsProcessing(false);
    }
  };


  const clearResponse = () => setLastResponse(null);

  return (
    <VoiceContext.Provider
      value={{
        isRecording,
        isProcessing,
        lastResponse,
        ledgerVersion,
        triggerRefresh,
        startRecording,
        stopRecording,
        confirmAction,
        clearResponse,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );

}

export const useVoice = () => useContext(VoiceContext);
