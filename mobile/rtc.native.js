import { mediaDevices, RTCPeerConnection, RTCIceCandidate, RTCSessionDescription } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { PermissionsAndroid, Platform } from 'react-native';

export async function requestAndroidPermissions(type = 'audio') {
  if (Platform.OS === 'android') {
    try {
      const perms = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (type === 'video') {
        perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      }
      const granted = await PermissionsAndroid.requestMultiple(perms);
      const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      if (!audioGranted) {
        console.warn('[BYTALK rtc.native] RECORD_AUDIO permission was not granted by user');
      }
      return granted;
    } catch (err) {
      console.warn('[BYTALK rtc.native] PermissionsAndroid request error:', err?.message || err);
    }
  }
  return null;
}

export async function getLocalMediaStream(type) {
  if (Platform.OS === 'android') {
    await requestAndroidPermissions(type);
  }

  // Tier 1: Audio with voice processing
  try {
    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: type === 'video' ? { facingMode: 'user' } : false,
    });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    return stream;
  } catch (error) {
    console.warn('[BYTALK rtc.native] Tier 1 audio constraints failed, trying basic audio:', error?.message || error);
    try {
      const fallbackStream = await mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false,
      });
      fallbackStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      return fallbackStream;
    } catch (fallbackError) {
      if (type === 'video') {
        console.warn('[BYTALK rtc.native] Video failed, falling back to audio only');
        const audioOnly = await mediaDevices.getUserMedia({ audio: true, video: false });
        audioOnly.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        return audioOnly;
      }
      throw fallbackError;
    }
  }
}

export function createPeerConnection(iceServers) {
  return new RTCPeerConnection({ iceServers });
}

export function makeSessionDescription(description) {
  return new RTCSessionDescription(description);
}

export function makeIceCandidate(candidate) {
  return new RTCIceCandidate(candidate);
}

export function switchCamera(stream) {
  const track = stream?.getVideoTracks()[0];
  if (!track?._switchCamera) throw new Error('Camera switching is unavailable on this device.');
  track._switchCamera();
}

export function startAudioRoute(type, speakerEnabled = true) {
  try {
    InCallManager.start({ media: type === 'video' ? 'video' : 'audio', auto: true });
    const enableSpeaker = speakerEnabled !== false;
    InCallManager.setForceSpeakerphoneOn(enableSpeaker);
    if (typeof InCallManager.setSpeakerphoneOn === 'function') {
      InCallManager.setSpeakerphoneOn(enableSpeaker);
    }
    InCallManager.setMicrophoneMute(false);
  } catch (e) {
    console.warn('[BYTALK InCallManager] start error:', e?.message || e);
  }
}

export function setAudioRoute(speakerEnabled) {
  try {
    const enableSpeaker = Boolean(speakerEnabled);
    InCallManager.setForceSpeakerphoneOn(enableSpeaker);
    if (typeof InCallManager.setSpeakerphoneOn === 'function') {
      InCallManager.setSpeakerphoneOn(enableSpeaker);
    }
  } catch (e) {
    console.warn('[BYTALK InCallManager] setAudioRoute error:', e?.message || e);
  }
}

export function setMicrophoneMuted(muted) {
  try {
    InCallManager.setMicrophoneMute(Boolean(muted));
  } catch (e) {
    console.warn('[BYTALK InCallManager] setMicrophoneMute error:', e?.message || e);
  }
}

export function stopAudioRoute() {
  try {
    InCallManager.setMicrophoneMute(false);
    InCallManager.stop();
  } catch (e) {
    console.warn('[BYTALK InCallManager] stop error:', e?.message || e);
  }
}
