import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

interface AudioContextType {
  isMusicPlaying: boolean;
  volume: number;
  currentTrackIndex: number;
  toggleMusic: () => void;
  setMusicPlaying: (playing: boolean) => void;
  setVolume: (vol: number) => void;
  playTrack: (index: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  playSound: (type: 'hover' | 'click' | 'shake' | 'open' | 'reveal' | 'pageFlip' | 'doorOpen') => void;
  setPeaceEnvironment: (env: string | null) => void;
  tracks: { title: string; url: string; fallbackUrl?: string; id?: string; label?: string; file?: string; icon?: string }[];
  isPeaceMode: boolean;
  setPeaceMode: (active: boolean) => void;
  selectTrack: (index: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Peaceful track URLs
const AMBIENT_TRACKS = [
  {
    title: "Richy Mitch & The Coal Miners - Evergreen (Instrumental)",
    url: "/audio/evergreen.mp3"
  },
  {
    title: "Love story (Fbeatz Version) (Instrumental)",
    url: "/audio/lovestory.mp3"
  },
  {
    title: "Beethoven - Moonlight Sonata",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c5/Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_%27moonlight%27%2C_op._27_no._2_-_i._adagio_sostenuto.ogg/Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_%27moonlight%27%2C_op._27_no._2_-_i._adagio_sostenuto.ogg.mp3",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_%27moonlight%27%2C_op._27_no._2_-_i._adagio_sostenuto.ogg"
  },
  {
    title: "Debussy - Clair de Lune",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e0/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg.mp3",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Clair_de_lune_%28Claude_Debussy%29_Suite_bergamasque.ogg"
  },
  {
    title: "Satie - Gymnopédie No. 1",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e1/Kevin_MacLeod_-_Erik_Satie_Gymnopedie_No_1.ogg/Kevin_MacLeod_-_Erik_Satie_Gymnopedie_No_1.ogg.mp3",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Kevin_MacLeod_-_Erik_Satie_Gymnopedie_No_1.ogg"
  },
  {
    title: "Bach - Cello Suite No. 1",
    url: "https://upload.wikimedia.org/wikipedia/commons/transcoded/6/67/Johann_Sebastian_Bach_-_Cello_Suite_No._1_-_1._Prelude.ogg/Johann_Sebastian_Bach_-_Cello_Suite_No._1_-_1._Prelude.ogg.mp3",
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/6/67/Johann_Sebastian_Bach_-_Cello_Suite_No._1_-_1._Prelude.ogg"
  }
];

const PEACE_TRACKS = [
  {
    id: 'summer',
    label: 'Summer',
    title: 'Summer',
    icon: 'sun',
    file: '/peace-room/summer/audio.webm',
    url: '/peace-room/summer/audio.webm',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    title: 'Ocean',
    icon: 'waves',
    file: '/peace-room/ocean/audio.webm',
    url: '/peace-room/ocean/audio.webm',
  },
  {
    id: 'rain',
    label: 'Rain',
    title: 'Rain',
    icon: 'cloud-rain',
    file: '/peace-room/rain/audio.webm',
    url: '/peace-room/rain/audio.webm',
  }
];

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.2);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPeaceMode, setPeaceMode] = useState<boolean>(false);

  const tracks = isPeaceMode ? PEACE_TRACKS : AMBIENT_TRACKS;

  // Keep volume and track index refs up-to-date to prevent closure staleness in procedural synth
  const volumeRef = useRef<number>(volume);
  const currentTrackIndexRef = useRef<number>(currentTrackIndex);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Keep a ref of play state for cleanup function access
  const isMusicPlayingRef = useRef(isMusicPlaying);
  useEffect(() => {
    isMusicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  const isUnmountingRef = useRef(false);
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);

  // Web Audio Context for synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  
  // Environment node references
  const rainNodeRef = useRef<AudioNode | null>(null);
  const fireplaceNodeRef = useRef<AudioNode | null>(null);
  const forestNodeRef = useRef<AudioNode | null>(null);
  
  // Howler instances
  const trackHowlRef = useRef<Howl | null>(null);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Context on user action
  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Stop/reset when toggling peace mode
  useEffect(() => {
    if (trackHowlRef.current) {
      trackHowlRef.current.unload();
      trackHowlRef.current = null;
    }
    if (nativeAudioRef.current) {
      nativeAudioRef.current.pause();
      nativeAudioRef.current = null;
    }
    stopProceduralSynth();
    setIsMusicPlaying(false);
    setCurrentTrackIndex(0);
  }, [isPeaceMode]);

  // Set up background track (Howler for ambient, native Audio element for Peace Mode WebM soundscapes)
  useEffect(() => {
    if (isMusicPlaying) {
      const currentTrack = tracks[currentTrackIndex];
      if (!currentTrack) return;

      if (isPeaceMode) {
        // Stop Howler if playing
        if (trackHowlRef.current) {
          trackHowlRef.current.unload();
          trackHowlRef.current = null;
        }

        const targetSrc = window.location.origin + currentTrack.url;
        
        if (!nativeAudioRef.current || nativeAudioRef.current.src !== targetSrc) {
          const oldAudio = nativeAudioRef.current;
          
          const newAudio = new Audio(currentTrack.url);
          newAudio.loop = true;
          newAudio.volume = oldAudio ? 0 : volume;
          
          nativeAudioRef.current = newAudio;
          newAudio.play().catch(err => console.warn("Native audio play failed:", err));

          if (oldAudio) {
            // Smooth 1s crossfade between native Audio elements
            const CROSSFADE_TIME = 1000;
            const steps = 20;
            const stepTime = CROSSFADE_TIME / steps;
            let currentStep = 0;
            const oldVol = oldAudio.volume;

            const fadeInterval = setInterval(() => {
              currentStep++;
              const progress = currentStep / steps;

              oldAudio.volume = Math.max(0, oldVol * (1 - progress));
              newAudio.volume = Math.min(volumeRef.current, volumeRef.current * progress);

              if (currentStep >= steps) {
                clearInterval(fadeInterval);
                oldAudio.pause();
              }
            }, stepTime);
          }
        } else {
          nativeAudioRef.current.volume = volume;
          nativeAudioRef.current.play().catch(err => console.warn("Native audio play failed:", err));
        }

        stopProceduralSynth();
      } else {
        // Stop native audio if active
        if (nativeAudioRef.current) {
          nativeAudioRef.current.pause();
          nativeAudioRef.current = null;
        }

        const srcUrls = [currentTrack.url];
        if ('fallbackUrl' in currentTrack && currentTrack.fallbackUrl) {
          srcUrls.push(currentTrack.fallbackUrl);
        }

        const oldHowl = trackHowlRef.current;
        const shouldCrossfade = !!oldHowl;

        const howl = new Howl({
          src: srcUrls,
          html5: false,
          loop: true,
          volume: shouldCrossfade ? 0 : volume,
          onloaderror: () => {
            console.warn("Howler load error, triggering Web Audio Procedural Synth fallback!");
            startProceduralSynth();
          },
          onplayerror: () => {
            console.warn("Howler play error, triggering Web Audio Procedural Synth fallback!");
            startProceduralSynth();
          }
        });

        trackHowlRef.current = howl;
        howl.play();

        if (shouldCrossfade) {
          const CROSSFADE_TIME = 1000;
          oldHowl.fade(oldHowl.volume(), 0, CROSSFADE_TIME);
          oldHowl.once('fade', () => {
            oldHowl.unload();
          });
          howl.fade(0, volume, CROSSFADE_TIME);
        } else {
          (oldHowl as unknown as Howl).unload();
        }

        stopProceduralSynth();
      }
    } else {
      if (trackHowlRef.current) {
        trackHowlRef.current.pause();
      }
      if (nativeAudioRef.current) {
        nativeAudioRef.current.pause();
      }
      stopProceduralSynth();
    }

    return () => {
      // Unload only if we are unmounting or if music has been paused.
      if (isUnmountingRef.current || !isMusicPlayingRef.current) {
        if (trackHowlRef.current) {
          trackHowlRef.current.unload();
          trackHowlRef.current = null;
        }
        if (nativeAudioRef.current) {
          nativeAudioRef.current.pause();
          nativeAudioRef.current = null;
        }
        stopProceduralSynth();
      }
    };
  }, [isMusicPlaying, currentTrackIndex]);

  // Handle global volume changes
  useEffect(() => {
    if (trackHowlRef.current) {
      trackHowlRef.current.volume(volume);
    }
    if (nativeAudioRef.current) {
      nativeAudioRef.current.volume = volume;
    }
  }, [volume]);

  const toggleMusic = () => {
    initAudioCtx();
    setIsMusicPlaying(prev => !prev);
  };

  const setMusicPlaying = (playing: boolean) => {
    initAudioCtx();
    setIsMusicPlaying(playing);
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
  };

  const playTrack = (index: number) => {
    initAudioCtx();
    setCurrentTrackIndex(index);
    setIsMusicPlaying(true);
  };

  const selectTrack = (index: number) => {
    initAudioCtx();
    setCurrentTrackIndex(index);
  };

  const nextTrack = () => {
    setCurrentTrackIndex(prev => (prev + 1) % tracks.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  };

  // Play interface Sound Effects using Web Audio API synthesis (zero network dependancy!)
  const playSound = (type: 'hover' | 'click' | 'shake' | 'open' | 'reveal' | 'pageFlip' | 'doorOpen') => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'hover': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.36);
        break;
      }
      case 'shake': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.setValueAtTime(120, now + 0.04);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.11);
        break;
      }
      case 'open': {
        const notes = [293.66, 349.23, 440.00, 587.33, 698.46, 880.00];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.05, now + i * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.35);
        });
        break;
      }
      case 'reveal': {
        const chord = [261.63, 329.63, 392.00, 493.88, 587.33, 783.99, 987.77];
        chord.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = i % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.04, now + i * 0.03 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 1.2);
          osc.start(now + i * 0.03);
          osc.stop(now + i * 0.03 + 1.3);
        });
        break;
      }
      case 'pageFlip': {
        // Friction brush flip sound
        const bufferSize = ctx.sampleRate * 0.2; // 0.2s duration
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.2);
        filter.Q.setValueAtTime(3.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.25);
        break;
      }
      case 'doorOpen': {
        // Heavy door-creak layered with a sharp manga-style "impact whoosh"
        // 1. Whoosh (noise buffer with bandpass sweep)
        const bufferSize = ctx.sampleRate * 0.8; // 0.8s whoosh
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(150, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.25);
        noiseFilter.frequency.exponentialRampToValueAtTime(120, now + 0.7);
        noiseFilter.Q.setValueAtTime(2.5, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.001, now);
        noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.2); // Ramps up fast
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.8);

        // 2. Creak (low pitch sawtooth with friction pitch modulation LFO)
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const oscGain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.75);

        // LFO for rapid pitch/volume fluctuations (creaking friction)
        lfo.type = 'triangle';
        lfo.frequency.setValueAtTime(22, now); // 22 Hz modulation
        lfoGain.gain.setValueAtTime(35, now); // Amplitude of modulation in Hz

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // High-pass filter for metallic/harsh edge
        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(100, now);

        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(0.12, now + 0.15);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

        osc.connect(hpFilter);
        hpFilter.connect(oscGain);
        oscGain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);

        lfo.stop(now + 0.8);
        osc.stop(now + 0.8);
        break;
      }
    }
  };

  // --- PROCEDURAL SYNTH fallback loop ---
  const startProceduralSynth = () => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (synthIntervalRef.current) return;

    // Soothing chord generator timer
    const playNote = () => {
      const now = ctx.currentTime;
      const trackIdx = currentTrackIndexRef.current;
      const vol = volumeRef.current;

      // Define different musical styles for each track index in fallback mode!
      if (trackIdx === 0) {
        // Beethoven Moonlight Sonata Style: Deep, mysterious, slow minor/dramatic piano
        const scale = [146.83, 196.00, 220.00, 293.66, 329.63, 349.23, 440.00]; // Low D Minor / F Major
        const pitchCount = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < pitchCount; k++) {
          const freq = scale[Math.floor(Math.random() * scale.length)];
          const delay = Math.random() * 0.3;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const lowpass = ctx.createBiquadFilter();
          
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(400, now + delay); // Dark filter

          osc.type = 'sine'; // Pure dark tone
          osc.frequency.setValueAtTime(freq, now + delay);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vol * 0.08, now + delay + 0.2); // Slow attack
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 5.0); // Very long release
          
          osc.connect(lowpass);
          lowpass.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + delay);
          osc.stop(now + delay + 5.5);
        }
      } else if (trackIdx === 1) {
        // Debussy Clair de Lune Style: High, bright, sparkling piano
        const scale = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // High C Major / Pentatonic
        const pitchCount = 3 + Math.floor(Math.random() * 2);
        for (let k = 0; k < pitchCount; k++) {
          const freq = scale[Math.floor(Math.random() * scale.length)];
          const delay = k * 0.12; // Fast cascading arpeggiation
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const lowpass = ctx.createBiquadFilter();
          
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(1200, now + delay); // Bright filter

          osc.type = 'triangle'; // Bright piano-like
          osc.frequency.setValueAtTime(freq, now + delay);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vol * 0.04, now + delay + 0.05); // Rapid attack
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 3.0); // Medium release
          
          osc.connect(lowpass);
          lowpass.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + delay);
          osc.stop(now + delay + 3.5);
        }
      } else if (trackIdx === 3) {
        // Bach Cello Vibe: Rich, low, sweeping cello strings
        const scale = [110.00, 146.83, 164.81, 220.00, 293.66, 329.63, 440.00]; // Warm low strings
        const freq = scale[Math.floor(Math.random() * scale.length)];
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 1.5); // Cello filter sweep!
        
        osc.type = 'triangle'; // String-like triangle harmonic
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol * 0.07, now + 0.6); // Very slow attack
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0); // Medium release
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 4.2);
      } else {
        // Satie Gymnopedie Style: Spacious, calm, randomized ambient chords
        const scale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99]; // D Major Pentatonic
        const pitchCount = 2 + Math.floor(Math.random() * 2);
        for (let k = 0; k < pitchCount; k++) {
          const freq = scale[Math.floor(Math.random() * scale.length)];
          const delay = Math.random() * 0.15;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const lowpass = ctx.createBiquadFilter();
          
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(650, now + delay);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(vol * 0.05, now + delay + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 4.5);
          
          osc.connect(lowpass);
          lowpass.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now + delay);
          osc.stop(now + delay + 5.0);
        }
      }
    };

    // Play chord immediately then every 4.2 seconds
    playNote();
    synthIntervalRef.current = window.setInterval(playNote, 4200);
  };

  const stopProceduralSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // --- PROCEDURAL ATMOSPHERIC SOUNDS FOR PEACE ROOM ---
  const setPeaceEnvironment = (env: string | null) => {
    initAudioCtx();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    // Stop all environmental sounds first
    stopEnvironmentSounds();

    if (!env) return;

    const now = ctx.currentTime;

    if (env === 'rain') {
      // Synthesize pink/white noise for Rain
      const bufferSize = ctx.sampleRate * 2; // 2 seconds looping buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // scale
        b6 = white * 0.115926;
      }

      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(800, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 1.5); // Fade in

      noiseNode.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      noiseNode.start(now);
      rainNodeRef.current = gain; // store gain node to call disconnect
      
      // Cache source node reference inside rainNodeRef's custom property to stop it
      (gain as any).source = noiseNode;
      
    } else if (env === 'fireplace') {
      // Crackle + rumble generator
      const rumbleBuffer = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, rumbleBuffer, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < rumbleBuffer; i++) {
        data[i] = Math.random() * 2 - 1; // white noise
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      
      // Rumble filter (low pass at 70Hz)
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.value = 65;

      const gainRumble = ctx.createGain();
      gainRumble.gain.value = 0.2;

      noise.connect(rumbleFilter);
      rumbleFilter.connect(gainRumble);
      gainRumble.connect(ctx.destination);
      noise.start(now);

      // Crackles script processor
      const scriptNode = ctx.createScriptProcessor(4096, 0, 1);
      scriptNode.onaudioprocess = (e) => {
        const out = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < out.length; i++) {
          out[i] = 0;
          // Randomly trigger snap crackle impulses
          if (Math.random() < 0.0003) {
            out[i] = (Math.random() * 2 - 1) * 0.4;
          }
        }
      };

      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.value = 4000;
      crackleFilter.Q.value = 1.0;

      const gainCrackle = ctx.createGain();
      gainCrackle.gain.value = 0.06;

      scriptNode.connect(crackleFilter);
      crackleFilter.connect(gainCrackle);
      gainCrackle.connect(ctx.destination);

      fireplaceNodeRef.current = gainRumble;
      (gainRumble as any).source = noise;
      (gainRumble as any).crackle = scriptNode;
      
    } else if (env === 'forest' || env === 'ocean' || env === 'clouds' || env === 'nightSky') {
      // Synthesize soft wind sweep (Forest / Ocean / Clouds / NightSky fallback)
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, now);
      filter.Q.setValueAtTime(4.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 1.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);

      // Periodically sweep the bandpass center frequency to simulate wind gusting
      const sweepWind = () => {
        if (!forestNodeRef.current) return;
        const time = ctx.currentTime;
        const targetFreq = 180 + Math.random() * 320;
        const duration = 3.0 + Math.random() * 4.0;
        filter.frequency.exponentialRampToValueAtTime(targetFreq, time + duration);
        setTimeout(sweepWind, duration * 1000);
      };
      
      forestNodeRef.current = gain;
      (gain as any).source = noise;
      (gain as any).filter = filter;
      
      sweepWind();
    }
  };

  const stopEnvironmentSounds = () => {
    // Stop Rain
    if (rainNodeRef.current) {
      try {
        const source = (rainNodeRef.current as any).source;
        if (source) source.stop();
        rainNodeRef.current.disconnect();
      } catch (e) {}
      rainNodeRef.current = null;
    }
    // Stop Fireplace
    if (fireplaceNodeRef.current) {
      try {
        const source = (fireplaceNodeRef.current as any).source;
        const crackle = (fireplaceNodeRef.current as any).crackle;
        if (source) source.stop();
        if (crackle) crackle.disconnect();
        fireplaceNodeRef.current.disconnect();
      } catch (e) {}
      fireplaceNodeRef.current = null;
    }
    // Stop Forest/Wind
    if (forestNodeRef.current) {
      try {
        const source = (forestNodeRef.current as any).source;
        if (source) source.stop();
        forestNodeRef.current.disconnect();
      } catch (e) {}
      forestNodeRef.current = null;
    }
  };

  return (
    <AudioContext.Provider value={{
      isMusicPlaying,
      volume,
      currentTrackIndex,
      toggleMusic,
      setMusicPlaying,
      setVolume,
      playTrack,
      nextTrack,
      prevTrack,
      playSound,
      setPeaceEnvironment,
      tracks,
      isPeaceMode,
      setPeaceMode,
      selectTrack
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};