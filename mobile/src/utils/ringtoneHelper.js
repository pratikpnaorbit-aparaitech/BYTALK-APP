// mobile/src/utils/ringtoneHelper.js
// Handles audible ringing bell sound on incoming and outgoing voice/video calls
import { Platform } from 'react-native';

class RingtoneManager {
  constructor() {
    this.audioContext = null;
    this.intervalId = null;
    this.isPlaying = false;
    this.oscillators = [];
    this.unlocked = false;
  }

  // Initialize or resume Web AudioContext
  getAudioContext() {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  // Synchronously unlock and resume AudioContext from a user click/touch event
  unlockAudio() {
    if (Platform.OS !== 'web') return;
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      this.unlocked = true;
    } catch {}
  }

  // Generate a telephone ring burst using dual tones (440Hz + 480Hz)
  playToneBurst(durationSec = 1.6) {
    if (Platform.OS !== 'web') return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Standard North American / International dual ringing frequencies
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // A4
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now); // B4

      // Gentle gain envelope to avoid clicking
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
      gainNode.gain.setValueAtTime(0.22, now + durationSec - 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec);
      osc2.stop(now + durationSec);

      this.oscillators.push(osc1, osc2);
      setTimeout(() => {
        this.oscillators = this.oscillators.filter((o) => o !== osc1 && o !== osc2);
      }, durationSec * 1000 + 100);
    } catch (err) {
      console.warn('[Ringtone] error playing burst:', err?.message || err);
    }
  }

  // Start continuous ringing bell
  startRinging({ direction = 'incoming' } = {}) {
    // If already ringing, stop previous ringtone first to ensure a fresh cycle
    if (this.isPlaying) {
      this.stopRinging();
    }
    this.isPlaying = true;

    // 1. React Native native in-call manager (Android / iOS)
    if (Platform.OS !== 'web') {
      try {
        const incallMod = require('react-native-incall-manager');
        const InCallManager = incallMod.default || incallMod;
        if (InCallManager) {
          if (direction === 'incoming') {
            InCallManager.startRingtone('_DEFAULT_');
          } else {
            InCallManager.startRingback('_DTMF_');
          }
        }
      } catch (err) {
        console.warn('[Ringtone] InCallManager native ring error:', err?.message || err);
      }
      return;
    }

    // 2. Web implementation with Web Audio API
    const burstDuration = direction === 'incoming' ? 1.6 : 1.2;
    const cycleInterval = direction === 'incoming' ? 3500 : 4000;

    // Play first burst immediately
    this.playToneBurst(burstDuration);

    // Repeat burst according to standard telephone ring cadence
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      this.playToneBurst(burstDuration);
    }, cycleInterval);
  }

  // Stop ringing immediately
  stopRinging() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop active oscillators
    for (const osc of this.oscillators) {
      try {
        osc.stop(0);
        osc.disconnect();
      } catch {}
    }
    this.oscillators = [];

    // Stop native InCallManager
    if (Platform.OS !== 'web') {
      try {
        const incallMod = require('react-native-incall-manager');
        const InCallManager = incallMod.default || incallMod;
        if (InCallManager) {
          InCallManager.stopRingtone();
          InCallManager.stopRingback();
        }
      } catch {}
    }
  }
}

export const ringtoneManager = new RingtoneManager();
export default ringtoneManager;
