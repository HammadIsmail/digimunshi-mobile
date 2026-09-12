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
      <View style={styles.transcriptCard}>
        <View style={styles.badgeRow}>
          <Text style={styles.transcriptBadge}>🗣️ آپ نے کہا</Text>
        </View>
        <Text style={styles.transcriptText}>
          {transcript && transcript.trim().length > 0
            ? transcript
            : '... [کوئی آواز ریکارڈ نہیں ہوئی]'}
        </Text>
      </View>

      {/* Munshi Response */}
      <View style={styles.responseCard}>
        <View style={styles.badgeRow}>
          <Text style={styles.responseBadge}>🤖 ڈیجی منشی</Text>
        </View>
        <Text style={styles.responseText}>{text}</Text>
      </View>

      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
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
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  transcriptCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4B5563',
  },
  transcriptBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: 18,
    color: '#111827',
    lineHeight: 26,
    fontWeight: '500',
  },
  responseCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  responseBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  responseText: {
    fontSize: 16,
    color: '#065F46',
    lineHeight: 24,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dismissButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  dismissText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
});

