import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 4 || newPin.length === 6) {
        handleLogin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleLogin = async (pinToUse: string) => {
    if (!phone) return;

    setIsLoading(true);
    setError('');
    try {
      await login(phone, pinToUse);
      router.replace('/(main)');
    } catch (error: any) {
      const msg = error.message || 'Kuch galat ho gaya';
      if (msg.includes('Invalid') || msg.includes('not found') || msg.includes('wrong')) {
        setError('PIN galat hai. Dobara try karein.');
        setPin('');
      } else if (msg.includes('locked')) {
        setError('Account locked hai. Baad mein try karein.');
      } else {
        setError(msg);
        setPin('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderDigit = (digit: string) => (
    <TouchableOpacity
      key={digit}
      style={[styles.digitButton, isLoading && styles.digitButtonDisabled]}
      onPress={() => handleDigit(digit)}
      disabled={isLoading}
    >
      <Text style={styles.digitText}>{digit}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PIN Daliye</Text>
        <Text style={styles.subtitle}>Apna 4-6 digit PIN daliye</Text>

        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[styles.pinDot, i < pin.length && styles.pinDotFilled]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading && <Text style={styles.loadingText}>Check ho raha hai...</Text>}

        <View style={styles.keypad}>
          <View style={styles.keypadRow}>
            {renderDigit('1')}
            {renderDigit('2')}
            {renderDigit('3')}
          </View>
          <View style={styles.keypadRow}>
            {renderDigit('4')}
            {renderDigit('5')}
            {renderDigit('6')}
          </View>
          <View style={styles.keypadRow}>
            {renderDigit('7')}
            {renderDigit('8')}
            {renderDigit('9')}
          </View>
          <View style={styles.keypadRow}>
            <View style={styles.digitButton} />
            {renderDigit('0')}
            <TouchableOpacity style={styles.digitButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>⌫</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Number badlein</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/register', params: { phone } })}>
          <Text style={styles.registerText}>Naya user? Register karein</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  pinDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D4740F',
  },
  pinDotFilled: {
    backgroundColor: '#D4740F',
  },
  errorText: {
    color: '#E53935',
    marginBottom: 16,
    fontSize: 14,
  },
  loadingText: {
    color: '#D4740F',
    marginBottom: 16,
  },
  keypad: {
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  digitButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  digitButtonDisabled: {
    opacity: 0.5,
  },
  digitText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#333',
  },
  deleteText: {
    fontSize: 24,
    color: '#666',
  },
  backText: {
    marginTop: 32,
    color: '#D4740F',
    fontSize: 16,
  },
  registerText: {
    marginTop: 16,
    color: '#666',
    fontSize: 14,
  },
});
