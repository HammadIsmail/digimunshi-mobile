import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  name: string;
  balance: number;
  phone?: string;
  updated_at?: string;
}

type FilterType = 'all' | 'due' | 'recent' | 'highest';

export default function LedgerScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const { shop } = useAuth();
  const { ledgerVersion, startRecording, stopRecording, isRecording } = useVoice();

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [ledgerVersion, loadCustomers]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  // Computed metrics
  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  }, [customers]);

  const debtorCount = useMemo(() => {
    return customers.filter((c) => c.balance > 0).length;
  }, [customers]);

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }

    if (activeFilter === 'due') {
      list = list.filter((c) => c.balance > 0);
    } else if (activeFilter === 'highest') {
      list.sort((a, b) => b.balance - a.balance);
    }

    return list;
  }, [customers, searchQuery, activeFilter]);

  const handleSendReminder = async (customer: Customer) => {
    const storeName = shop?.shop_name || 'ہماری دکان';
    const msg = `محترم ${customer.name} صاحب! ${storeName} سے آپ کا بقایا ادھار Rs. ${customer.balance.toLocaleString()} واجب الادا ہے۔ برائے مہربانی جلد از جلد ادائیگی فرمائیں۔ شکریہ!`;
    try {
      await Share.share({ message: msg });
    } catch (e) {
      console.log('Error sharing reminder:', e);
    }
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const initialLetter = item.name.trim() ? item.name.trim()[0] : 'گ';
    const hasDue = item.balance > 0;

    return (
      <View style={styles.customerCard}>
        <View style={styles.cardHeader}>
          <View style={styles.nameAvatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initialLetter}</Text>
            </View>
            <View style={styles.nameMetaCol}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.lastActivityText}>
                {item.phone ? item.phone : 'کھاتہ اندراج محفوظ'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, hasDue ? styles.dueBadge : styles.clearBadge]}>
            <View style={[styles.statusDot, hasDue ? styles.dueDot : styles.clearDot]} />
            <Text style={[styles.statusBadgeText, hasDue ? styles.dueBadgeText : styles.clearBadgeText]}>
              {hasDue ? 'ادھار باقی' : 'صاف کھاتہ'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.balanceCol}>
            <Text style={styles.balanceLabel}>کل بقایا رقم</Text>
            <Text style={[styles.balanceAmount, hasDue ? styles.dueAmount : styles.zeroAmount]}>
              Rs. {item.balance.toLocaleString()}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            {hasDue && (
              <TouchableOpacity
                style={styles.reminderBtn}
                onPress={() => handleSendReminder(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.reminderBtnText}>یاددہانی</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.viewDetailBtn}
              onPress={() =>
                router.push({
                  pathname: '/(main)/customer',
                  params: { id: item.id, name: item.name },
                })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.viewDetailBtnText}>کھاتہ دیکھیں</Text>
              <Text style={styles.viewDetailArrow}>‹</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const storeTitle = shop?.shop_name || 'عمران کریانہ سٹور';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Minimal Top Bar (Figma Spec) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>→</Text>
          <Text style={styles.backText}>واپس</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.storeNameText}>{storeTitle}</Text>
          <Text style={styles.headerSubtitle}>کھاتہ رجسٹر</Text>
        </View>

        <View style={styles.placeholderBox} />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerSections}>
            {/* Clean Typography Summary Header */}
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTextGroup}>
                <Text style={styles.summaryLabel}>کل واجب الوصول ادھار</Text>
                <Text style={styles.summaryTotal}>Rs. {totalOutstanding.toLocaleString()}</Text>
              </View>

              <View style={styles.dueSummaryBadge}>
                <View style={styles.dueBadgeDot} />
                <Text style={styles.dueSummaryBadgeText}>
                  {debtorCount} بقایا دار • {customers.length} کھاتے
                </Text>
              </View>
            </View>

            {/* Search & Subtle Filters Module */}
            <View style={styles.searchModule}>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="گاہک کا نام یا نمبر تلاش کریں..."
                  placeholderTextColor="#A1A1AA"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={[styles.voiceSearchBtn, isRecording && styles.voiceSearchBtnActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                  activeOpacity={0.7}
                >
                  <Text style={styles.voiceSearchIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Minimal Filter Tabs */}
              <View style={styles.filterTabsRow}>
                <TouchableOpacity
                  style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setActiveFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === 'all' && styles.filterChipTextActive,
                    ]}
                  >
                    سب (All)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, activeFilter === 'due' && styles.filterChipActive]}
                  onPress={() => setActiveFilter('due')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === 'due' && styles.filterChipTextActive,
                    ]}
                  >
                    ادھار باقی
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    activeFilter === 'highest' && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter('highest')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeFilter === 'highest' && styles.filterChipTextActive,
                    ]}
                  >
                    سب سے زیادہ رقم
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#18181B" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📖</Text>
              <Text style={styles.emptyTitle}>کوئی کھاتہ نہیں ملا</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'دیے گئے نام سے کوئی گاہک نہیں ملا'
                  : 'آواز کے بٹن سے نیا ادھار یا گاہک درج کریں'}
              </Text>
            </View>
          )
        }
      />

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
  headerTitleGroup: {
    alignItems: 'center',
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181B',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#71717A',
  },
  placeholderBox: {
    width: 65,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerSections: {
    paddingTop: 16,
  },
  summaryHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  summaryTextGroup: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#71717A',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'right',
  },
  summaryTotal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.5,
    textAlign: 'right',
  },
  dueSummaryBadge: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dueBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F43F5E',
    marginRight: 6,
  },
  dueSummaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F43F5E',
  },
  searchModule: {
    marginTop: 16,
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#18181B',
    paddingVertical: 8,
    paddingRight: 8,
  },
  voiceSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  voiceSearchBtnActive: {
    backgroundColor: '#EF4444',
  },
  voiceSearchIcon: {
    fontSize: 15,
  },
  filterTabsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  filterChipText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '700',
    color: '#18181B',
  },
  nameMetaCol: {},
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 2,
    textAlign: 'left',
  },
  lastActivityText: {
    fontSize: 12,
    color: '#71717A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dueBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  clearBadge: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dueDot: {
    backgroundColor: '#DC2626',
  },
  clearDot: {
    backgroundColor: '#16A34A',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueBadgeText: {
    color: '#DC2626',
  },
  clearBadgeText: {
    color: '#16A34A',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F4F4F5',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceCol: {},
  balanceLabel: {
    fontSize: 11,
    color: '#71717A',
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  dueAmount: {
    color: '#18181B',
  },
  zeroAmount: {
    color: '#16A34A',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  reminderBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#18181B',
  },
  viewDetailBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 4,
  },
  viewDetailArrow: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    paddingHorizontal: 20,
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
