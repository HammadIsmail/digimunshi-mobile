import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVoice } from '@/contexts/VoiceContext';

interface ConfirmationPromptProps {
  transcript?: string;
  text: string;
  pendingActionId: string;
}

export function ConfirmationPrompt({ transcript, text, pendingActionId }: ConfirmationPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { confirmAction } = useVoice();

  const handleConfirm = async (confirmed: boolean) => {
    setIsLoading(true);
    try {
      await confirmAction(pendingActionId, confirmed);
    } catch (err) {
      console.error('Failed to confirm action:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚠️ تصدیق فرمائیں</Text>

      {/* Show what the user said if available */}
      {transcript && transcript.trim().length > 0 && (
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptBadge}>🗣️ آپ نے کہا</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {/* Munshi Prompt Question */}
      <View style={styles.promptCard}>
        <Text style={styles.promptBadge}>🤖 ڈیجی منشی</Text>
        <Text style={styles.text}>{text}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={() => handleConfirm(true)}
          disabled={isLoading}
        >
          <Text style={styles.confirmText}>✓ ہاں، کر دو</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => handleConfirm(false)}
          disabled={isLoading}
        >
          <Text style={styles.cancelText}>✗ نہیں، رہنے دو</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 12,
  },
  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#78350F',
  },
  transcriptBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: 17,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 24,
  },
  promptCard: {
    marginBottom: 16,
  },
  promptBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  text: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  confirmText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
