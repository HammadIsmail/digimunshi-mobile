import React, { useState, useEffect, useCallback } from 'react';
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
  const [customers, setCustomers] = useState<any[]>([]);
  const router = useRouter();
  const { shop, logout } = useAuth();
  const { lastResponse, isProcessing, isRecording, clearResponse, ledgerVersion, startRecording, stopRecording } = useVoice();

  const loadData = useCallback(async () => {
    try {
      const [sumData, custList] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getCustomers().catch(() => []),
      ]);
      if (sumData) setSummary(sumData);
      setCustomers(custList || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [ledgerVersion, loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/(auth)/login');
    }
  };

  const displayName = shop?.owner_name || 'عمران صاحب';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Minimal Top Bar (Figma Spec) */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLogout} style={styles.settingsBtn} activeOpacity={0.7}>
          <Text style={styles.settingsIcon}>🚪</Text>
        </TouchableOpacity>

        <View style={styles.profileHeaderGroup}>
          <View style={styles.profileTextCol}>
            <Text style={styles.profileNameText}>{displayName}</Text>
            <Text style={styles.profileSubText}>ڈیجیٹل رجسٹر • آن لائن</Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {displayName.trim() ? displayName.trim()[0] : 'ع'}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Main Metric: Outstanding Balance Card (Figma Spec) */}
        <View style={styles.metricCard}>
          <View style={styles.metricCardHeader}>
            <View style={styles.dueTagBadge}>
              <Text style={styles.dueTagText}>کل ادھار</Text>
            </View>
            <Text style={styles.metricCardLabel}>کل بقایا رقم</Text>
          </View>

          <Text style={styles.metricAmount}>
            Rs. {(summary?.total_outstanding || 0).toLocaleString()}
          </Text>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricFooterRow}
            onPress={() => router.push('/(main)/ledger')}
            activeOpacity={0.7}
          >
            <View style={styles.customerCountBadge}>
              <Text style={styles.customerCountText}>
                {summary ? `${summary.customer_count} گاہک` : '0 گاہک'}
              </Text>
            </View>
            <Text style={styles.metricFooterLink}>کھاتہ داروں کی فہرست دیکھیں ←</Text>
          </TouchableOpacity>
        </View>

        {/* Center Voice Hub (Figma Spec: 350x224) */}
        <View style={styles.voiceHub}>
          <Text style={styles.voiceStatusText}>
            {isProcessing
              ? 'سوچ رہا ہوں...'
              : isRecording
              ? '🔴 سن رہا ہوں... بول کر چھوڑیں'
              : 'بولنے کے لیے مائیک دبائیں'}
          </Text>

          <MicButton />

          {/* Prompt Example Pill */}
          <View style={styles.examplePill}>
            <Text style={styles.exampleText}>مثال: "علی کو 500 ادھار لکھو"</Text>
          </View>
        </View>

        {/* Loading Spinner during Voice AI processing */}
        {isProcessing && (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color="#18181B" />
            <Text style={styles.processingText}>آواز کا تجزیہ جاری ہے...</Text>
          </View>
        )}

        {/* Response & Confirmation Display */}
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

        {/* Simplified Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeaderRow}>
            <TouchableOpacity onPress={() => router.push('/(main)/ledger')}>
              <Text style={styles.viewAllText}>سب دیکھیں</Text>
            </TouchableOpacity>
            <Text style={styles.activityTitle}>کھاتہ دار (حالیہ فہرست)</Text>
          </View>

          {customers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>ابھی تک کوئی لین دین درج نہیں ہے</Text>
              <Text style={styles.emptyCardSub}>مائیک دبا کر نیا ادھار بولیں</Text>
            </View>
          ) : (
            customers.slice(0, 4).map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.customerRow}
                onPress={() => router.push({ pathname: '/(main)/customer', params: { id: c.id, name: c.name } })}
                activeOpacity={0.7}
              >
                <View style={styles.customerRowLeft}>
                  <Text style={styles.customerBalance}>Rs. {c.balance.toLocaleString()}</Text>
                  <Text style={styles.customerStatusText}>بقایا</Text>
                </View>
                <View style={styles.customerRowRight}>
                  <Text style={styles.customerName}>{c.name}</Text>
                  <Text style={styles.customerSub}>کھاتہ فعال</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Minimal Bottom Navigation Bar (Figma Spec: 390x65) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => router.push('/(main)/ledger')}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>📖</Text>
          <Text style={styles.navLabel}>کھاتہ بک</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, styles.navTabCenter]}
          onPress={() => (isRecording ? stopRecording() : startRecording())}
          activeOpacity={0.7}
        >
          <View style={styles.navMicCircle}>
            <Text style={styles.navMicIcon}>🎙️</Text>
          </View>
          <Text style={styles.navLabelCenter}>بول کر لکھیں</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navTab, styles.navTabActive]} activeOpacity={0.7}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navLabelActive}>رجسٹر</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  settingsIcon: {
    fontSize: 16,
  },
  profileHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileTextCol: {
    alignItems: 'flex-end',
  },
  profileNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  profileSubText: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '400',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18181B',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dueTagBadge: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  dueTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F43F5E',
  },
  metricCardLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
  },
  metricAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'right',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 12,
  },
  metricFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerCountBadge: {
    backgroundColor: '#F4F4F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#52525B',
  },
  metricFooterLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  voiceHub: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  voiceStatusText: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
    marginBottom: 8,
  },
  examplePill: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  processingText: {
    fontSize: 13,
    color: '#52525B',
    fontWeight: '500',
  },
  activitySection: {
    marginTop: 16,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  emptyCard: {
    padding: 24,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 14,
    color: '#52525B',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 14,
    marginBottom: 10,
  },
  customerRowLeft: {
    alignItems: 'flex-start',
  },
  customerBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  customerStatusText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  customerRowRight: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  customerSub: {
    fontSize: 11,
    color: '#71717A',
  },
  bottomNav: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    paddingBottom: 4,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTabCenter: {
    marginTop: -16,
  },
  navMicCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navMicIcon: {
    fontSize: 20,
  },
  navLabelCenter: {
    fontSize: 11,
    fontWeight: '600',
    color: '#18181B',
    marginTop: 2,
  },
  navIcon: {
    fontSize: 20,
    color: '#A1A1AA',
  },
  navLabel: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 2,
    fontWeight: '500',
  },
  navTabActive: {},
  navIconActive: {
    fontSize: 20,
    color: '#18181B',
  },
  navLabelActive: {
    fontSize: 11,
    color: '#18181B',
    fontWeight: '700',
    marginTop: 2,
  },
});
