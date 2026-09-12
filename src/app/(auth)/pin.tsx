import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 4) {
        handleLogin(newPin);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleLogin = async (pinToUse: string) => {
    if (!phone) return;

    setIsLoading(true);
    setError('');
    try {
      await login(phone, pinToUse);
      router.replace('/(main)');
    } catch (err: any) {
      const msg = err.message || 'غلطی ہوئی';
      if (msg.includes('Invalid') || msg.includes('not found') || msg.includes('wrong')) {
        setError('درج کردہ پن غلط ہے۔ دوبارہ کوشش کریں۔');
        setPin('');
      } else if (msg.includes('locked')) {
        setError('اکاؤنٹ عارضی طور پر مقفل ہے۔ کچھ دیر بعد کوشش کریں۔');
      } else {
        setError(msg);
        setPin('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderKey = (digit: string) => (
    <TouchableOpacity
      key={digit}
      style={styles.keyButton}
      onPress={() => handleDigit(digit)}
      disabled={isLoading}
      activeOpacity={0.6}
    >
      <Text style={styles.keyText}>{digit}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Store & Account Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.phoneHeaderPill}>
          <Text style={styles.phoneHeaderText}>{phone || '+92 300 0000000'}</Text>
          <View style={styles.greenActiveDot} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.headingTitle}>4 ہندسوں کا پن درج کریں</Text>
          <Text style={styles.headingSubtitle}>اپنے کھاتے میں لاگ ان کرنے کے لیے خفیہ پن درج کریں</Text>
        </View>

        {/* 4 Minimal PIN Indicator Circles */}
        <View style={styles.pinIndicatorsRow}>
          {[0, 1, 2, 3].map((i) => {
            const isFilled = i < pin.length;
            const isActive = i === pin.length;

            return (
              <View
                key={i}
                style={[
                  styles.pinCircle,
                  isFilled && styles.pinCircleFilled,
                  isActive && styles.pinCircleActive,
                  !isFilled && !isActive && styles.pinCircleInactive,
                ]}
              >
                {isActive && <View style={styles.innerActiveDot} />}
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Sleek Minimal Keypad */}
        <View style={styles.keypadGrid}>
          <View style={styles.keypadRow}>
            {renderKey('1')}
            {renderKey('2')}
            {renderKey('3')}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('4')}
            {renderKey('5')}
            {renderKey('6')}
          </View>
          <View style={styles.keypadRow}>
            {renderKey('7')}
            {renderKey('8')}
            {renderKey('9')}
          </View>
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.sideKeyButton} onPress={handleClear} disabled={isLoading}>
              <Text style={styles.clearKeyText}>صاف کریں</Text>
            </TouchableOpacity>

            {renderKey('0')}

            <TouchableOpacity style={styles.sideKeyButton} onPress={handleBackspace} disabled={isLoading}>
              <Text style={styles.backspaceIcon}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, pin.length === 4 && styles.confirmBtnActive]}
          onPress={() => pin.length === 4 && handleLogin(pin)}
          disabled={pin.length < 4 || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>تصدیق کریں</Text>
          )}
        </TouchableOpacity>

        {/* Secondary Link */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push({ pathname: '/(auth)/register', params: { phone } })}
        >
          <Text style={styles.registerLinkText}>نیا اکاؤنٹ بنانا چاہتے ہیں؟ رجسٹریشن کریں</Text>
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
    color: '#111827',
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
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  headingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'right',
  },
  headingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'right',
  },
  pinIndicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: 18,
  },
  pinCircle: {
    width: 16,
    height: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircleFilled: {
    backgroundColor: '#111827',
    borderColor: '#111827',
    borderWidth: 1,
  },
  pinCircleActive: {
    borderWidth: 1.5,
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  innerActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: '#111827',
  },
  pinCircleInactive: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 13,
    marginVertical: 4,
  },
  keypadGrid: {
    gap: 12,
    marginVertical: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  keyButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#111827',
  },
  sideKeyButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearKeyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  backspaceIcon: {
    fontSize: 20,
    color: '#4B5563',
  },
  confirmBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnActive: {
    backgroundColor: '#000000',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerLinkText: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
