import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useVoice } from '@/contexts/VoiceContext';
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
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { ledgerVersion } = useVoice();

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



  const renderEntry = ({ item }: { item: Entry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryInfo}>
        <Text style={styles.entryType}>
          {item.entry_type === 'udhaar' ? '💳 ادھار' : '💰 وصولی (جمع)'}
          {item.description ? ` (${item.description})` : ''}
        </Text>

        <Text style={styles.entryDate}>
          {new Date(item.created_at).toLocaleDateString('ur-PK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </View>
      <Text
        style={[
          styles.entryAmount,
          item.entry_type === 'udhaar' ? styles.amountPositive : styles.amountNegative,
        ]}
      >
        {item.entry_type === 'udhaar' ? '+' : '-'} Rs. {item.amount.toLocaleString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4740F" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← واپس</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>کل بقایا ادھار</Text>
        <Text style={styles.balanceAmount}>Rs. {balance.toLocaleString()}</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>کوئی لین دین موجود نہیں ہے</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  backButton: {
    color: '#D4740F',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D4740F',
  },
  list: {
    padding: 20,
  },
  entryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryInfo: {
    flex: 1,
  },
  entryType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 14,
    color: '#999',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  amountPositive: {
    color: '#4CAF50',
  },
  amountNegative: {
    color: '#F44336',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});
