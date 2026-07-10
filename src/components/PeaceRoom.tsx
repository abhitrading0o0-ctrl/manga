import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

type BreathPattern = '4-4' | '4-7-8';

interface EnvPreset {
  id: string;
  name: string;
  icon: string;
  quoteList: string[];
}

export const PeaceRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { playSound, setPeaceEnvironment } = useAudio();

  const [activeEnv, setActiveEnv] = useState<string>('rain');
  const [breathPattern, setBreathPattern] = useState<BreathPattern>('4-4');
  const [breathLabel, setBreathLabel] = useState('Breathe in...');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);

  const breathTimerRef = useRef<number | null>(null);

  const environments: EnvPreset[] = [
    {
      id: 'rain',
      name: 'Gentle Rain',
      icon: '🌧',
      quoteList: [
        "Let the rain wash away all your stress and worries.",
        "Like raindrops, remember that it's okay to fall and grow again.",
        "Quiet moments are where the soul finds its rhythm."
      ]
    },
    {
      id: 'ocean',
      name: 'Ocean Waves',
      icon: '🌊',
      quoteList: [
        "Your strength is as deep and infinite as the ocean.",
        "In the ebb and flow of life, find your inner calmness.",
        "Let the worries drift away like writing on wet sand."
      ]
    },
    {
      id: 'forest',
      name: 'Whispering Forest',
      icon: '🌿',
      quoteList: [
        "Like old trees, you are rooted and resilient beyond measure.",
        "Find your calm in the whispers of the leaves.",
        "The forest stands strong through every season — and so do you."
      ]
    },
    {
      id: 'fire',
      name: 'Warm Bonfire',
      icon: '🔥',
      quoteList: [
        "Let the warmth remind you that you are safe right now.",
        "Even a single spark of hope can light the darkest night.",
        "Sit by the fire and let your thoughts soften."
      ]
    }
  ];

  useEffect(() => {
    markRoomVisited('peace');
    
    // Entrance animation
    gsap.fromTo('.peace-content', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });

    return () => {
      setPeaceEnvironment(null);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, []);

  // Breathing label sync
  useEffect(() => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);

    if (breathPattern === '4-4') {
      // 4s in, 4s out = 8s cycle
      let phase = 0;
      const cycle = () => {
        if (phase === 0) setBreathLabel('Breathe in...');
        else setBreathLabel('Breathe out...');
        phase = (phase + 1) % 2;
      };
      cycle();
      breathTimerRef.current = window.setInterval(cycle, 4000);
    } else {
      // 4-7-8: 4s in, 7s hold, 8s out = 19s cycle
      let elapsed = 0;
      const tick = () => {
        elapsed++;
        if (elapsed <= 4) setBreathLabel('Breathe in...');
        else if (elapsed <= 11) setBreathLabel('Hold...');
        else if (elapsed <= 19) setBreathLabel('Breathe out...');
        else elapsed = 0;
      };
      tick();
      breathTimerRef.current = window.setInterval(tick, 1000);
    }

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [breathPattern]);

  // Rotate quotes every 12 seconds
  useEffect(() => {
    const env = environments.find(e => e.id === activeEnv);
    if (!env) return;
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % env.quoteList.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [activeEnv]);

  const handleEnvChange = (envId: string) => {
    setActiveEnv(envId);
    setCurrentQuote(0);
    playSound('click');
    if (isPlaying) {
      setPeaceEnvironment(envId);
    }
  };

  const togglePlay = () => {
    playSound('click');
    if (isPlaying) {
      setPeaceEnvironment(null);
      setIsPlaying(false);
    } else {
      setPeaceEnvironment(activeEnv);
      setIsPlaying(true);
    }
  };

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const activeEnvData = environments.find(e => e.id === activeEnv);

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden peace-gradient-loop"
      style={{ color: 'var(--room-text, #3A3550)' }}
    >
      {/* Header */}
      <div className="fixed top-6 left-6 z-20">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'var(--room-text-muted, #7B7591)',
            borderColor: 'var(--room-card-border, rgba(139, 123, 199, 0.15))',
            backgroundColor: 'var(--room-card-bg, rgba(255, 255, 255, 0.6))',
            backdropFilter: 'blur(10px)'
          }}
        >
          ← Home
        </button>
      </div>

      {/* Settings toggle */}
      <div className="fixed top-6 right-6 z-20">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="clickable px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'var(--room-text-muted, #7B7591)',
            borderColor: 'var(--room-card-border, rgba(139, 123, 199, 0.15))',
            backgroundColor: 'var(--room-card-bg, rgba(255, 255, 255, 0.6))',
            backdropFilter: 'blur(10px)'
          }}
        >
          ⚙ Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div 
          className="fixed top-16 right-6 z-20 p-4 rounded-xl border w-56"
          style={{
            backgroundColor: 'var(--room-card-bg, rgba(255, 255, 255, 0.85))',
            borderColor: 'var(--room-card-border, rgba(139, 123, 199, 0.15))',
            backdropFilter: 'blur(16px)'
          }}
        >
          <h4 className="font-sans text-xs font-bold tracking-wider uppercase mb-3" style={{ color: 'var(--room-text, #3A3550)' }}>
            Breathing Pattern
          </h4>
          {(['4-4', '4-7-8'] as BreathPattern[]).map(pattern => (
            <button
              key={pattern}
              onClick={() => { setBreathPattern(pattern); playSound('click'); }}
              className={`clickable w-full text-left px-3 py-2 rounded-lg text-xs font-sans mb-1 transition-all cursor-pointer border
                ${breathPattern === pattern ? 'font-bold' : ''}`}
              style={{
                color: breathPattern === pattern ? 'var(--room-accent, #8B7BC7)' : 'var(--room-text-muted, #7B7591)',
                borderColor: breathPattern === pattern ? 'var(--room-accent, #8B7BC7)' : 'transparent',
                backgroundColor: breathPattern === pattern ? 'rgba(139, 123, 199, 0.08)' : 'transparent'
              }}
            >
              {pattern === '4-4' ? '4-4 (Balanced)' : '4-7-8 (Box Breathing)'}
            </button>
          ))}
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="peace-content relative z-10 flex flex-col items-center gap-8 max-w-lg w-full">

        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center my-8">
          <div 
            className={`w-40 h-40 rounded-full flex items-center justify-center
              ${breathPattern === '4-4' ? 'breathing-circle' : 'breathing-circle-478'}`}
            style={{
              background: 'radial-gradient(circle, rgba(139, 123, 199, 0.15) 0%, rgba(196, 181, 224, 0.08) 60%, transparent 80%)',
            }}
          >
            <span 
              className="font-sans text-sm font-light tracking-wider text-center transition-opacity duration-700"
              style={{ color: 'var(--room-accent, #8B7BC7)' }}
            >
              {breathLabel}
            </span>
          </div>
        </div>

        {/* Rotating Quote */}
        <p 
          className="font-serif text-center text-base sm:text-lg leading-relaxed italic max-w-sm transition-opacity duration-700"
          style={{ color: 'var(--room-text, #3A3550)', opacity: 0.7 }}
        >
          "{activeEnvData?.quoteList[currentQuote]}"
        </p>

        {/* Environment Selector */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {environments.map(env => (
            <button
              key={env.id}
              onClick={() => handleEnvChange(env.id)}
              className={`clickable flex items-center gap-2 px-4 py-2.5 rounded-full font-sans text-xs tracking-wider transition-all duration-300 cursor-pointer border`}
              style={{
                color: activeEnv === env.id ? 'var(--room-accent, #8B7BC7)' : 'var(--room-text-muted, #7B7591)',
                borderColor: activeEnv === env.id ? 'var(--room-accent, #8B7BC7)' : 'var(--room-card-border, rgba(139, 123, 199, 0.15))',
                backgroundColor: activeEnv === env.id ? 'rgba(139, 123, 199, 0.1)' : 'var(--room-card-bg, rgba(255, 255, 255, 0.5))',
                backdropFilter: 'blur(8px)'
              }}
            >
              <span className="text-lg">{env.icon}</span>
              {env.name}
            </button>
          ))}
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="clickable mt-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 cursor-pointer border-2 hover:scale-110"
          style={{
            color: isPlaying ? 'white' : 'var(--room-accent, #8B7BC7)',
            borderColor: 'var(--room-accent, #8B7BC7)',
            backgroundColor: isPlaying ? 'var(--room-accent, #8B7BC7)' : 'transparent',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <p 
          className="font-sans text-[10px] tracking-widest uppercase"
          style={{ color: 'var(--room-text-muted, #7B7591)' }}
        >
          {isPlaying ? 'Playing — tap to pause' : 'Tap to play soundscape'}
        </p>
      </div>
    </div>
  );
};