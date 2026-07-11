import React, { useEffect, useState, useRef } from 'react';
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

// Calm background gold-star particles component
const CalmParticles: React.FC = () => {
  const particles = [
    { size: 2, left: '8%', top: '30%', delay: '0s', duration: '20s' },
    { size: 3, left: '78%', top: '15%', delay: '2s', duration: '28s' },
    { size: 2, left: '85%', top: '60%', delay: '4s', duration: '22s' },
    { size: 4, left: '12%', top: '80%', delay: '1s', duration: '26s' },
    { size: 3, left: '50%', top: '85%', delay: '3s', duration: '30s' },
    { size: 2.5, left: '22%', top: '45%', delay: '5s', duration: '24s' },
    { size: 3, left: '68%', top: '50%', delay: '1.5s', duration: '22s' },
    { size: 2, left: '40%', top: '15%', delay: '6s', duration: '27s' },
    { size: 2, left: '60%', top: '75%', delay: '8s', duration: '25s' },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
      {particles.map((p, idx) => (
        <div
          key={idx}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            top: p.top,
            backgroundColor: '#E6C280',
            boxShadow: '0 0 6px #E6C280, 0 0 12px #E6C280',
            animation: `slow-drift ${p.duration} ease-in-out infinite`,
            animationDelay: p.delay,
            opacity: 0.65,
          }}
        />
      ))}
    </div>
  );
};

export const PeaceRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { 
    playSound, 
    isMusicPlaying, 
    currentTrackIndex, 
    playTrack, 
    toggleMusic, 
    setPeaceMode, 
    selectTrack 
  } = useAudio();

  const [breathPattern, setBreathPattern] = useState<BreathPattern>('4-4');
  const [breathLabel, setBreathLabel] = useState('Breathe in...');
  const [showSettings, setShowSettings] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  
  // Parallax mouse position state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Single-element animated breathing label state
  const [displayText, setDisplayText] = useState(breathLabel);
  const breathingTextRef = useRef<HTMLDivElement>(null);

  const breathTimerRef = useRef<number | null>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const tonearmRef = useRef<HTMLDivElement>(null);
  const rotationTweenRef = useRef<gsap.core.Tween | null>(null);
  const prevTrackIndexRef = useRef<number>(currentTrackIndex);

  const environments: EnvPreset[] = [
    {
      id: 'gentle-rain',
      name: 'Gentle Rain',
      icon: '🌧',
      quoteList: [
        "Let the rain wash away all your stress and worries.",
        "Like raindrops, remember that it's okay to fall and grow again.",
        "Quiet moments are where the soul finds its rhythm."
      ]
    },
    {
      id: 'ocean-waves',
      name: 'Ocean Waves',
      icon: '🌊',
      quoteList: [
        "Your strength is as deep and infinite as the ocean.",
        "In the ebb and flow of life, find your inner calmness.",
        "Let the worries drift away like writing on wet sand."
      ]
    },
    {
      id: 'whispering-forest',
      name: 'Whispering Forest',
      icon: '🌿',
      quoteList: [
        "Like old trees, you are rooted and resilient beyond measure.",
        "Find your calm in the whispers of the leaves.",
        "The forest stands strong through every season — and so do you."
      ]
    },
    {
      id: 'warm-bonfire',
      name: 'Warm Bonfire',
      icon: '🔥',
      quoteList: [
        "Let the warmth remind you that you are safe right now.",
        "Even a single spark of hope can light the darkest night.",
        "Sit by the fire and let your thoughts soften."
      ]
    }
  ];

  // Expose Peace Mode when mounting
  useEffect(() => {
    setPeaceMode(true);
    markRoomVisited('peace');
    
    // Entrance animation
    gsap.fromTo('.peace-content', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });

    return () => {
      setPeaceMode(false);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, []);

  // Sync breathing label updates with GSAP fade-out -> swap text -> fade-in animation
  useEffect(() => {
    if (!breathingTextRef.current) return;

    const tl = gsap.timeline();
    tl.to(breathingTextRef.current, {
      opacity: 0,
      scale: 0.96,
      filter: 'blur(5px)',
      duration: 0.45,
      ease: 'power2.in',
      onComplete: () => {
        setDisplayText(breathLabel);
      }
    })
    .to(breathingTextRef.current, {
      opacity: 1,
      scale: 1.0,
      filter: 'blur(0px)',
      duration: 0.75,
      ease: 'power2.out'
    });

    return () => {
      tl.kill();
    };
  }, [breathLabel]);

  // Breathing label sync
  useEffect(() => {
    if (breathTimerRef.current) clearInterval(breathTimerRef.current);

    if (breathPattern === '4-4') {
      let phase = 0;
      const cycle = () => {
        if (phase === 0) setBreathLabel('Breathe in...');
        else setBreathLabel('Breathe out...');
        phase = (phase + 1) % 2;
      };
      cycle();
      breathTimerRef.current = window.setInterval(cycle, 4000);
    } else {
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

  // Rotate quotes every 12 seconds per selected track
  useEffect(() => {
    setCurrentQuote(0);
    const env = environments[currentTrackIndex];
    if (!env) return;
    const interval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % env.quoteList.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [currentTrackIndex]);

  // GSAP animations for the disc rotation and tonearm needle placement
  useEffect(() => {
    if (!discRef.current || !tonearmRef.current) return;

    if (isMusicPlaying) {
      // 1. Swing the tonearm onto the disc edge
      gsap.to(tonearmRef.current, {
        rotation: 12, // Active on-disc rotation angle
        duration: 0.8,
        ease: 'power2.out'
      });

      // 2. Start/accelerate disc spinning
      if (!rotationTweenRef.current) {
        rotationTweenRef.current = gsap.to(discRef.current, {
          rotation: '+=360',
          duration: 3.5, // Realistic 33-45 RPM speed equivalent
          ease: 'none',
          repeat: -1,
          paused: true
        });
      }

      rotationTweenRef.current.play();
      gsap.to(rotationTweenRef.current, {
        timeScale: 1,
        duration: 0.8,
        ease: 'power1.in'
      });
    } else {
      // 1. Lift the tonearm back up to its rest position
      gsap.to(tonearmRef.current, {
        rotation: -28, // Off-disc rest rotation angle
        duration: 0.8,
        ease: 'power2.out'
      });

      // 2. Smoothly decelerate rotation to a standstill
      if (rotationTweenRef.current) {
        gsap.to(rotationTweenRef.current, {
          timeScale: 0,
          duration: 1.5,
          ease: 'power2.out',
          onComplete: () => {
            if (rotationTweenRef.current && !isMusicPlaying) {
              rotationTweenRef.current.pause();
            }
          }
        });
      }
    }
  }, [isMusicPlaying]);

  // Swing the tonearm up and down briefly on track change to simulate record swapping
  useEffect(() => {
    if (currentTrackIndex !== prevTrackIndexRef.current) {
      prevTrackIndexRef.current = currentTrackIndex;

      if (isMusicPlaying && tonearmRef.current) {
        const tl = gsap.timeline();
        tl.to(tonearmRef.current, {
          rotation: -28, // lift up
          duration: 0.4,
          ease: 'power2.out'
        })
        .to(tonearmRef.current, {
          rotation: 12, // place back down
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.1
        });
      }
    }
  }, [currentTrackIndex, isMusicPlaying]);

  // Parallax event handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX - innerWidth / 2) / (innerWidth / 2); // Normalized between -1 and 1
    const y = (clientY - innerHeight / 2) / (innerHeight / 2); // Normalized between -1 and 1
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleEnvChange = (index: number) => {
    playSound('click');
    if (isMusicPlaying) {
      playTrack(index);
    } else {
      selectTrack(index);
    }
  };

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const renderIcon = (id: string, className?: string) => {
    switch (id) {
      case 'gentle-rain':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M16 14v6" />
            <path d="M8 14v6" />
            <path d="M12 16v6" />
          </svg>
        );
      case 'ocean-waves':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 6c.6.5 1.2 1 2.5 1s2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 1.9-.5 2.5-1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1s2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 1.9-.5 2.5-1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1s2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 1.9-.5 2.5-1" />
          </svg>
        );
      case 'whispering-forest':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58 1 9.3a7 7 0 0 1-14 3.7" />
            <path d="M19 2c-4 4-7.5 5.5-12 12" />
          </svg>
        );
      case 'warm-bonfire':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const activeEnvData = environments[currentTrackIndex] || environments[0];

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen relative flex flex-col items-center justify-center px-6 overflow-hidden transition-all duration-700 select-none"
      style={{
        background: 'linear-gradient(135deg, #1C1926 0%, #0E0C12 50%, #060508 100%)',
      }}
    >
      {/* Calm Ambient Floating Background Gold-Star Particles */}
      <CalmParticles />

      {/* Cinematic peach-gold backdrop glow behind the disc player */}
      <div 
        className="absolute w-[540px] h-[540px] rounded-full pointer-events-none opacity-30 blur-[130px] -z-10 transition-transform duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, #F8A8B8 0%, #E6C280 45%, transparent 75%)',
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${mousePos.x * 25}px), calc(-50% + ${mousePos.y * 25}px))`,
        }}
      />

      {/* Header */}
      <div className="fixed top-6 left-6 z-20">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: '#FFF9E6',
            borderColor: 'rgba(230, 194, 128, 0.15)',
            backgroundColor: 'rgba(18, 15, 24, 0.65)',
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
            color: '#FFF9E6',
            borderColor: 'rgba(230, 194, 128, 0.15)',
            backgroundColor: 'rgba(18, 15, 24, 0.65)',
            backdropFilter: 'blur(10px)'
          }}
        >
          ⚙ Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div 
          className="fixed top-16 right-6 z-20 p-4 rounded-xl border w-56 shadow-2xl"
          style={{
            backgroundColor: 'rgba(18, 15, 24, 0.95)',
            borderColor: 'rgba(230, 194, 128, 0.2)',
            backdropFilter: 'blur(16px)',
            color: '#FFF9E6'
          }}
        >
          <h4 className="font-sans text-xs font-bold tracking-wider uppercase mb-3" style={{ color: '#E6C280' }}>
            Breathing Pattern
          </h4>
          {(['4-4', '4-7-8'] as BreathPattern[]).map(pattern => (
            <button
              key={pattern}
              onClick={() => { setBreathPattern(pattern); playSound('click'); }}
              className={`clickable w-full text-left px-3 py-2 rounded-lg text-xs font-sans mb-1 transition-all cursor-pointer border
                ${breathPattern === pattern ? 'font-bold' : ''}`}
              style={{
                color: breathPattern === pattern ? '#E6C280' : 'rgba(255, 249, 230, 0.6)',
                borderColor: breathPattern === pattern ? '#E6C280' : 'transparent',
                backgroundColor: breathPattern === pattern ? 'rgba(230, 194, 128, 0.08)' : 'transparent'
              }}
            >
              {pattern === '4-4' ? '4-4 (Balanced)' : '4-7-8 (Box Breathing)'}
            </button>
          ))}
        </div>
      )}

      {/* ─── Main Content ─── */}
      <div className="peace-content relative z-10 flex flex-col items-center gap-4 max-w-lg w-full">

        {/* Large Cinematic Title Card for Breathing Instructions */}
        <div className="relative w-full h-16 flex items-center justify-center my-2 select-none overflow-visible">
          <div
            ref={breathingTextRef}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-[0.25em] uppercase text-[#FFF9E6] text-center"
            style={{
              textShadow: '0 0 20px rgba(230, 194, 128, 0.45), 0 0 40px rgba(248, 168, 184, 0.25)',
            }}
          >
            {displayText}
          </div>
        </div>

        {/* ─── TURNTABLE DECK ─── */}
        <div className="relative flex items-center justify-center my-4">
          
          {/* Holographic light-ring behind the platter that pulses with the breathing cycle */}
          <div 
            className="absolute w-[330px] h-[330px] rounded-full -z-10 transition-all duration-300 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(230, 194, 128, 0.12) 0%, rgba(248, 168, 184, 0.04) 60%, transparent 80%)',
              animation: breathPattern === '4-4' ? 'breathe-in-out 8s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'breathe-478 19s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`,
            }}
          />

          {/* Turntable Console Card with dark metal/glassmorphic look */}
          <div 
            onClick={() => { playSound('click'); toggleMusic(); }}
            className="clickable relative w-[340px] h-[340px] rounded-3xl flex items-center justify-center border shadow-2xl cursor-pointer select-none group active:scale-[0.99] transition-all duration-300"
            style={{
              backgroundColor: 'rgba(18, 15, 24, 0.85)',
              borderColor: 'rgba(230, 194, 128, 0.15)',
              backdropFilter: 'blur(20px)',
              boxShadow: 'inset 0 0 25px rgba(230, 194, 128, 0.04), 0 35px 70px rgba(0, 0, 0, 0.55)',
              transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`,
            }}
          >
            {/* Platter Base recess */}
            <div 
              className="absolute w-[284px] h-[284px] rounded-full shadow-inner flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(11, 10, 15, 0.5)',
                border: '1px solid rgba(230, 194, 128, 0.08)',
              }}
            >
              {/* Rotating CD Disc */}
              <div
                ref={discRef}
                className="relative w-[276px] h-[276px] rounded-full overflow-hidden shadow-xl flex items-center justify-center transition-shadow duration-300 group-hover:shadow-2xl"
                style={{
                  backgroundImage: "url('/assets/peace-cd.jpg')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {/* Shiny grooves pattern overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'repeating-radial-gradient(circle, transparent, transparent 2px, rgba(0, 0, 0, 0.12) 3px, rgba(255, 255, 255, 0.02) 4px)',
                  }}
                />
                
                {/* Directional Key Light (Upper-Left source) */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)',
                  }}
                />
              </div>

              {/* Shifting Light Reflection Arc (Static highlight overlay, shifts with mouse) */}
              <div 
                className="absolute w-[276px] h-[276px] rounded-full pointer-events-none mix-blend-overlay opacity-60 transition-transform duration-300 ease-out"
                style={{
                  background: 'conic-gradient(from 45deg, transparent 0deg, rgba(255, 255, 255, 0.22) 30deg, transparent 60deg, transparent 180deg, rgba(255, 255, 255, 0.22) 210deg, transparent 240deg, transparent 360deg)',
                  transform: `rotate(${mousePos.x * 12}deg)`,
                }}
              />
            </div>
            
            {/* Center Label (frosted-glass, static overlay, breathing text removed) */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute w-[80px] h-[80px] rounded-full flex flex-col items-center justify-center shadow-lg border text-center pointer-events-none z-10"
              style={{
                backgroundColor: 'rgba(255, 249, 230, 0.84)',
                borderColor: 'rgba(230, 194, 128, 0.25)',
                backdropFilter: 'blur(16px)',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05), 0 4px 15px rgba(0,0,0,0.3)',
              }}
            >
              {/* Active track icon display (crossfading) */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                {environments.map((env, index) => (
                  <div
                    key={env.id}
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out"
                    style={{ 
                      opacity: currentTrackIndex === index ? 1 : 0 
                    }}
                  >
                    {renderIcon(env.id, "w-8 h-8 text-[#2E273A] opacity-90 filter drop-shadow-[0_0_4px_rgba(230,194,128,0.4)]")}
                  </div>
                ))}
              </div>
              
              {/* Counter-hole in the center */}
              <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 shadow-inner absolute" />
            </div>

            {/* Stylized Metallic Tonearm/Needle */}
            <div 
              ref={tonearmRef}
              className="absolute w-[120px] h-[20px] z-20 pointer-events-none"
              style={{
                top: '35px',
                right: '25px',
                transformOrigin: '95px 10px',
                transform: 'rotate(-28deg)',
                filter: 'drop-shadow(-4px 8px 6px rgba(0,0,0,0.65))',
              }}
            >
              {/* Metallic arm pole with linear gradient */}
              <div 
                className="absolute right-[25px] top-[9px] w-[80px] h-[3px] shadow-sm rounded-full" 
                style={{ 
                  background: 'linear-gradient(90deg, #A1A1AA 0%, #E4E4E7 30%, #D4D4D8 50%, #71717A 100%)',
                  transform: 'rotate(-14deg)', 
                  transformOrigin: 'right center' 
                }} 
              />
              {/* Angled cartridge headshell with a tiny status glow */}
              <div 
                className="absolute left-[5px] top-[0px] w-[18px] h-[11px] rounded-sm border flex items-center justify-center shadow-md transition-colors duration-300"
                style={{
                  backgroundColor: isMusicPlaying ? 'rgba(230, 194, 128, 0.95)' : 'rgba(71, 85, 105, 0.95)',
                  borderColor: isMusicPlaying ? 'rgba(230, 194, 128, 0.45)' : 'rgba(100, 116, 139, 0.45)',
                  boxShadow: isMusicPlaying ? '0 0 8px rgba(230, 194, 128, 0.65)' : 'none',
                }}
              >
                <span className="text-[6px] text-slate-900 font-sans font-bold leading-none select-none">
                  {isMusicPlaying ? 'ON' : 'OFF'}
                </span>
              </div>
              {/* Large metallic counterweight pivot base with radial gradient */}
              <div 
                className="absolute right-[12px] top-[2px] w-[16px] h-[16px] rounded-full border shadow-inner" 
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #F4F4F5 0%, #A1A1AA 70%, #52525B 100%)',
                  borderColor: '#71717A',
                }}
              />
            </div>

          </div>
        </div>

        {/* Quotes display using warm cream text */}
        <div className="h-16 flex items-center justify-center px-4">
          <p 
            key={`${currentTrackIndex}-${currentQuote}`}
            className="font-serif text-center text-sm sm:text-base leading-relaxed italic max-w-sm transition-all duration-700 animate-fadeIn"
            style={{ color: '#FFF9E6', opacity: 0.85 }}
          >
            "{activeEnvData.quoteList[currentQuote]}"
          </p>
        </div>

        {/* Sleek record sleeve track tabs */}
        <div className="grid grid-cols-2 gap-3.5 w-full px-4 mt-2">
          {environments.map((env, index) => {
            const isActive = currentTrackIndex === index;
            return (
              <button
                key={env.id}
                onClick={() => handleEnvChange(index)}
                className="clickable relative flex items-center justify-between w-full h-16 p-3 rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-0.5"
                style={{
                  color: isActive ? '#E6C280' : '#FFF9E6',
                  borderColor: isActive ? 'rgba(230, 194, 128, 0.4)' : 'rgba(230, 194, 128, 0.12)',
                  backgroundColor: isActive ? 'rgba(230, 194, 128, 0.08)' : 'rgba(18, 15, 24, 0.65)',
                  boxShadow: isActive ? '0 0 15px rgba(230, 194, 128, 0.2)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Peeking dark record sliver */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-8 border-l border-white/5 transition-transform duration-500 ease-out"
                  style={{
                    borderRadius: '0 12px 12px 0',
                    transform: isActive ? 'translateX(0)' : 'translateX(12px)',
                    opacity: isActive ? 0.45 : 0.12,
                    background: 'repeating-radial-gradient(circle at right, #000, #000 2px, #231F30 4px)',
                  }}
                />

                {/* Left side content inside sleeve */}
                <div className="flex items-center gap-3.5 z-10 text-left">
                  <div className={`p-1.5 rounded-lg transition-colors duration-300 ${isActive ? 'bg-[#E6C280]/20 text-[#E6C280]' : 'bg-[#FFF9E6]/10 text-[#FFF9E6]/60'}`}>
                    {renderIcon(env.id, "w-4.5 h-4.5")}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Sleeve {index + 1}</span>
                    <span className="text-xs font-bold leading-tight mt-0.5" style={{ opacity: isActive ? 1 : 0.85 }}>{env.name}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Warm gold status helper string */}
        <p 
          className="font-sans text-[9px] tracking-widest uppercase mt-4 transition-all duration-300 animate-pulse"
          style={{ color: '#E6C280', opacity: 0.7 }}
        >
          {isMusicPlaying ? 'Playing • tap record to pause' : 'Tap record to play soundscape'}
        </p>

      </div>
    </div>
  );
};