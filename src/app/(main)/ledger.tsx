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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useVoice } from '@/contexts/VoiceContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { BottomNavBar } from '@/components/BottomNavBar';
import { AppIcon } from '@/components/AppIcon';

interface Customer {
  id: string;
  name: string;
  balance: number;
  phone?: string;
}

type FilterType = 'all' | 'highest' | 'recent';

export default function LedgerScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const router = useRouter();
  const { shop, logout } = useAuth();
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

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  }, [customers]);

  const debtorCount = useMemo(() => {
    return customers.filter((c) => c.balance > 0).length;
  }, [customers]);

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

    if (activeFilter === 'highest') {
      list.sort((a, b) => b.balance - a.balance);
    }

    return list;
  }, [customers, searchQuery, activeFilter]);

  const handleSendReminder = async (customer: Customer) => {
    const storeName = shop?.shop_name || 'عمران کریانہ سٹور';
    const msg = `محترم ${customer.name} صاحب! ${storeName} سے آپ کا بقایا ادھار Rs. ${customer.balance.toLocaleString()} واجب الادا ہے۔ برائے مہربانی جلد از جلد ادائیگی فرمائیں۔ شکریہ!`;
    try {
      await Share.share({ message: msg });
    } catch (e) {
      console.log('Error sharing reminder:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/(auth)/login');
    }
  };

  const shopTitle = shop?.shop_name || 'عمران کریانہ سٹور';
  const ownerInitial = shop?.owner_name ? shop.owner_name.trim()[0] : 'ع';

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const initialLetter = item.name.trim() ? item.name.trim()[0] : 'گ';
    const hasDue = item.balance > 0;

    return (
      <View style={styles.customerCard}>
        {/* Top Row: Balance on left, Customer details on right */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardBalanceCol}>
            <Text style={styles.cardAmountText}>
              Rs. {item.balance.toLocaleString()}
            </Text>
            <Text style={styles.cardDueSubtext}>
              {hasDue ? 'ادھار باقی' : 'صاف کھاتہ'}
            </Text>
          </View>

          <View style={styles.cardCustomerRight}>
            <View style={styles.cardCustomerMeta}>
              <View style={styles.customerNameDotRow}>
                <View style={[styles.nameDot, hasDue ? styles.dotRed : styles.dotGreen]} />
                <Text style={styles.cardCustomerName}>{item.name}</Text>
              </View>
              <Text style={styles.cardCustomerPhone}>
                {item.phone || '0300-8451290'}
              </Text>
            </View>

            <View style={styles.customerAvatarCircle}>
              <Text style={styles.customerAvatarInitial}>{initialLetter}</Text>
            </View>
          </View>
        </View>

        {/* Middle Row: Relative time & Last purchase note */}
        <View style={styles.cardMiddleRow}>
          <Text style={styles.cardTimeText}>10 منٹ پہلے</Text>
          <Text style={styles.cardLastNote}>آخری: راشن و گھریلو سامان</Text>
        </View>

        {/* Bottom Row: Orange Action Buttons matching Image 1 */}
        <View style={styles.cardButtonsRow}>
          {hasDue && (
            <TouchableOpacity
              style={styles.cardBtnReminder}
              onPress={() => handleSendReminder(item)}
              activeOpacity={0.8}
            >
              <AppIcon name="send_message" size={13} tintColor="#FFFFFF" />
              <Text style={styles.cardBtnText}>یاددہانی</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cardBtnViewKhata}
            onPress={() =>
              router.push({
                pathname: '/(main)/customer',
                params: { id: item.id, name: item.name },
              })
            }
            activeOpacity={0.8}
          >
            <AppIcon name="khata" size={13} tintColor="#FFFFFF" />
            <Text style={styles.cardBtnText}>کھاتہ دیکھیں</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar matching Image 1 */}
      <View style={styles.topHeaderBar}>
        <TouchableOpacity onPress={handleLogout} style={styles.exitBtn} activeOpacity={0.7}>
          <AppIcon name="logout" size={14} tintColor="#52525B" />
          <Text style={styles.exitBtnText}>خروج</Text>
        </TouchableOpacity>

        <View style={styles.topProfileInfo}>
          <View style={styles.topProfileText}>
            <View style={styles.topShopNameRow}>
              <View style={styles.greenOnlineDot} />
              <Text style={styles.topShopNameText}>{shopTitle}</Text>
            </View>
            <Text style={styles.topRegisterSubtext}>
              کھاتہ رجسٹر • Rs. {totalOutstanding.toLocaleString()}
            </Text>
          </View>
          <View style={styles.topAvatarCircle}>
            <Text style={styles.topAvatarText}>{ownerInitial}</Text>
          </View>
        </View>
      </View>

      {/* Hero Summary Card: Solid #F05700 Orange matching Image 1 */}
      <View style={styles.orangeHeroCard}>
        <View style={styles.orangeCardTopRow}>
          <View style={styles.badgePillRow}>
            <View style={styles.orangeBadgePill}>
              <Text style={styles.orangeBadgeText}>{customers.length} کھاتے</Text>
            </View>
            <View style={styles.orangeBadgePill}>
              <View style={styles.redBadgeDot} />
              <Text style={styles.orangeBadgeText}>{debtorCount} بقایا دار</Text>
            </View>
          </View>
          <Text style={styles.orangeCardLabel}>کل واجب الوصول ادھار</Text>
        </View>

        <Text style={styles.orangeCardAmount}>
          Rs. {totalOutstanding.toLocaleString()}
        </Text>
      </View>

      {/* Search Bar & Filter Chips matching Image 1 */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBarRow}>
          <TouchableOpacity
            style={[styles.searchMicCircle, isRecording && styles.searchMicCircleActive]}
            onPress={isRecording ? stopRecording : startRecording}
            activeOpacity={0.7}
          >
            <AppIcon
              name="speaker_small"
              size={14}
              tintColor={isRecording ? '#FFFFFF' : '#52525B'}
            />
          </TouchableOpacity>

          <View style={styles.searchInputGroup}>
            <TextInput
              style={styles.searchInput}
              placeholder="گاہک کا نام یا نمبر تلاش کریں۔"
              placeholderTextColor="#A1A1AA"
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
            <AppIcon name="search" size={15} tintColor="#A1A1AA" />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'recent' && styles.filterPillActive]}
            onPress={() => setActiveFilter('recent')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'recent' && styles.filterPillTextActive,
              ]}
            >
              حالیہ لین دین
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'highest' && styles.filterPillActive]}
            onPress={() => setActiveFilter('highest')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'highest' && styles.filterPillTextActive,
              ]}
            >
              سب سے زیادہ رقم
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'all' && styles.filterPillSolidDark]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextWhite,
              ]}
            >
              سب (All)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#F05700" />
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>کوئی کھاتہ نہیں ملا</Text>
              <Text style={styles.emptySub}>نیا ادھار بول کر یا تلاش کر کے درج کریں</Text>
            </View>
          )
        }
      />

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
  },
  exitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  exitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18181B',
  },
  topProfileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topProfileText: {
    alignItems: 'flex-end',
  },
  topShopNameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  greenOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  topShopNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18181B',
  },
  topRegisterSubtext: {
    fontSize: 10,
    color: '#71717A',
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
  orangeHeroCard: {
    backgroundColor: '#F05700',
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  orangeCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgePillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  orangeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  redBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  orangeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F05700',
  },
  orangeCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  orangeCardAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchMicCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchMicCircleActive: {
    backgroundColor: '#F05700',
    borderColor: '#F05700',
  },
  searchInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#18181B',
    paddingVertical: 6,
    paddingRight: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  filterPillActive: {
    borderColor: '#F05700',
    backgroundColor: '#FFF7ED',
  },
  filterPillSolidDark: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  filterPillText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#F05700',
    fontWeight: '700',
  },
  filterPillTextWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBalanceCol: {},
  cardAmountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#18181B',
  },
  cardDueSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  cardCustomerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardCustomerMeta: {
    alignItems: 'flex-end',
  },
  customerNameDotRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  nameDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotRed: {
    backgroundColor: '#E11D48',
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  cardCustomerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  cardCustomerPhone: {
    fontSize: 11,
    color: '#71717A',
  },
  customerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F4F4F5',
    marginBottom: 10,
  },
  cardTimeText: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  cardLastNote: {
    fontSize: 11,
    color: '#71717A',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardBtnReminder: {
    flex: 0.4,
    height: 38,
    backgroundColor: '#F05700',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardBtnViewKhata: {
    flex: 0.6,
    height: 38,
    backgroundColor: '#F05700',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#71717A',
  },
});
