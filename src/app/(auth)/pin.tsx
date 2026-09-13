import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { AppIcon } from '@/components/AppIcon';
import { playVoiceAlert } from '@/lib/sound';

export default function PinScreen() {
  const params = useLocalSearchParams<{
    phone?: string;
    mode?: string;
    ownerName?: string;
    shopName?: string;
    businessType?: string;
  }>();

  const router = useRouter();
  const { login, register } = useAuth();

  const isRegister = params.mode === 'register';
  const phone = params.phone || '';

  // For register mode: 2-stage PIN flow ('create' -> 'confirm')
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If no phone was provided, safely redirect to Number screen
  useEffect(() => {
    if (!phone) {
      router.replace({
        pathname: '/(auth)/login',
        params: { mode: isRegister ? 'register' : 'login' },
      });
    }
  }, [phone, isRegister]);

  const handleKeyPress = (num: string) => {
    if (loading) return;
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        handlePinComplete(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (loading) return;
    setPin('');
    setError('');
  };

  const handlePinComplete = (enteredPin: string) => {
    if (isRegister) {
      if (pinStep === 'create') {
        // Stage 1 complete: Save first PIN and transition to confirmation
        setTimeout(() => {
          setFirstPin(enteredPin);
          setPin('');
          setPinStep('confirm');
          setError('');
        }, 150);
      } else {
        // Stage 2 complete: Check if confirmation matches
        if (enteredPin !== firstPin) {
          setError('آپ کا پِن کوڈ ایک جیسا نہیں ہے، براہِ کرم دوبارہ درج کریں۔');
          playVoiceAlert('pinCodeNotSame');
          setTimeout(() => {
            setPin('');
          }, 300);
          return;
        }
        // Match! Submit registration
        executeRegistration(enteredPin);
      }
    } else {
      // Login mode: Submit PIN
      executeLogin(enteredPin);
    }
  };

  const executeLogin = async (enteredPin: string) => {
    setLoading(true);
    setError('');
    try {
      await login(phone, enteredPin);
      router.replace('/(main)');
    } catch (err: any) {
      const errMsg = err.message || '';
      if (
        errMsg.includes('موجود نہیں') ||
        errMsg.includes('Account not found') ||
        errMsg.includes('Shop not found')
      ) {
        setError('آپ کا اکاؤنٹ موجود نہیں ہے۔ براہِ کرم نیا اکاؤنٹ بنائیں۔');
        playVoiceAlert('newAccount');
      } else {
        setError('آپ کا پِن غلط ہے۔ براہِ کرم دوبارہ درست پِن درج کریں۔');
        playVoiceAlert('wrongPin');
      }
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const executeRegistration = async (confirmedPin: string) => {
    setLoading(true);
    setError('');
    try {
      const owner = (params.ownerName || '').trim() || 'دکاندار';
      await register(owner, phone, confirmedPin);
      router.replace('/(main)');
    } catch (err: any) {
      setError(err.message || 'رجسٹریشن میں مسئلہ پیش آیا، دوبارہ کوشش کریں');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (pin.length === 4) {
      handlePinComplete(pin);
    } else {
      setError('براہ کرم 4 ہندسوں کا پن درج کریں');
    }
  };

  const resetToCreateStep = () => {
    setPinStep('create');
    setFirstPin('');
    setPin('');
    setError('');
  };

  const handleTopBack = () => {
    if (isRegister) {
      if (pinStep === 'confirm') {
        resetToCreateStep();
      } else {
        router.back();
      }
    } else {
      router.replace({ pathname: '/(auth)/login', params: { phone, mode: 'login' } });
    }
  };

  const formatPhone = (num?: string) => {
    if (!num) return '';
    if (num.startsWith('+92') && num.length >= 12) {
      return `+92 ${num.slice(3, 6)} ${num.slice(6)}`;
    }
    return num;
  };

  const displayPhone = formatPhone(phone);

  // Dynamic titles and labels based on mode and step
  let title = '4 ہندسوں کا پن درج کریں';
  let subtitle = '';
  let buttonLabel = 'تصدیق کریں';

  if (isRegister) {
    if (pinStep === 'create') {
      title = '4 ہندسوں کا پن مقرر کریں';
      subtitle = 'اپنے اکاؤنٹ کے لیے نیا 4 ہندسوں کا پن کوڈ بنائیں';
      buttonLabel = 'اگلا مرحلہ ←';
    } else {
      title = 'پن کوڈ کی دوبارہ تصدیق کریں';
      subtitle = 'تصدیق کے لیے وہی 4 ہندسوں کا پن دوبارہ درج کریں';
      buttonLabel = 'کھاتہ شروع کریں ←';
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleTopBack} activeOpacity={0.7}>
          <AppIcon name="right_arrow" width={12} height={12} tintColor="#F05700" />
          <Text style={styles.backButtonText}>
            {isRegister && pinStep === 'confirm'
              ? 'دوبارہ پن درج کریں'
              : isRegister
              ? 'تفصیلات'
              : 'نمبر تبدیل کریں'}
          </Text>
        </TouchableOpacity>
        <View style={styles.phoneBadge}>
          <View style={styles.topDot} />
          <Text style={styles.topPhoneText}>{displayPhone}</Text>
        </View>
      </View>
      <View style={styles.topLine} />

      <View style={styles.mainContent}>
        {/* Title & Subtitle */}
        <Text style={styles.titleText}>{title}</Text>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}

        {/* 4 PIN Indicator Dots */}
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

        {/* Keypad */}
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

        {/* Action Button */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleManualSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>

        {/* Alternate Navigation Links */}
        {!isRegister ? (
          <TouchableOpacity
            style={styles.registerLinkBtn}
            onPress={() =>
              router.replace({
                pathname: '/(auth)/login',
                params: { mode: 'register', phone: phone || '' },
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.registerPromptText}>
              اگر اکاؤنٹ نہیں ہے تو{' '}
              <Text style={styles.registerHighlightText}>رجسٹر کریں</Text>
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.registerLinkBtn}
            onPress={() =>
              router.replace({
                pathname: '/(auth)/login',
                params: { mode: 'login', phone: phone || '' },
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.registerPromptText}>
              پہلے سے اکاؤنٹ موجود ہے؟{' '}
              <Text style={styles.registerHighlightText}>لاگ ان کریں</Text>
            </Text>
          </TouchableOpacity>
        )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  backButtonText: {
    fontSize: 13,
    color: '#F05700',
    fontWeight: '600',
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginBottom: 32,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#18181B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 36,
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
    gap: 20,
    marginBottom: 36,
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
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(240, 87, 0, 0.25)' }
      : {
          shadowColor: '#F05700',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        }),
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
