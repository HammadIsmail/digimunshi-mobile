import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const [ownerName, setOwnerName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'name' | 'pin' | 'confirm'>('name');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { register } = useAuth();

  const handleNameSubmit = () => {
    if (ownerName.trim().length < 2) {
      Alert.alert('Galat', 'Naam kam se kam 2 letters ka hona chahiye');
      return;
    }
    setStep('pin');
  };

  const handleDigit = (digit: string) => {
    if (step === 'pin') {
      if (pin.length < 6) {
        const newPin = pin + digit;
        setPin(newPin);
        setError('');
        if (newPin.length === 4 || newPin.length === 6) {
          setStep('confirm');
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 6) {
        const newConfirm = confirmPin + digit;
        setConfirmPin(newConfirm);
        setError('');
        if (newConfirm.length === pin.length) {
          handleRegister(newConfirm);
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'pin') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleRegister = async (finalPin: string) => {
    if (!phone || !ownerName) return;

    if (finalPin !== pin) {
      setError('PIN match nahi kar raha. Dobara try karein.');
      setPin('');
      setConfirmPin('');
      setStep('pin');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await register(ownerName, phone, finalPin);
      router.replace('/(main)');
    } catch (error: any) {
      setError(error.message || 'Registration failed');
      setPin('');
      setConfirmPin('');
      setStep('pin');
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

  if (step === 'name') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Aap ka Naam</Text>
          <Text style={styles.subtitle}>Apna naam daliye</Text>

          <TextInput
            style={styles.nameInput}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Jaise: Bilal Ahmed"
            placeholderTextColor="#999"
            autoFocus
          />

          <TouchableOpacity style={styles.button} onPress={handleNameSubmit}>
            <Text style={styles.buttonText}>Aagay barhein</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 'pin' ? 'Apna PIN Banayein' : 'PIN Confirm Karein'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'pin' ? '4-6 digit PIN banayein' : 'PIN dobara daliye'}
        </Text>

        <View style={styles.pinDisplay}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < (step === 'pin' ? pin : confirmPin).length && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading && <Text style={styles.loadingText}>Register ho raha hai...</Text>}

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

        <TouchableOpacity onPress={() => setStep('name')}>
          <Text style={styles.backText}>← Naam badlein</Text>
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
  nameInput: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#D4740F',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
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
});
