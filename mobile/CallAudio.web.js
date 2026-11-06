import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

export default function CallAudio({ stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    audio.srcObject = stream || null;
    if (stream) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('[BYTALK call] remote audio playback waiting user gesture:', error?.message || 'autoplay denied');
        });
      }
    }
    return () => {
      audio.pause();
      audio.srcObject = null;
    };
  }, [stream]);

  return (
    <View style={{ position: 'absolute', opacity: 0.001, width: 2, height: 2, pointerEvents: 'none', bottom: 0, right: 0 }}>
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        data-bytalk-remote-stream="true"
        style={{ width: '2px', height: '2px' }}
      />
    </View>
  );
}
