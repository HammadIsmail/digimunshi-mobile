import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useVoice } from '@/contexts/VoiceContext';
import { AppIcon } from './AppIcon';

interface BottomNavBarProps {
  activeTab: 'home' | 'voice' | 'khata';
}

export function BottomNavBar({ activeTab }: BottomNavBarProps) {
  const router = useRouter();
  const { isRecording, startRecording, stopRecording } = useVoice();

  return (
    <View style={styles.bottomNav}>
      {/* Khata Tab (Left in RTL, as shown in reference images) */}
      <TouchableOpacity
        style={styles.navTab}
        onPress={() => router.push('/(main)/ledger')}
        activeOpacity={0.7}
      >
        <AppIcon name="list" size={19} tintColor="#FFFFFF" />
        <Text style={[styles.navLabel, activeTab === 'khata' && styles.navLabelActive]}>
          کھاتہ
        </Text>
      </TouchableOpacity>

      {/* Center Voice Trigger */}
      <TouchableOpacity
        style={styles.navTab}
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <AppIcon
          name="speaker_small"
          size={18}
          tintColor={isRecording ? '#FFD700' : '#FFFFFF'}
        />
        <Text style={[styles.navLabel, isRecording && styles.navLabelRecording]}>
          {isRecording ? 'سن رہے ہیں...' : 'بولیں'}
        </Text>
      </TouchableOpacity>

      {/* Home Tab (Right in RTL, as shown in reference images) */}
      <TouchableOpacity
        style={styles.navTab}
        onPress={() => router.push('/(main)')}
        activeOpacity={0.7}
      >
        <AppIcon name="home" size={18} tintColor="#FFFFFF" />
        <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
          ہوم
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 65,
    backgroundColor: '#F05700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  navLabelActive: {
    fontWeight: '800',
    opacity: 1,
  },
  navLabelRecording: {
    color: '#FFD700',
    fontWeight: '800',
  },
});
