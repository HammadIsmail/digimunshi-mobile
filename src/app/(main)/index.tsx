import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { MicButton } from '@/components/voice/MicButton';
import { ResponseDisplay } from '@/components/voice/ResponseDisplay';
import { ConfirmationPrompt } from '@/components/voice/ConfirmationPrompt';

export default function HomeScreen() {
  const [summary, setSummary] = useState<{ total_outstanding: number; customer_count: number } | null>(null);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const router = useRouter();
  const { logout } = useAuth();
  const { lastResponse, isProcessing, isRecording, clearResponse, ledgerVersion } = useVoice();

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary, ledgerVersion])
  );


  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>digiMunshi</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>لاگ آؤٹ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>کل بقایا ادھار</Text>
            <Text style={styles.summaryAmount}>Rs. {summary.total_outstanding.toLocaleString()}</Text>
            <Text style={styles.summarySub}>{summary.customer_count} گاہک</Text>
          </View>
        )}

        {/* Center-stage Mic Section */}
        <View style={styles.micContainer}>
          <MicButton />
          <Text style={styles.micHint}>
            {isProcessing
              ? 'سوچ رہا ہوں...'
              : isRecording
              ? '🔴 سن رہا ہوں... بول کر چھوڑیں'
              : 'بولنے کے لیے مائیک دبائیں (Tap / Hold)'}
          </Text>
        </View>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#D4740F" />
            <Text style={styles.processingText}>آواز سمجھ رہا ہوں...</Text>
          </View>
        )}

        {/* Transcribed Urdu Speech & Munshi Response Under the Mic */}
        {lastResponse && !lastResponse.requires_confirmation && (
          <ResponseDisplay
            transcript={lastResponse.transcript}
            text={lastResponse.response_text}
            onDismiss={clearResponse}
          />
        )}

        {lastResponse?.requires_confirmation && lastResponse.pending_action_id && (
          <ConfirmationPrompt
            transcript={lastResponse.transcript}
            text={lastResponse.response_text}
            pendingActionId={lastResponse.pending_action_id}
          />
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.ledgerButton}
        onPress={() => router.push('/(main)/ledger')}
      >
        <Text style={styles.ledgerButtonText}>کھاتہ دیکھیں</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4740F',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4740F',
  },
  summarySub: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  processingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  micContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  micHint: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  ledgerButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4740F',
  },
  ledgerButtonText: {
    color: '#D4740F',
    fontSize: 16,
    fontWeight: '600',
  },
});
