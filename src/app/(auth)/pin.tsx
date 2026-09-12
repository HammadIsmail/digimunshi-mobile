import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/AppIcon';

export default function PinScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login } = useAuth();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const submitPin = async (fullPin?: string) => {
    const pinToUse = fullPin || pin;
    if (pinToUse.length !== 4) {
      setError('براہ کرم 4 ہندسوں کا پن درج کریں');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(phone || '+923009876543', pinToUse);
      router.replace('/(main)');
    } catch (err: any) {
      setError(err.message || 'غلط پن کوڈ، دوبارہ کوشش کریں');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const displayPhone = phone || '+92 300 9876543';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar matching Image 4 */}
      <View style={styles.topBar}>
        <View style={styles.topDot} />
        <Text style={styles.topPhoneText}>{displayPhone}</Text>
      </View>
      <View style={styles.topLine} />

      <View style={styles.mainContent}>
        {/* Title */}
        <Text style={styles.titleText}>4 ہندسوں کا پن درج کریں</Text>

        {/* 4 PIN Indicator Dots matching Image 4 */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            const isCurrent = index === pin.length;

            return (
              <View
                key={index}
                style={[
                  styles.dotOuter,
                  isFilled && styles.dotFilled,
                  isCurrent && styles.dotCurrent,
                ]}
              >
                {isCurrent && <View style={styles.dotCurrentInner} />}
              </View>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Keypad matching Image 4: #F05700 Orange Digits with Underlines */}
        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            {['1', '2', '3'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.keyItem}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigitText}>{num}</Text>
                <View style={styles.keyUnderline} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {['4', '5', '6'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.keyItem}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigitText}>{num}</Text>
                <View style={styles.keyUnderline} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {['7', '8', '9'].map((num) => (
              <TouchableOpacity
                key={num}
                style={styles.keyItem}
                onPress={() => handleKeyPress(num)}
                activeOpacity={0.6}
              >
                <Text style={styles.keyDigitText}>{num}</Text>
                <View style={styles.keyUnderline} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Row 4: صاف کریں, 0, Backspace */}
          <View style={styles.keypadRow}>
            <TouchableOpacity
              style={styles.keyItem}
              onPress={handleClear}
              activeOpacity={0.6}
            >
              <Text style={styles.clearText}>صاف کریں</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyItem}
              onPress={() => handleKeyPress('0')}
              activeOpacity={0.6}
            >
              <Text style={styles.keyDigitText}>0</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyItem}
              onPress={handleBackspace}
              activeOpacity={0.6}
            >
              <AppIcon name="backspace" width={22} height={16} tintColor="#F05700" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Solid #F05700 Orange Button matching Image 4 */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => submitPin()}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>تصدیق کریں</Text>
          )}
        </TouchableOpacity>

        {/* Register Account Link */}
        <TouchableOpacity
          style={styles.registerLinkBtn}
          onPress={() => router.replace('/(auth)/register')}
          activeOpacity={0.7}
        >
          <Text style={styles.registerPromptText}>
            اگر اکاؤنٹ نہیں ہے تو{' '}
            <Text style={styles.registerHighlightText}>رجسٹر کریں</Text>
          </Text>
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
    marginBottom: 40,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 48,
  },
  dotOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#18181B',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: '#18181B',
  },
  dotCurrent: {
    borderColor: '#18181B',
  },
  dotCurrentInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#18181B',
  },
  errorText: {
    color: '#E11D48',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 24,
    marginBottom: 48,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  keyItem: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  keyDigitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F05700',
    marginBottom: 4,
  },
  keyUnderline: {
    width: 44,
    height: 1.5,
    backgroundColor: '#F05700',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F05700',
  },
  confirmBtn: {
    width: '100%',
    maxWidth: 340,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F05700',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 16,
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  registerLinkBtn: {
    paddingVertical: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  registerPromptText: {
    fontSize: 14,
    color: '#71717A',
    fontWeight: '400',
  },
  registerHighlightText: {
    color: '#F05700',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
