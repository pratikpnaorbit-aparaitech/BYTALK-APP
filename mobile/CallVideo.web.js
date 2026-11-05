import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';

export default function CallVideo({ stream, label, style, mirror = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      try {
        el.srcObject = stream;
        el.play().catch(() => {});
      } catch (err) {
        console.warn('CallVideo stream assignment error:', err);
      }
    }
    return () => {
      if (el) {
        try {
          el.pause();
          el.srcObject = null;
        } catch {}
      }
    };
  }, [stream]);

  if (!stream) {
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }]}>
        <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingHorizontal: 12 }}>
          {label || 'Camera unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden', backgroundColor: '#000000' }]}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={mirror}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: mirror ? 'scaleX(-1)' : 'none',
          backgroundColor: '#000000',
        }}
      />
    </View>
  );
}
