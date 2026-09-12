import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/AppIcon';

export default function RegisterScreen() {
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState('karyana');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!ownerName.trim()) {
      setError('براہ کرم اپنا نام درج کریں');
      return;
    }
    if (!shopName.trim()) {
      setError('براہ کرم دکان کا نام درج کریں');
      return;
    }
    if (pin.length !== 4) {
      setError('براہ کرم 4 ہندسوں کا پن سیٹ کریں');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const phoneNumber = phone || '+923009876543';
      await register(ownerName.trim(), phoneNumber, pin);
      router.replace('/(main)');
    } catch (err: any) {
      setError(err.message || 'رجسٹریشن میں مسئلہ پیش آیا');
    } finally {
      setLoading(false);
    }
  };

  const displayPhone = phone || '+92 300 9876543';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar matching Image 2 */}
      <View style={styles.topBar}>
        <View style={styles.topDot} />
        <Text style={styles.topPhoneText}>{displayPhone}</Text>
      </View>
      <View style={styles.topLine} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title & Subtitle matching Image 2 */}
        <View style={styles.headerSection}>
          <Text style={styles.titleText}>نیا کھاتہ بنائیں</Text>
          <Text style={styles.subtitleText}>اپنے ڈیجیٹل رجسٹر کے بنیادی کوائف درج کریں</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Input: آپ کا نام */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>آپ کا نام</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="محمد عمران"
              placeholderTextColor="#94A3B8"
              value={ownerName}
              onChangeText={setOwnerName}
              textAlign="right"
            />
            <Text style={styles.inputLeftIcon}>👤</Text>
          </View>
        </View>

        {/* Input: دکان کا نام */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>دکان کا نام</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="عمران کریانہ سٹور"
              placeholderTextColor="#94A3B8"
              value={shopName}
              onChangeText={setShopName}
              textAlign="right"
            />
            <AppIcon name="shop" size={18} tintColor="#94A3B8" />
          </View>
        </View>

        {/* Category Selector matching Image 2 */}
        <View style={styles.categorySection}>
          <View style={styles.categoryHeaderRow}>
            <Text style={styles.categoryHelper}>کوئی ایک منتخب کریں</Text>
            <Text style={styles.categoryLabel}>کاروبار کی قسم</Text>
          </View>

          <View style={styles.chipsGrid}>
            {/* 1. کریانہ سٹور (Active by default matching Image 2) */}
            <TouchableOpacity
              style={[
                styles.categoryChip,
                businessType === 'karyana' && styles.categoryChipActive,
              ]}
              onPress={() => setBusinessType('karyana')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="karyana_store"
                size={18}
                tintColor={businessType === 'karyana' ? '#F05700' : '#64748B'}
              />
              <Text
                style={[
                  styles.chipText,
                  businessType === 'karyana' && styles.chipTextActive,
                ]}
              >
                کریانہ سٹور
              </Text>
              <View
                style={[
                  styles.chipDot,
                  businessType === 'karyana' && styles.chipDotActive,
                ]}
              />
            </TouchableOpacity>

            {/* 2. جنرل سٹور */}
            <TouchableOpacity
              style={[
                styles.categoryChip,
                businessType === 'general' && styles.categoryChipActive,
              ]}
              onPress={() => setBusinessType('general')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="general_store"
                size={18}
                tintColor={businessType === 'general' ? '#F05700' : '#64748B'}
              />
              <Text
                style={[
                  styles.chipText,
                  businessType === 'general' && styles.chipTextActive,
                ]}
              >
                جنرل سٹور
              </Text>
              <View
                style={[
                  styles.chipDot,
                  businessType === 'general' && styles.chipDotActive,
                ]}
              />
            </TouchableOpacity>

            {/* 3. کپڑے / دیگر */}
            <TouchableOpacity
              style={[
                styles.categoryChip,
                businessType === 'clothing' && styles.categoryChipActive,
              ]}
              onPress={() => setBusinessType('clothing')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="clothing_store"
                size={18}
                tintColor={businessType === 'clothing' ? '#F05700' : '#64748B'}
              />
              <Text
                style={[
                  styles.chipText,
                  businessType === 'clothing' && styles.chipTextActive,
                ]}
              >
                کپڑے / دیگر
              </Text>
              <View
                style={[
                  styles.chipDot,
                  businessType === 'clothing' && styles.chipDotActive,
                ]}
              />
            </TouchableOpacity>

            {/* 4. میڈیکل سٹور */}
            <TouchableOpacity
              style={[
                styles.categoryChip,
                businessType === 'medical' && styles.categoryChipActive,
              ]}
              onPress={() => setBusinessType('medical')}
              activeOpacity={0.8}
            >
              <AppIcon
                name="medical_store"
                size={18}
                tintColor={businessType === 'medical' ? '#F05700' : '#64748B'}
              />
              <Text
                style={[
                  styles.chipText,
                  businessType === 'medical' && styles.chipTextActive,
                ]}
              >
                میڈیکل سٹور
              </Text>
              <View
                style={[
                  styles.chipDot,
                  businessType === 'medical' && styles.chipDotActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* PIN Setup Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>4 ہندسوں کا پن کوڈ مقرر کریں</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              textAlign="right"
            />
            <AppIcon name="lock" size={16} tintColor="#94A3B8" />
          </View>
        </View>

        {/* Solid #F05700 Orange Button with Arrow matching Image 2 */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.submitBtnContent}>
              <Text style={styles.arrowIcon}>←</Text>
              <Text style={styles.submitBtnText}>کھاتہ شروع کریں</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  topDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  topPhoneText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  topLine: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  headerSection: {
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 13,
    color: '#71717A',
    lineHeight: 20,
  },
  errorText: {
    color: '#E11D48',
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
    textAlign: 'right',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#18181B',
    paddingVertical: 10,
    paddingLeft: 10,
  },
  inputLeftIcon: {
    fontSize: 16,
    color: '#94A3B8',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryHelper: {
    fontSize: 11,
    color: '#94A3B8',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181B',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    width: '48%',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  categoryChipActive: {
    borderColor: '#F05700',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  chipDotActive: {
    backgroundColor: '#F05700',
    borderColor: '#F05700',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#F05700',
    fontWeight: '800',
  },
  submitBtn: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F05700',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
