export async function getLocalMediaStream(type) {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error('Camera and microphone access requires HTTPS or localhost in a supported browser.');
  }

  // Tier 1: Audio with voice processing
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
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
  } catch (tier1Error) {
    console.warn('[BYTALK rtc.web] Advanced audio constraints failed, trying basic audio:', tier1Error?.message || tier1Error);
  }

  // Tier 2: Basic audio constraint
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { facingMode: 'user' } : false,
    });
    stream.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    return stream;
  } catch (tier2Error) {
    if (type === 'video') {
      console.warn('[BYTALK rtc.web] Video failed, attempting audio only');
      const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioOnly.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      return audioOnly;
    }
    throw tier2Error;
  }
}

export function createPeerConnection(iceServers) {
  if (typeof RTCPeerConnection === 'undefined') {
    throw new Error('This browser does not support WebRTC calls.');
  }
  return new RTCPeerConnection({ iceServers });
}

export function makeSessionDescription(description) {
  return new RTCSessionDescription(description);
}

export function makeIceCandidate(candidate) {
  return new RTCIceCandidate(candidate);
}

export async function switchCamera(stream, peerConnection) {
  const currentTrack = stream?.getVideoTracks()[0];
  if (!currentTrack) throw new Error('No active camera is available.');

  const facingMode = currentTrack.getSettings().facingMode === 'user' ? 'environment' : 'user';
  const nextStream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode },
  });
  const nextTrack = nextStream.getVideoTracks()[0];
  const sender = peerConnection?.getSenders().find((item) => item.track?.kind === 'video');
  if (sender) await sender.replaceTrack(nextTrack);
  stream.removeTrack(currentTrack);
  currentTrack.stop();
  stream.addTrack(nextTrack);
}

export function startAudioRoute() {}
export function setAudioRoute() {}
export function setMicrophoneMuted() {}
export function stopAudioRoute() {}
