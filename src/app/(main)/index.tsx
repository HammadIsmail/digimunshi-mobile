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
import { BottomNavBar } from '@/components/BottomNavBar';
import { AppIcon } from '@/components/AppIcon';

export default function HomeScreen() {
  const [summary, setSummary] = useState<{ total_outstanding: number; customer_count: number } | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const router = useRouter();
  const { shop, logout } = useAuth();
  const { lastResponse, isProcessing, isRecording, clearResponse, ledgerVersion } = useVoice();

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

  const ownerName = shop?.owner_name || 'محترم دکاندار';
  const shopName = shop?.shop_name || 'ڈیجی منشی رجسٹر';
  const initialLetter = ownerName.trim() ? ownerName.trim()[0] : 'د';

  const totalDues = summary?.total_outstanding ?? 0;
  const customerCount = summary?.customer_count ?? customers.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar matching Image 5 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.7}>
          <AppIcon name="logout" size={16} tintColor="#52525B" />
        </TouchableOpacity>

        <View style={styles.profileHeaderGroup}>
          <View style={styles.profileTextCol}>
            <Text style={styles.profileGreeting}>السلام علیکم، {ownerName}</Text>
            <Text style={styles.profileShopName}>{shopName}</Text>
          </View>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initialLetter}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Outstanding Balance Hero Card - Solid #F05700 Orange */}
        <View style={styles.balanceHeroCard}>
          <View style={styles.heroCardTopRow}>
            <View style={styles.customerCountBadge}>
              <Text style={styles.customerCountText}>{customerCount} گاہک</Text>
            </View>
            <Text style={styles.heroCardLabel}>کل بقایا ادھار</Text>
          </View>

          <Text style={styles.heroCardAmount}>Rs. {totalDues.toLocaleString()}</Text>

          <View style={styles.heroCardDivider} />

          <TouchableOpacity
            style={styles.heroCardBottomRow}
            onPress={() => router.push('/(main)/ledger')}
            activeOpacity={0.8}
          >
            <View style={styles.viewListLink}>
              <Text style={styles.viewListArrow}>←</Text>
              <Text style={styles.viewListText}>فہرست دیکھیں</Text>
            </View>
            <Text style={styles.detailedLedgerLabel}>تفصیلی کھاتہ رجسٹر</Text>
          </TouchableOpacity>
        </View>

        {/* Center Voice Section with #F05700 Mic Button */}
        <View style={styles.voiceSection}>
          <Text
            style={[
              styles.voiceInstructionText,
              isRecording && styles.voiceInstructionTextActive,
            ]}
          >
            {isRecording ? 'آواز سن رہا ہے... بولیں یا منسوخ کریں' : 'بولنے کے لیے بٹن دبائیں'}
          </Text>
          <MicButton />
        </View>

        {/* Guardrail Voice Confirmation Prompt Modal */}
        {lastResponse?.requires_confirmation && lastResponse.pending_action_id && (
          <View style={styles.confirmationWrapper}>
            <ConfirmationPrompt
              text={lastResponse.response_text}
              pendingActionId={lastResponse.pending_action_id}
              transcript={lastResponse.transcript}
            />
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color="#F05700" />
            <Text style={styles.processingText}>آواز کی شناخت ہو رہی ہے...</Text>
          </View>
        )}

        {/* Voice AI Result Response */}
        {lastResponse && !lastResponse.requires_confirmation && (
          <View style={styles.responseWrapper}>
            <ResponseDisplay
              text={lastResponse.response_text}
              transcript={lastResponse.transcript}
              onDismiss={clearResponse}
            />
          </View>
        )}

        {/* Recent Activity Section matching Image 5 */}
        <View style={styles.recentSection}>
          <View style={styles.recentSectionHeader}>
            <Text style={styles.recentDateLabel}>آج</Text>
            <Text style={styles.recentTitle}>حالیہ لین دین</Text>
          </View>

          {customers.length > 0 ? (
            customers.slice(0, 5).map((c, index) => {
              const isPayment = c.balance <= 0;
              return (
                <TouchableOpacity
                  key={c.id || index}
                  style={styles.recentRowCard}
                  onPress={() =>
                    router.push({
                      pathname: '/(main)/customer',
                      params: { id: c.id, name: c.name },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.recentRowLeft}>
                    <Text
                      style={[
                        styles.recentRowAmount,
                        isPayment ? styles.amtGreen : styles.amtDark,
                      ]}
                    >
                      {isPayment ? '- ' : '+ '}Rs. {Math.abs(c.balance || 1500).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.recentRowRightGroup}>
                    <View style={styles.recentMetaCol}>
                      <Text style={styles.recentName}>{c.name}</Text>
                      <Text style={styles.recentSub}>
                        {isPayment ? 'وصول ہوئے • 2:15 بجے' : 'ادھار دیا • 10 منٹ پہلے'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.recentIconCircle,
                        isPayment ? styles.iconCircleGreen : styles.iconCircleRed,
                      ]}
                    >
                      {isPayment ? (
                        <AppIcon name="tick" size={10} tintColor="#059669" />
                      ) : (
                        <AppIcon name="up_arrow" size={10} tintColor="#DC2626" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyRecentBox}>
              <AppIcon name="khata" size={28} tintColor="#A1A1AA" />
              <Text style={styles.emptyRecentTitle}>کوئی حالیہ لین دین نہیں ہے</Text>
              <Text style={styles.emptyRecentSub}>
                نیا ادھار یا وصولی شامل کرنے کے لیے مائیک کا بٹن دبائیں
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Solid Orange #F05700 Bottom Navigation matching reference images */}
      <BottomNavBar activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileTextCol: {
    alignItems: 'flex-end',
  },
  profileGreeting: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  profileShopName: {
    fontSize: 11,
    color: '#71717A',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  balanceHeroCard: {
    backgroundColor: '#F05700',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 20,
  },
  heroCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customerCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCardLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.95,
  },
  heroCardAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 12,
  },
  heroCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewListLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewListArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  viewListText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailedLedgerLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  voiceInstructionText: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '600',
    marginBottom: 12,
  },
  voiceInstructionTextActive: {
    color: '#F05700',
    fontWeight: '700',
  },
  voicePromptPill: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  voicePromptPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  confirmationWrapper: {
    marginBottom: 16,
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    marginBottom: 14,
  },
  processingText: {
    fontSize: 13,
    color: '#F05700',
    fontWeight: '700',
  },
  responseWrapper: {
    marginBottom: 16,
  },
  recentSection: {
    marginTop: 8,
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    marginBottom: 12,
  },
  recentDateLabel: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  recentRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  recentRowLeft: {},
  recentRowAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
  },
  amtDark: {
    color: '#18181B',
  },
  amtGreen: {
    color: '#059669',
  },
  recentRowRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentMetaCol: {
    alignItems: 'flex-end',
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
  },
  recentSub: {
    fontSize: 11,
    color: '#71717A',
  },
  recentIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRed: {
    backgroundColor: '#FEF2F2',
  },
  iconCircleGreen: {
    backgroundColor: '#ECFDF5',
  },
  emptyRecentBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F4F4F5',
    gap: 8,
    marginTop: 6,
  },
  emptyRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3F3F46',
  },
  emptyRecentSub: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
  },
});
