import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
      <View style={styles.headerBadgeRow}>
        <View style={styles.warningPill}>
          <Text style={styles.warningPillText}>⚠️ تصدیق فرمائیں</Text>
        </View>
      </View>

      {/* Show what the user said if available */}
      {transcript && transcript.trim().length > 0 && (
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptBadge}>🗣️ آپ نے کہا</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {/* Munshi Question */}
      <View style={styles.promptCard}>
        <Text style={styles.promptText}>{text}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={() => handleConfirm(true)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.confirmText}>✓ ہاں، کر دیں</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => handleConfirm(false)}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>✗ نہیں، رہنے دیں</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  warningPill: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  transcriptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderRightWidth: 3,
    borderRightColor: '#94A3B8',
    alignItems: 'flex-end',
  },
  transcriptBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'right',
  },
  transcriptText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
    textAlign: 'right',
  },
  promptCard: {
    marginBottom: 16,
  },
  promptText: {
    fontSize: 17,
    color: '#0F172A',
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
});
