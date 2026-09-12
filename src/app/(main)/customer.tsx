import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Entry {
  id: string;
  amount: number;
  entry_type: string;
  description?: string;
  created_at: string;
}

export default function CustomerScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Modals & confirmation states
  const [showClearKhataConfirm, setShowClearKhataConfirm] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<Entry | null>(null);

  // Quick manual entry modal (Udhaar / Wusool)
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState<'udhaar' | 'wusool'>('udhaar');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [showPaymentThresholdConfirm, setShowPaymentThresholdConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { shop } = useAuth();
  const { ledgerVersion, triggerRefresh, startRecording, stopRecording, isRecording } = useVoice();

  const loadCustomerData = useCallback(async () => {
    if (!id) return;
    try {
      const [balanceData, entriesData] = await Promise.all([
        api.getBalance(id),
        api.getEntries(id).catch(() => []),
      ]);
      setBalance(balanceData.balance);
      setEntries(entriesData);
    } catch (err) {
      console.error('Failed to load customer data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomerData();
  }, [ledgerVersion, loadCustomerData]);

  useFocusEffect(
    useCallback(() => {
      loadCustomerData();
    }, [loadCustomerData])
  );

  // Computed totals for summary card
  const totalGiven = useMemo(() => {
    return entries
      .filter((e) => e.entry_type === 'udhaar')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  const totalReceived = useMemo(() => {
    return entries
      .filter((e) => e.entry_type === 'wusool')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  // Guardrail 1: Clear / Delete Entire Khata Confirmation
  const handleConfirmClearKhata = async () => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      await api.clearCustomerKhata(id);
      setShowClearKhataConfirm(false);
      triggerRefresh();
      await loadCustomerData();
    } catch (err) {
      console.error('Failed to clear khata:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Guardrail 2: Single Entry Cancellation Confirmation
  const handleConfirmCancelEntry = async () => {
    if (!entryToCancel) return;
    setIsActionLoading(true);
    try {
      await api.cancelLedgerEntry(entryToCancel.id);
      setEntryToCancel(null);
      triggerRefresh();
      await loadCustomerData();
    } catch (err) {
      console.error('Failed to cancel entry:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Manual Entry Submission with Guardrail 3 (Payment > 1000 Rs confirmation)
  const handleOpenEntryModal = (type: 'udhaar' | 'wusool') => {
    setEntryType(type);
    setEntryAmount('');
    setEntryNote('');
    setErrorMessage('');
    setShowPaymentThresholdConfirm(false);
    setShowEntryModal(true);
  };

  const handleSubmitEntry = async (forceConfirmed = false) => {
    const amt = parseFloat(entryAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage('برائے مہربانی درست رقم درج کریں۔');
      return;
    }

    // Payment confirmation guardrail: payment above 1,000 Rs
    if (entryType === 'wusool' && amt > 1000 && !forceConfirmed) {
      setShowPaymentThresholdConfirm(true);
      return;
    }

    if (!id) return;
    setIsActionLoading(true);
    setErrorMessage('');

    try {
      await api.createLedgerEntry(
        id,
        amt,
        entryType,
        entryNote.trim() || undefined,
        forceConfirmed || (entryType === 'wusool' && amt > 1000)
      );
      setShowEntryModal(false);
      setShowPaymentThresholdConfirm(false);
      setEntryAmount('');
      setEntryNote('');
      triggerRefresh();
      await loadCustomerData();
    } catch (err: any) {
      if (err.message && err.message.includes('CONFIRMATION_REQUIRED')) {
        setShowPaymentThresholdConfirm(true);
      } else {
        setErrorMessage(err.message || 'اندراج درج کرنے میں مسئلہ پیش آیا۔');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Share Statement via WhatsApp / PDF
  const handleShareStatement = async () => {
    const storeName = shop?.shop_name || 'ہماری دکان';
    let text = `📄 کھاتہ تفصیل - ${name}\nدکان: ${storeName}\nکل بقایا ادھار: Rs. ${balance.toLocaleString()}\n--------------------\n`;

    entries.slice(0, 5).forEach((e) => {
      const typeLabel = e.entry_type === 'udhaar' ? 'ادھار دیا' : 'وصولی ہوئی';
      const dateStr = new Date(e.created_at).toLocaleDateString('ur-PK');
      text += `• ${dateStr}: ${typeLabel} Rs. ${e.amount.toLocaleString()} ${e.description ? `(${e.description})` : ''}\n`;
    });

    text += `--------------------\nشکریہ!`;

    try {
      await Share.share({ message: text });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  const initialLetter = name && name.trim() ? name.trim()[0] : 'گ';

  const renderEntry = ({ item }: { item: Entry }) => {
    const isUdhaar = item.entry_type === 'udhaar';
    const dateFormatted = new Date(item.created_at).toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryMainRow}>
          {/* Right/Urdu aligned details */}
          <View style={styles.entryInfo}>
            <View style={styles.entryTypeRow}>
              <View style={[styles.entryTypeDot, isUdhaar ? styles.udhaarDot : styles.wusoolDot]} />
              <Text style={styles.entryTypeTitle}>
                {isUdhaar ? 'ادھار دیا گیا' : 'رقم وصول ہوئی'}
              </Text>
            </View>

            {item.description ? (
              <Text style={styles.entryDescription}>{item.description}</Text>
            ) : null}

            <Text style={styles.entryDateText}>{dateFormatted}</Text>
          </View>

          {/* Left aligned Amount & Cancel Button */}
          <View style={styles.entryAmountGroup}>
            <Text style={[styles.entryAmount, isUdhaar ? styles.udhaarAmount : styles.wusoolAmount]}>
              {isUdhaar ? '+ ' : '- '}Rs. {item.amount.toLocaleString()}
            </Text>

            <TouchableOpacity
              style={styles.cancelEntryBtn}
              onPress={() => setEntryToCancel(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelEntryIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#18181B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Clean Minimal Top Bar (Figma Spec) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>→</Text>
          <Text style={styles.backText}>واپس</Text>
        </TouchableOpacity>

        <View style={styles.customerHeaderCenter}>
          <View style={styles.customerAvatarSmall}>
            <Text style={styles.customerAvatarTextSmall}>{initialLetter}</Text>
          </View>
          <View style={styles.customerMetaSmall}>
            <Text style={styles.customerNameHeader}>{name}</Text>
            <Text style={styles.customerStatusHeader}>
              {balance > 0 ? 'وصولی باقی' : 'صاف کھاتہ'}
            </Text>
          </View>
        </View>

        <View style={styles.activeAccountPill}>
          <Text style={styles.activeAccountPillText}>فعال کھاتہ</Text>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerComponentContainer}>
            {/* Minimal Summary Card with Subtle Refined Outline (Figma Spec) */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>کل واجب الادا ادھار (بقایا)</Text>
              <Text style={styles.summaryCardBalance}>Rs. {balance.toLocaleString()}</Text>

              <View style={styles.summaryCardDivider} />

              <View style={styles.summaryMetricsRow}>
                <View style={styles.summaryMetricItem}>
                  <Text style={styles.metricLabel}>دیا گیا ادھار:</Text>
                  <Text style={styles.metricValueUdhaar}>Rs. {totalGiven.toLocaleString()}</Text>
                </View>

                <View style={styles.summaryMetricItem}>
                  <Text style={styles.metricLabel}>وصول شدہ:</Text>
                  <Text style={styles.metricValueWusool}>Rs. {totalReceived.toLocaleString()}</Text>
                </View>
              </View>
            </View>

            {/* Clean Two-Button Action Row (Figma Spec) */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.btnRecordPayment}
                onPress={() => handleOpenEntryModal('wusool')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnRecordPaymentText}>- رقم وصولی</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnAddUdhaar}
                onPress={() => handleOpenEntryModal('udhaar')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnAddUdhaarText}>+ ادھار لکھیں</Text>
              </TouchableOpacity>
            </View>

            {/* Transaction History Header */}
            <View style={styles.historyHeaderRow}>
              <View style={styles.entriesCountPill}>
                <Text style={styles.entriesCountText}>{entries.length} اندراجات</Text>
              </View>
              <Text style={styles.historySectionTitle}>لین دین کی تاریخ</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>کوئی لین دین موجود نہیں ہے</Text>
            <Text style={styles.emptySub}>اوپر والے بٹن یا آواز سے نیا ادھار یا وصولی درج کریں</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerComponentContainer}>
            {/* Share statement via PDF or WhatsApp (Figma Spec) */}
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareStatement}
              activeOpacity={0.7}
            >
              <Text style={styles.shareIcon}>📤</Text>
              <Text style={styles.shareBtnText}>پی ڈی ایف یا واٹس ایپ پر تفصیل بھیجیں</Text>
            </TouchableOpacity>

            {/* Clear Khata with Soft Delete Confirmation (Figma Spec) */}
            <TouchableOpacity
              style={styles.clearKhataBtn}
              onPress={() => setShowClearKhataConfirm(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.clearKhataBtnText}>کھاتہ صاف کریں (Clear Khata)</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Delete / Clear Khata Guardrail Confirmation Modal */}
      {showClearKhataConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmModalBadge}>
              <Text style={styles.confirmModalBadgeText}>⚠️ تصدیق فرمائیں (کھاتہ صاف کرنا)</Text>
            </View>
            <Text style={styles.confirmModalQuestion}>
              {name} کا پورا کھاتہ صاف کرنا ہے، {balance.toLocaleString()} روپے — پکا؟
            </Text>
            <Text style={styles.confirmModalNotice}>
              یہ عمل گاہک کے تمام بقایا جات کو منسوخ (Soft Delete) کر دے گا۔
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleConfirmClearKhata}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>✓ ہاں، پورا کھاتہ صاف کر دو</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setShowClearKhataConfirm(false)}
                disabled={isActionLoading}
              >
                <Text style={styles.modalCancelBtnText}>✗ نہیں، رہنے دو</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Single Entry Cancellation Guardrail Confirmation Modal */}
      {entryToCancel && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalCard}>
            <View style={styles.confirmModalBadge}>
              <Text style={styles.confirmModalBadgeText}>⚠️ تصدیق فرمائیں (اندراج منسوخی)</Text>
            </View>
            <Text style={styles.confirmModalQuestion}>
              کیا آپ یہ اندراج ({entryToCancel.amount.toLocaleString()} روپے) منسوخ کرنا چاہتے ہیں؟
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                onPress={handleConfirmCancelEntry}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>✓ ہاں، منسوخ کریں</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, styles.modalCancelBtn]}
                onPress={() => setEntryToCancel(null)}
                disabled={isActionLoading}
              >
                <Text style={styles.modalCancelBtnText}>✗ نہیں</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Manual Udhaar / Payment Modal */}
      <Modal
        visible={showEntryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEntryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.entryModalCard}>
            <Text style={styles.entryModalTitle}>
              {entryType === 'udhaar' ? 'نیا ادھار درج کریں' : 'رقم وصولی درج کریں'}
            </Text>
            <Text style={styles.entryModalSub}>گاہک: {name}</Text>

            {/* Payment > 1000 Rs Confirmation Warning Box */}
            {showPaymentThresholdConfirm && (
              <View style={styles.thresholdConfirmBox}>
                <Text style={styles.thresholdBadge}>⚠️ تصدیق فرمائیں (بڑی رقم کی وصولی)</Text>
                <Text style={styles.thresholdText}>
                  کیا آپ نے واقعی {name} سے {parseFloat(entryAmount || '0').toLocaleString()} روپے وصول کیے ہیں؟
                </Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalConfirmBtn]}
                    onPress={() => handleSubmitEntry(true)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.modalConfirmBtnText}>✓ ہاں، وصولی درج کریں</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, styles.modalCancelBtn]}
                    onPress={() => setShowPaymentThresholdConfirm(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>✗ منسوخ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!showPaymentThresholdConfirm && (
              <>
                <Text style={styles.inputLabel}>رقم (روپے)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="مثلاً: 1500"
                  placeholderTextColor="#A1A1AA"
                  keyboardType="numeric"
                  value={entryAmount}
                  onChangeText={setEntryAmount}
                  textAlign="right"
                />

                <Text style={styles.inputLabel}>تفصیل / سودا (اختیاری)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="مثلاً: راشن، دہی، کیش ادائیگی"
                  placeholderTextColor="#A1A1AA"
                  value={entryNote}
                  onChangeText={setEntryNote}
                  textAlign="right"
                />

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, entryType === 'udhaar' ? styles.btnUdhaarSubmit : styles.btnWusoolSubmit]}
                    onPress={() => handleSubmitEntry(false)}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.modalSubmitBtnText}>
                        {entryType === 'udhaar' ? 'ادھار درج کریں' : 'وصولی درج کریں'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowEntryModal(false)}
                    disabled={isActionLoading}
                  >
                    <Text style={styles.modalCloseBtnText}>منسوخ کریں</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Minimal Bottom Navigation (Figma Spec) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => router.push('/(main)')}
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>ہوم</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, styles.navTabCenter]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          <View style={[styles.navMicCircle, isRecording && styles.navMicCircleActive]}>
            <Text style={styles.navMicIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
          </View>
          <Text style={styles.navLabelCenter}>بولیں</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, styles.navTabActive]}
          onPress={() => router.push('/(main)/ledger')}
          activeOpacity={0.7}
        >
          <Text style={styles.navIconActive}>📒</Text>
          <Text style={styles.navLabelActive}>کھاتہ</Text>
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
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  backArrow: {
    fontSize: 14,
    color: '#18181B',
    marginRight: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  customerHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  customerAvatarTextSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  customerMetaSmall: {},
  customerNameHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  customerStatusHeader: {
    fontSize: 10,
    color: '#71717A',
  },
  activeAccountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeAccountPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerComponentContainer: {
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryCardLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 6,
  },
  summaryCardBalance: {
    fontSize: 30,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  summaryCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 11,
    color: '#71717A',
    marginBottom: 2,
  },
  metricValueUdhaar: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  metricValueWusool: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  btnAddUdhaar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAddUdhaarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnRecordPayment: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRecordPaymentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  historySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  entriesCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F4F4F5',
  },
  entriesCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717A',
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  entryMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  entryTypeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 2,
  },
  entryTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  udhaarDot: {
    backgroundColor: '#DC2626',
  },
  wusoolDot: {
    backgroundColor: '#16A34A',
  },
  entryTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  entryDescription: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
    textAlign: 'right',
  },
  entryDateText: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  entryAmountGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  udhaarAmount: {
    color: '#DC2626',
  },
  wusoolAmount: {
    color: '#16A34A',
  },
  cancelEntryBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F4F4F5',
  },
  cancelEntryIcon: {
    fontSize: 12,
  },
  footerComponentContainer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  shareBtn: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  clearKhataBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearKhataBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  confirmModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  confirmModalBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  confirmModalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  confirmModalQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 22,
  },
  confirmModalNotice: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'right',
    marginBottom: 16,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtn: {
    backgroundColor: '#DC2626',
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  modalCancelBtn: {
    backgroundColor: '#F4F4F5',
  },
  modalCancelBtnText: {
    color: '#18181B',
    fontWeight: '600',
    fontSize: 12,
  },
  entryModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  entryModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'right',
    marginBottom: 4,
  },
  entryModalSub: {
    fontSize: 12,
    color: '#71717A',
    textAlign: 'right',
    marginBottom: 16,
  },
  thresholdConfirmBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginBottom: 12,
  },
  thresholdBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'right',
    marginBottom: 6,
  },
  thresholdText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18181B',
    textAlign: 'right',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#18181B',
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modalSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnUdhaarSubmit: {
    backgroundColor: '#0F172A',
  },
  btnWusoolSubmit: {
    backgroundColor: '#16A34A',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalCloseBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#71717A',
    fontWeight: '600',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  navMicCircleActive: {
    backgroundColor: '#EF4444',
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
