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
import { BottomNavBar } from '@/components/BottomNavBar';
import { AppIcon } from '@/components/AppIcon';

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
  const { ledgerVersion, triggerRefresh } = useVoice();

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

  const totalGiven = useMemo(() => {
    return entries
      .filter((e) => e.entry_type === 'udhaar')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

  const totalReceived = useMemo(() => {
    return entries
      .filter((e) => e.entry_type === 'wusool' || e.entry_type === 'payment')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [entries]);

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

  const handleShareStatement = async () => {
    const storeName = shop?.shop_name || 'ڈیجی منشی رجسٹر';
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

  const ownerGreeting = shop?.owner_name ? `السلام علیکم، ${shop.owner_name}` : 'السلام علیکم، محترم دکاندار';
  const shopTitle = shop?.shop_name || 'ڈیجی منشی رجسٹر';
  const customerInitial = name && name.trim() ? name.trim()[0] : 'گ';

  const renderEntry = ({ item }: { item: Entry }) => {
    const isUdhaar = item.entry_type === 'udhaar';
    const dateFormatted = new Date(item.created_at).toLocaleDateString('ur-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={styles.entryRowCard}>
        {/* Left: Amount & Running Balance */}
        <View style={styles.entryAmountCol}>
          <Text style={[styles.entryAmountText, isUdhaar ? styles.amtRed : styles.amtGreen]}>
            {isUdhaar ? '+Rs. ' : '-Rs. '}
            {item.amount.toLocaleString()}
          </Text>
          <Text style={styles.entryBalanceSub}>بقایا: {balance.toLocaleString()}</Text>
        </View>

        {/* Right: Type, Description, Date */}
        <View style={styles.entryDetailsCol}>
          <View style={styles.entryTypeRow}>
            <View style={[styles.entryDot, isUdhaar ? styles.dotRed : styles.dotGreen]} />
            <Text style={styles.entryTypeTitle}>
              {isUdhaar ? 'ادھار دیا گیا' : 'رقم وصول ہوئی'}
            </Text>
          </View>
          <Text style={styles.entryDescText}>
            {item.description || (isUdhaar ? 'بیڈ کے پیسے' : 'کیش ادائیگی')}
          </Text>
          <Text style={styles.entryDateText}>{dateFormatted} ۰۴:۱۵ شام</Text>
        </View>

        {/* Cancel single entry trigger */}
        <TouchableOpacity
          style={styles.cancelEntryIconBtn}
          onPress={() => setEntryToCancel(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar matching Image 3 */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <AppIcon name="logout" size={16} tintColor="#52525B" />
        </TouchableOpacity>

        <View style={styles.topProfileInfo}>
          <View style={styles.topProfileText}>
            <Text style={styles.topGreetingText}>{ownerGreeting}</Text>
            <Text style={styles.topShopNameText}>{shopTitle}</Text>
          </View>
          <View style={styles.topAvatarWrapper}>
            <View style={styles.topAvatarCircle}>
              <Text style={styles.topAvatarText}>ع</Text>
            </View>
            <View style={styles.greenOnlineDot} />
          </View>
        </View>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSections}>
            {/* Customer Info Row matching Image 3 */}
            <View style={styles.customerProfileRow}>
              <View style={styles.activePillBadge}>
                <Text style={styles.activePillText}>فعال کھاتہ</Text>
              </View>

              <View style={styles.customerMetaRight}>
                <View style={styles.customerTextGroup}>
                  <Text style={styles.customerNameHeader}>{name || 'حماد'}</Text>
                  <Text style={styles.customerPhoneHeader}>+92 321 7654321</Text>
                </View>
                <View style={styles.customerPhotoCircle}>
                  <Text style={styles.customerPhotoInitial}>{customerInitial}</Text>
                </View>
              </View>
            </View>

            {/* Outstanding Summary Card with Orange Border matching Image 3 */}
            <View style={styles.orangeBorderSummaryCard}>
              <View style={styles.cardHeaderTop}>
                <View style={styles.wusoolBadge}>
                  <Text style={styles.wusoolBadgeText}>وصولی باقی</Text>
                </View>
                <Text style={styles.cardHeaderLabel}>کل واجب الادا ادھار (بقایا)</Text>
              </View>

              <Text style={styles.cardLargeAmount}>
                <Text style={styles.urduAmountSmall}>۲۵,۰۰۰ روپے  </Text>
                Rs. {balance.toLocaleString()}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardSplitMetrics}>
                <Text style={styles.metricWusool}>
                  <Text style={styles.metricLabelSmall}>وصول شدہ: </Text>Rs.{' '}
                  {totalReceived.toLocaleString()}
                </Text>
                <Text style={styles.metricUdhaar}>
                  <Text style={styles.metricLabelSmall}>دیا گیا ادھار: </Text>Rs.{' '}
                  {totalGiven.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Two-Button Action Row matching Image 3 */}
            <View style={styles.twoButtonsRow}>
              <TouchableOpacity
                style={styles.btnRecordPayment}
                onPress={() => handleOpenEntryModal('wusool')}
                activeOpacity={0.8}
              >
                <Text style={styles.btnPaymentText}>رقم وصول ہوئی</Text>
                <AppIcon name="tick" size={14} tintColor="#059669" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnAddUdhaar}
                onPress={() => handleOpenEntryModal('udhaar')}
                activeOpacity={0.8}
              >
                <AppIcon name="plus" size={14} tintColor="#FFFFFF" />
                <Text style={styles.btnAddUdhaarText}>ادھار لکھیں</Text>
              </TouchableOpacity>
            </View>

            {/* Transaction History Header */}
            <View style={styles.historyHeaderRow}>
              <Text style={styles.entriesCountBadge}>{entries.length} اندراجات</Text>
              <Text style={styles.historyTitleText}>لین دین کی تاریخ</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#F05700" />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>کوئی لین دین موجود نہیں ہے</Text>
              <Text style={styles.emptySub}>اوپر والے بٹن سے نیا ادھار یا وصولی درج کریں</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footerSection}>
            {/* Primary Orange WhatsApp / PDF Share Button matching Image 3 */}
            <TouchableOpacity
              style={styles.shareOrangeBtn}
              onPress={handleShareStatement}
              activeOpacity={0.8}
            >
              <Text style={styles.shareBtnText}>پی ڈی ایف یا واٹس ایپ پر تفصیل بھیجیں</Text>
              <AppIcon name="send_message" size={14} tintColor="#FFFFFF" />
            </TouchableOpacity>

            {/* Clear Khata Link Button */}
            <TouchableOpacity
              style={styles.clearKhataLinkBtn}
              onPress={() => setShowClearKhataConfirm(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.clearKhataLinkText}>کھاتہ صاف کریں (Clear Khata)</Text>
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

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={[
                      styles.modalSubmitBtn,
                      entryType === 'udhaar' ? styles.btnUdhaarSubmit : styles.btnWusoolSubmit,
                    ]}
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
                  >
                    <Text style={styles.modalCloseBtnText}>منسوخ کریں</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Solid Orange #F05700 Bottom Navigation matching reference images */}
      <BottomNavBar activeTab="khata" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeaderBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topProfileText: {
    alignItems: 'flex-end',
  },
  topGreetingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  topShopNameText: {
    fontSize: 10,
    color: '#71717A',
  },
  topAvatarWrapper: {
    position: 'relative',
  },
  topAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
  },
  greenOnlineDot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerSections: {
    paddingTop: 14,
  },
  customerProfileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activePillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  customerMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customerTextGroup: {
    alignItems: 'flex-end',
  },
  customerNameHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  customerPhoneHeader: {
    fontSize: 11,
    color: '#71717A',
  },
  customerPhotoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerPhotoInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
  },
  orangeBorderSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F05700',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  wusoolBadge: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  wusoolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
  },
  cardHeaderLabel: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
  },
  cardLargeAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#18181B',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  urduAmountSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardSplitMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricWusool: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  metricUdhaar: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18181B',
  },
  metricLabelSmall: {
    fontSize: 11,
    fontWeight: '500',
    color: '#71717A',
  },
  twoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  btnRecordPayment: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnPaymentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  btnAddUdhaar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F05700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  btnAddUdhaarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  entriesCountBadge: {
    fontSize: 11,
    color: '#71717A',
    fontWeight: '600',
  },
  historyTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  entryRowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  entryAmountCol: {},
  entryAmountText: {
    fontSize: 15,
    fontWeight: '800',
  },
  amtRed: {
    color: '#E11D48',
  },
  amtGreen: {
    color: '#059669',
  },
  entryBalanceSub: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  entryDetailsCol: {
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: 12,
  },
  entryTypeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  entryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotRed: {
    backgroundColor: '#E11D48',
  },
  dotGreen: {
    backgroundColor: '#059669',
  },
  entryTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  entryDescText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  entryDateText: {
    fontSize: 10,
    color: '#A1A1AA',
  },
  cancelEntryIconBtn: {
    padding: 6,
  },
  cancelIcon: {
    fontSize: 12,
  },
  footerSection: {
    marginTop: 20,
    gap: 12,
    alignItems: 'center',
  },
  shareOrangeBtn: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F05700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clearKhataLinkBtn: {
    paddingVertical: 8,
  },
  clearKhataLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
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
    backgroundColor: '#F05700',
  },
  btnWusoolSubmit: {
    backgroundColor: '#059669',
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
});
