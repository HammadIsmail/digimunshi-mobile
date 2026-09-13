import { createAudioPlayer } from 'expo-audio';

let activePlayer: any = null;

const SOUND_SOURCES: Record<'newAccount' | 'wrongPin' | 'pinCodeNotSame', any> = {
  newAccount: require('@/assets/voice_messages/newAccountVoice.mp3'),
  wrongPin: require('@/assets/voice_messages/wrongPin.mp3'),
  pinCodeNotSame: require('@/assets/voice_messages/pinCodeNotSame.mp3'),
};

export async function playVoiceAlert(type: 'newAccount' | 'wrongPin' | 'pinCodeNotSame') {
  try {
    if (activePlayer) {
      try {
        activePlayer.pause();
        activePlayer.remove();
      } catch {}
      activePlayer = null;
    }

    const source = SOUND_SOURCES[type];
    if (!source) return;

    const player = createAudioPlayer(source);
    activePlayer = player;
    player.play();
  } catch (err) {
    console.warn('Voice alert playback error:', err);
  }
}
