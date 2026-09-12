import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = [
  { id: 'grocery', label: 'کریانہ اسٹور' },
  { id: 'general', label: 'جنرل اسٹور' },
  { id: 'medical', label: 'میڈیکل اسٹور' },
  { id: 'other', label: 'کپڑا / دیگر' },
];

export default function RegisterScreen() {
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('grocery');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'profile' | 'pin'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { register } = useAuth();

  const handleProfileContinue = () => {
    if (ownerName.trim().length < 2) {
      Alert.alert('غلطی', 'براہ کرم اپنا نام درست درج فرمائیں');
      return;
    }
    setStep('pin');
  };

  const handleRegister = async () => {
    if (pin.length !== 4) {
      setError('4 ہندسوں کا پن درج کریں');
      return;
    }
    if (pin !== confirmPin) {
      setError('دونوں پن ایک جیسے ہونے چاہئیں');
      return;
    }

    if (!phone) {
      Alert.alert('غلطی', 'موبائل نمبر موجود نہیں ہے۔ پہلے نمبر درج کریں۔');
      router.replace('/(auth)/login');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const combinedName = shopName.trim() ? `${ownerName.trim()} (${shopName.trim()})` : ownerName.trim();
      await register(combinedName, phone, pin);
      router.replace('/(main)');
    } catch (err: any) {
      setError(err.message || 'رجسٹریشن مکمل نہ ہو سکی');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step === 'pin' ? setStep('profile') : router.back())}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.phoneHeaderPill}>
          <Text style={styles.phoneHeaderText}>{phone || '+92 300 0000000'}</Text>
          <View style={styles.greenActiveDot} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Clean Header Typography */}
        <View style={styles.titleSection}>
          <Text style={styles.headingTitle}>نیا کھاتہ بنائیں</Text>
          <Text style={styles.headingSubtitle}>اپنے ڈیجیٹل رجسٹر کے بنیادی کوائف درج کریں</Text>
        </View>

        {step === 'profile' ? (
          <View style={styles.formSection}>
            {/* Input 1: Owner Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>آپ کا نام</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="مثال: عمران خان"
                  placeholderTextColor="#A3A3A3"
                  textAlign="right"
                />
                <Text style={styles.inputIcon}>👤</Text>
              </View>
            </View>

            {/* Input 2: Shop Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>دکان کا نام (اختیاری)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={shopName}
                  onChangeText={setShopName}
                  placeholder="مثال: مدینہ کریانہ اسٹور"
                  placeholderTextColor="#A3A3A3"
                  textAlign="right"
                />
                <Text style={styles.inputIcon}>🏪</Text>
              </View>
            </View>

            {/* Input 3: Business Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>کاروبار کی قسم</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleProfileContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>پن سیٹ کریں →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formSection}>
            {/* PIN Setup */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>نیا 4 ہندسوں کا خفیہ پن</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={pin}
                  onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="numeric"
                  secureTextEntry
                  textAlign="center"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>پن کی دوبارہ تصدیق کریں</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={confirmPin}
                  onChangeText={(t) => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="numeric"
                  secureTextEntry
                  textAlign="center"
                  maxLength={4}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Final Registration CTA */}
            <TouchableOpacity
              style={[styles.primaryBtn, (pin.length !== 4 || confirmPin.length !== 4) && styles.primaryBtnDisabled]}
              onPress={handleRegister}
              disabled={pin.length !== 4 || confirmPin.length !== 4 || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>کھاتہ شروع کریں</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: '#171717',
  },
  phoneHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  greenActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: '#10B981',
  },
  phoneHeaderText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  titleSection: {
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 6,
    textAlign: 'right',
  },
  headingSubtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'right',
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#404040',
    textAlign: 'right',
  },
  inputContainer: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#171717',
  },
  inputIcon: {
    fontSize: 16,
    marginLeft: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  categoryChip: {
    flexBasis: '47%',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  categoryChipSelected: {
    borderColor: '#171717',
    borderWidth: 1.5,
    backgroundColor: '#FAFAFA',
  },
  categoryText: {
    fontSize: 13,
    color: '#737373',
    fontWeight: '500',
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#171717',
    fontWeight: '700',
  },
  primaryBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  primaryBtnDisabled: {
    backgroundColor: '#E5E5E5',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
  },
});
