import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';

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
    if (num.length > 4) {
      return `${num.slice(0, 4)} ${num.slice(4)}`;
    }
    return num;
  };

  const isValid = phoneNumber.length >= 10;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Shop Icon on Top Right */}
      <View style={styles.topHeader}>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={styles.shopCircleBtn}
          onPress={() => router.replace('/(auth)/register')}
          activeOpacity={0.7}
        >
          <AppIcon name="shop" width={18} height={16} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false} showsVerticalScrollIndicator={false}>
        {/* Main Title */}
        <View style={styles.titleSection}>
          <Text style={styles.headingTitle}>اپنا موبائل نمبر درج کریں</Text>
        </View>

        {/* Label Row: Left is (+92) پاکستان, Right is موبائل فون نمبر */}
        <View style={styles.labelRow}>
          <Text style={styles.countryLabel}>(+92) پاکستان</Text>
          <Text style={styles.inputLabel}>موبائل فون نمبر</Text>
        </View>

        {/* Input Box */}
        <View style={[styles.inputBox, isValid && styles.inputBoxActive]}>
          <View style={styles.phoneDisplay}>
            <Text style={phoneNumber ? styles.phoneText : styles.placeholderText}>
              <Text style={styles.cursorText}>|</Text>
              {phoneNumber ? formatDisplay(phoneNumber) : '300 1234567'}
            </Text>
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.dialCodeBadge}>
            <Text style={styles.dialCodeText}>+92</Text>
            <AppIcon name="flag" width={22} height={16} />
          </View>
        </View>

        {/* Minimalist Wireframe Keypad with Underline Bars */}
        <View style={styles.keypadGrid}>
          {/* Row 1: 3 (DEF), 2, 1 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('3')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>3</Text>
              <Text style={styles.keySubLetters}>DEF</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('2')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>2</Text>
              <Text style={styles.keySubLettersPlaceholder}> </Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('1')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>1</Text>
              <Text style={styles.keySubLettersPlaceholder}> </Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>
          </View>

          {/* Row 2: 6 (MNO), 5 (JKL), 4 (GHI) */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('6')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>6</Text>
              <Text style={styles.keySubLetters}>MNO</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('5')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>5</Text>
              <Text style={styles.keySubLetters}>JKL</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('4')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>4</Text>
              <Text style={styles.keySubLetters}>GHI</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>
          </View>

          {/* Row 3: 9 (WXYZ), 8 (TUV), 7 (PQRS) */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('9')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>9</Text>
              <Text style={styles.keySubLetters}>WXYZ</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('8')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>8</Text>
              <Text style={styles.keySubLetters}>TUV</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('7')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>7</Text>
              <Text style={styles.keySubLetters}>PQRS</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>
          </View>

          {/* Row 4: Backspace, 0 (+), 0300 */}
          <View style={styles.keypadRow}>
            <TouchableOpacity style={styles.keyBtn} onPress={handleBackspace} activeOpacity={0.6}>
              <View style={styles.backspaceWrapper}>
                <AppIcon name="backspace" width={22} height={16} tintColor="#E05700" />
              </View>
              <Text style={styles.keySubLettersPlaceholder}> </Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('0')} activeOpacity={0.6}>
              <Text style={styles.keyDigit}>0</Text>
              <Text style={styles.keySubLetters}>+</Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.keyBtn} onPress={() => handleKeyPress('0300')} activeOpacity={0.6}>
              <Text style={styles.presetText}>0300</Text>
              <Text style={styles.keySubLettersPlaceholder}> </Text>
              <View style={styles.keyUnderline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* CTA Button: Solid #F05700 with Left Arrow and Text */}
        <TouchableOpacity
          style={[styles.ctaButton, isValid ? styles.ctaButtonActive : styles.ctaButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <View style={styles.ctaContentRow}>
            <AppIcon name="left_arrow" width={14} height={14} tintColor="#FFFFFF" />
            <Text style={styles.ctaButtonText}>آگے بڑھیں</Text>
          </View>
        </TouchableOpacity>

        {/* Trust Assurance Footer */}
        <View style={styles.trustFooter}>
          <AppIcon name="lock" width={11} height={13} style={styles.lockIcon} />
          <Text style={styles.trustText}>تصدیقی کوڈ (OTP) بذریعہ SMS بھیجا جائے گا</Text>
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
    paddingBottom: 8,
  },
  spacer: {
    width: 40,
  },
  shopCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 28,
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#18181B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryLabel: {
    fontSize: 13,
    color: '#3F3F46',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    color: '#3F3F46',
    fontWeight: '500',
  },
  inputBox: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 36,
  },
  inputBoxActive: {
    borderColor: '#F05700',
  },
  phoneDisplay: {
    flex: 1,
    paddingRight: 10,
    justifyContent: 'center',
  },
  phoneText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  placeholderText: {
    fontSize: 19,
    color: '#A1A1AA',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  cursorText: {
    color: '#71717A',
    fontWeight: '300',
  },
  dividerLine: {
    width: 1,
    height: 22,
    backgroundColor: '#D4D4D8',
    marginHorizontal: 10,
  },
  dialCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18181B',
  },
  keypadGrid: {
    gap: 22,
    marginBottom: 44,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  keyDigit: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F05700',
    lineHeight: 30,
  },
  presetText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F05700',
    lineHeight: 30,
  },
  keySubLetters: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F05700',
    marginTop: 2,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  keySubLettersPlaceholder: {
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  keyUnderline: {
    width: 56,
    height: 1.5,
    backgroundColor: '#F05700',
    borderRadius: 1,
    opacity: 0.75,
  },
  backspaceWrapper: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  ctaButtonActive: {
    backgroundColor: '#F05700',
    shadowColor: '#F05700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonDisabled: {
    backgroundColor: '#FDBA74',
  },
  ctaContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockIcon: {
    opacity: 0.7,
  },
  trustText: {
    fontSize: 12,
    color: '#71717A',
    fontWeight: '400',
  },
});

