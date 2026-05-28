'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

// 1. UPDATED TYPE ARCHITECTURE SIGNATURE
interface AudioContextType {
  currentStation: any | null;
  isPlaying: boolean;
  volume: number; // Expose actual active integer volume tracking
  tuneIn: (station: any) => void;
  disconnectStream: () => void;
  togglePlayPause: () => void; // New explicit interactive toggle controller
  changeVolume: (volumeLevel: number) => void; // New native audio utility slider bridge
}

const AudioEngineContext = createContext<AudioContextType | undefined>(undefined);

export function AudioEngineProvider({ children }: { children: React.ReactNode }) {
  const [currentStation, setCurrentStation] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.8); // Default state tracking allocation (80%)
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Clean up streaming engine on dismount
  useEffect(() => {
    return () => {
      destroyHlsPipeline();
    };
  }, []);

  const destroyHlsPipeline = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  };

  // Sync native phone lock screen controllers + multimedia peripheral inputs
  useEffect(() => {
    if (!currentStation || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.full_name || 'Live Lecture Stream',
      artist: `@${currentStation.username || 'AfriBlast Broadcaster'}`,
      album: 'AfriBlast Airwaves Platform',
      artwork: [
        { src: currentStation.avatar_url || '/images/logo-192.png', sizes: '192x192', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play();
      setIsPlaying(true);
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      disconnectStream();
    });
  }, [currentStation]);

  const tuneIn = (station: any) => {
    if (!audioRef.current) {
      console.error("Audio DOM node element missing!");
      return;
    }

    destroyHlsPipeline();
    setCurrentStation(station);
    setIsPlaying(true);

    // Guaranteed, active unencrypted sample HLS stream
    const liveStreamUrl = station.stream_url || "https://playertest.longtailvideo.com/adaptive/bipbop/gear4/prog_index.m3u8";

    // Unmute properties explicitly, keeping active configured utility context volumes
    audioRef.current.muted = false;
    audioRef.current.volume = volume;

    if (Hls.isSupported()) {
      console.log("Initializing hls.js pipeline engine targeting:", liveStreamUrl);
      const hls = new Hls({
        liveDurationInfinity: true,
        enableWorker: true
      });
      
      hlsRef.current = hls;
      hls.loadSource(liveStreamUrl);
      hls.attachMedia(audioRef.current);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS Manifest read successfully! Triggering native playback...");
        audioRef.current?.play()
          .then(() => console.log("🔊 Playback successfully started! Audio should be audible."))
          .catch(err => console.warn("Chrome interactive roadblock encountered:", err));
      });

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              disconnectStream();
              break;
          }
        }
      });
    } 
    else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      audioRef.current.src = liveStreamUrl;
      audioRef.current.play().catch(err => console.warn("Safari stream playback error:", err));
    }
  };

  // 2. NEW METHOD: INTERACTIVE PLAY / PAUSE PIPELINE ENGINE CONTROLLER
  const togglePlayPause = () => {
    if (!audioRef.current || !currentStation) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log("⏸ Live stream processing engine paused context.");
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log("▶ Live stream pipeline execution engine active.");
        })
        .catch(err => console.error("Playback restoration error node:", err));
    }
  };

  // 3. NEW METHOD: VOLUMETRIC UTILITY LAYER CONTROLLER
  const changeVolume = (volumeLevel: number) => {
    if (!audioRef.current) return;
    
    // HTML5 Audio nodes require standard normalization clamping bounds ranging from [0.0 to 1.0]
    const normalizedVolume = Math.max(0, Math.min(1, volumeLevel));
    audioRef.current.volume = normalizedVolume;
    setVolume(normalizedVolume);
  };

  const disconnectStream = () => {
    destroyHlsPipeline();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setCurrentStation(null);
    setIsPlaying(false);
  };

  return (
    // 4. INJECT EXPLICIT ROUTING STATE HANDLERS INTO THE CONTEXT PROVIDER VALUE
    <AudioEngineContext.Provider value={{ 
      currentStation, 
      isPlaying, 
      volume, 
      tuneIn, 
      disconnectStream, 
      togglePlayPause, 
      changeVolume 
    }}>
      {children}
      {/* Hidden real native HTML5 Audio element explicitly tied into the React context DOM tree */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="auto" crossOrigin="anonymous" />
    </AudioEngineContext.Provider>
  );
}

export const useAudioEngine = () => {
  const context = useContext(AudioEngineContext);
  if (!context) throw new Error('useAudioEngine must be used within an AudioEngineProvider');
  return context;
};