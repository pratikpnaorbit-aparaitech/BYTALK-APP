import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { PermissionsAndroid, Platform } from 'react-native';

export function createPeerConnection(configuration) {
  return new RTCPeerConnection(configuration);
}

export function createMediaStream() {
  return new MediaStream();
}

export function createSessionDescription(description) {
  return new RTCSessionDescription(description);
}

export function createIceCandidate(candidate) {
  return new RTCIceCandidate(candidate);
}

export async function getUserMedia(video) {
  if (Platform.OS === 'android') {
    try {
      const perms = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
      if (video) perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
      await PermissionsAndroid.requestMultiple(perms);
    } catch (e) {
      console.warn('[BYTALK src/rtc.native] Android permission request error:', e?.message || e);
    }
  }

  try {
    const stream = await mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: video ? { facingMode: 'user' } : false,
    });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    return stream;
  } catch (error) {
    const fallbackStream = await mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: 'user' } : false,
    });
    fallbackStream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    return fallbackStream;
  }
}

export async function switchCamera(stream) {
  const track = stream.getVideoTracks()[0];
  if (typeof track?._switchCamera !== 'function') {
    throw new Error('Camera switching is not supported on this device.');
  }
  track._switchCamera();
  return stream;
}

export async function supportsSpeakerToggle() {
  return true;
}

export async function setSpeakerEnabled(enabled, type) {
  try {
    InCallManager.setForceSpeakerphoneOn(Boolean(enabled));
  } catch (e) {}
  return true;
}

export function setMicrophoneMuted(muted) {
  try {
    InCallManager.setMicrophoneMute(Boolean(muted));
  } catch (e) {}
}

export function startAudioRoute(type) {
  try {
    InCallManager.start({ media: type === 'video' ? 'video' : 'audio', auto: true });
    InCallManager.setMicrophoneMute(false);
  } catch (e) {}
}

export function stopAudioRoute() {
  try {
    InCallManager.setMicrophoneMute(false);
    InCallManager.stop();
  } catch (e) {}
}
