import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const router = useRouter();

  const handleKeyPress = (val: string) => {
    if (val === '0300') {
      if (phoneNumber.length === 0) {
        setPhoneNumber('0300');
      } else if (!phoneNumber.startsWith('0300')) {
        setPhoneNumber('0300' + phoneNumber.slice(4));
      }
      return;
    }

    if (phoneNumber.length < 11) {
      setPhoneNumber((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleContinue = () => {
    if (phoneNumber.length < 10) {
      Alert.alert('غلط نمبر', 'موبائل نمبر کم از کم 10 یا 11 ہندسوں کا ہونا چاہیے');
      return;
    }

    let formatted = phoneNumber;
    if (formatted.startsWith('0')) {
      formatted = '92' + formatted.substring(1);
    }
    if (!formatted.startsWith('92')) {
      formatted = '92' + formatted;
    }
    formatted = '+' + formatted;
    router.push({ pathname: '/(auth)/pin', params: { phone: formatted } });
  };

  const formatDisplay = (num: string) => {
    if (!num) return '';
    // Format e.g. 0300 1234567
    if (num.length > 4) {
      return `${num.slice(0, 4)} ${num.slice(4)}`;
    }
    return num;
  };

  const isValid = phoneNumber.length >= 10;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerRightSpacer} />
        <TouchableOpacity style={styles.iconCircleBtn} onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.iconCircleText}>✦</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Title Area */}
        <View style={styles.titleSection}>
          <Text style={styles.headingTitle}>اپنا موبائل نمبر درج کریں</Text>
          <Text style={styles.headingSubtitle}>لاگ ان یا نئے کھاتے کے لیے اپنا نمبر درج فرمائیں</Text>
        </View>

        {/* Crisp Input Container */}
        <View style={styles.inputOuterContainer}>
          <Text style={styles.inputLabel}>موبائل فون نمبر</Text>
          <View style={[styles.inputBox, isValid && styles.inputBoxActive]}>
            <View style={styles.phoneDisplay}>
              <Text style={phoneNumber ? styles.phoneText : styles.placeholderText}>
                {phoneNumber ? formatDisplay(phoneNumber) : '3XX XXXXXXX'}
              </Text>
            </View>

            <View style={styles.dialCodeBadge}>
              <Text style={styles.flagIcon}>🇵🇰</Text>
              <Text style={styles.dialCodeText}>+92</Text>
            </View>
          </View>
        </View>

        {/* Minimalist Wireframe Numeric Keypad */}
        <View style={styles.keypadGrid}>
          {/* Row 1 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('1')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>1</Text>
              <Text style={styles.keySubLetters}> </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('2')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>2</Text>
              <Text style={styles.keySubLetters}>ABC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('3')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>3</Text>
              <Text style={styles.keySubLetters}>DEF</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('4')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>4</Text>
              <Text style={styles.keySubLetters}>GHI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('5')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>5</Text>
              <Text style={styles.keySubLetters}>JKL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('6')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>6</Text>
              <Text style={styles.keySubLetters}>MNO</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('7')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>7</Text>
              <Text style={styles.keySubLetters}>PQRS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('8')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>8</Text>
              <Text style={styles.keySubLetters}>TUV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('9')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>9</Text>
              <Text style={styles.keySubLetters}>WXYZ</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={[styles.keyBtn, styles.specialKeyBtn]} onPress={() => handleKeyPress('0300')} activeOpacity={0.6}>
              <Text style={styles.specialKeyText}>0300</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('0')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>0</Text>
              <Text style={styles.keySubLetters}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.keyBtn, styles.specialKeyBtn]} onPress={handleBackspace} activeOpacity={0.6}>
              <Text style={styles.backspaceIcon}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* High-contrast Sleek CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, isValid ? styles.ctaButtonActive : styles.ctaButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaButtonText, isValid ? styles.ctaButtonTextActive : styles.ctaButtonTextDisabled]}>
            آگے بڑھیں
          </Text>
        </TouchableOpacity>

        {/* Trust Assurance Footer */}
        <View style={styles.trustFooter}>
          <Text style={styles.trustText}>🔒 تصدیقی کوڈ (OTP) بذریعہ SMS بھیجا جائے گا</Text>
        </View>
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRightSpacer: {
    width: 36,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconCircleText: {
    fontSize: 14,
    color: '#3F3F46',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  titleSection: {
    marginBottom: 24,
  },
  headingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#18181B',
    textAlign: 'right',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headingSubtitle: {
    fontSize: 13,
    color: '#71717A',
    textAlign: 'right',
  },
  inputOuterContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: '#52525B',
    marginBottom: 8,
    textAlign: 'right',
    fontWeight: '500',
  },
  inputBox: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputBoxActive: {
    borderColor: '#18181B',
  },
  dialCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E4E4E7',
    gap: 6,
  },
  flagIcon: {
    fontSize: 16,
  },
  dialCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181B',
  },
  phoneDisplay: {
    flex: 1,
    paddingRight: 12,
  },
  phoneText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: 1,
  },
  placeholderText: {
    fontSize: 18,
    color: '#A1A1AA',
  },
  keypadGrid: {
    gap: 10,
    marginBottom: 24,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keyBtn: {
    flex: 1,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: {
    fontSize: 22,
    fontWeight: '600',
    color: '#18181B',
  },
  keySubLetters: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '500',
    marginTop: 1,
  },
  specialKeyBtn: {
    backgroundColor: '#FAFAFA',
  },
  specialKeyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#52525B',
  },
  backspaceIcon: {
    fontSize: 20,
    color: '#52525B',
  },
  ctaButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ctaButtonActive: {
    backgroundColor: '#18181B',
  },
  ctaButtonDisabled: {
    backgroundColor: '#E4E4E7',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaButtonTextActive: {
    color: '#FFFFFF',
  },
  ctaButtonTextDisabled: {
    color: '#A1A1AA',
  },
  trustFooter: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  trustText: {
    fontSize: 12,
    color: '#A1A1AA',
    fontWeight: '400',
  },
});
