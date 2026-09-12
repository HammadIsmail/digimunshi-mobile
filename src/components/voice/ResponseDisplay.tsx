import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ResponseDisplayProps {
  transcript?: string;
  text: string;
  onDismiss: () => void;
}

export function ResponseDisplay({ transcript, text, onDismiss }: ResponseDisplayProps) {
  return (
    <View style={styles.container}>
      {/* Transcribed User Speech */}
      {transcript && transcript.trim().length > 0 && (
        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptBadge}>🗣️ آپ نے کہا</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}

      {/* Munshi Response */}
      <View style={styles.responseCard}>
        <Text style={styles.responseBadge}>🤖 ڈیجی منشی</Text>
        <Text style={styles.responseText}>{text}</Text>
      </View>

      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton} activeOpacity={0.8}>
        <Text style={styles.dismissText}>✓ ٹھیک ہے</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  transcriptCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderRightWidth: 3,
    borderRightColor: '#64748B',
    alignItems: 'flex-end',
  },
  transcriptBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
    textAlign: 'right',
  },
  transcriptText: {
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 24,
    textAlign: 'right',
  },
  responseCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderRightWidth: 3,
    borderRightColor: '#10B981',
    alignItems: 'flex-end',
  },
  responseBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
    textAlign: 'right',
  },
  responseText: {
    fontSize: 16,
    color: '#064E3B',
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'right',
  },
  dismissButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dismissText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 13,
  },
});
