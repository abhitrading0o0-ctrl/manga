import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '../context/AudioContext';
import { useView } from '../context/ViewContext';
import gsap from 'gsap';

export const Loader: React.FC = () => {
  const { setMusicPlaying, playSound } = useAudio();
  const { setView } = useView();

  const [progress, setProgress] = useState(0);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const [statusText, setStatusText] = useState('✨ Gathering stardust...');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Constants
  const TOTAL_SCROLL_FRAMES = 300;
  const TOTAL_GIFT_FRAMES = 299;
  const ASSETS = [
    '/assets/manga-cover.jpg',
    '/assets/playlist-cover.png',
    '/assets/gaming-cover.png',
    '/assets/last-gift.svg',
    '/assets/secret-gift.svg'
  ];
  const TOTAL_ASSETS = TOTAL_SCROLL_FRAMES + TOTAL_GIFT_FRAMES + ASSETS.length;

  useEffect(() => {
    // Canvas background star animations
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create 120 loading stars
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background stars
      stars.forEach(s => {
        s.alpha += s.speed;
        if (s.alpha > 1 || s.alpha < 0) s.speed = -s.speed;
        
        ctx.beginPath();
        ctx.fillStyle = `rgba(233, 200, 116, ${Math.max(0.1, Math.min(1, s.alpha))})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw constellation path (energy lines gathering in the center)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100 + progress * 0.5;
      
      ctx.strokeStyle = 'rgba(90, 73, 214, 0.22)';
      ctx.lineWidth = 1;
      
      const segments = 12;
      ctx.beginPath();
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const startX = centerX + Math.cos(angle) * (radius - 40);
        const startY = centerY + Math.sin(angle) * (radius - 40);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(startX, startY);
      }
      ctx.stroke();

      // Energy gathering sphere
      const energyGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(10, progress * 0.8));
      energyGrad.addColorStop(0, 'rgba(233, 200, 116, 0.85)');
      energyGrad.addColorStop(0.3, 'rgba(90, 73, 214, 0.4)');
      energyGrad.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.fillStyle = energyGrad;
      ctx.arc(centerX, centerY, Math.max(10, progress * 0.8), 0, Math.PI * 2);
      ctx.fill();

      rafId = requestAnimationFrame(draw);
    };

    draw();

    // Asset Preloader logic
    let loadedCount = 0;

    const onAssetLoaded = () => {
      loadedCount++;
      const currentPct = Math.round((loadedCount / TOTAL_ASSETS) * 100);
      setProgress(currentPct);

      if (currentPct < 30) {
        setStatusText('✨ Gathering stardust...');
      } else if (currentPct < 60) {
        setStatusText('🌌 Mapping constellations...');
      } else if (currentPct < 90) {
        setStatusText('🌸 Growing magical sakura...');
      } else {
        setStatusText('🎁 Preparing Something Special...');
      }

      if (loadedCount === TOTAL_ASSETS) {
        setTimeout(() => {
          setShowAudioPrompt(true);
        }, 800);
      }
    };

    // Preload Scroll frames
    for (let i = 1; i <= TOTAL_SCROLL_FRAMES; i++) {
      const img = new Image();
      const pad = String(i).padStart(3, '0');
      img.src = `/scroll-frames/ezgif-frame-${pad}.jpg`;
      img.onload = onAssetLoaded;
      img.onerror = onAssetLoaded; // avoid blocking loader on single fail
    }

    // Preload Gift frames
    for (let i = 1; i <= TOTAL_GIFT_FRAMES; i++) {
      const img = new Image();
      const pad = String(i).padStart(3, '0');
      img.src = `/gift-frames/ezgif-frame-${pad}.jpg`;
      img.onload = onAssetLoaded;
      img.onerror = onAssetLoaded;
    }

    // Preload SVG/JPG Cards
    ASSETS.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = onAssetLoaded;
      img.onerror = onAssetLoaded;
    });

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleAudioChoice = (agree: boolean) => {
    playSound('click');
    if (agree) {
      setMusicPlaying(true);
    }
    
    // Animate loader fade out
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        scale: 1.05,
        duration: 1.0,
        ease: 'power3.inOut',
        onComplete: () => {
          setView('INTRO');
        }
      });
    } else {
      setView('INTRO');
    }
  };
  const handleSkipIntro = () => {
    playSound('click');
    localStorage.setItem('birthday_intro_completed', 'true');
    setView('HOME');
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-bg z-[9999] flex flex-col justify-center items-center select-none"
    >
      {/* Canvas stars background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Skip button absolute overlay */}
      <button 
        onClick={handleSkipIntro}
        className="clickable absolute top-8 right-8 z-30 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-gray hover:text-white hover:border-gold hover:bg-gold/10 transition-all duration-300 shadow-md backdrop-blur-md cursor-pointer select-none"
      >
        Skip Intro →
      </button>

      <div className="relative z-10 text-center px-6 max-w-md w-full flex flex-col items-center">
        {!showAudioPrompt ? (
          <>
            {/* Minimalist Professional Constellation Spinner */}
            <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
              {/* Outer faint progress circle */}
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  className="stroke-accent/10 fill-none" 
                  strokeWidth="2" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  className="stroke-gold fill-none transition-all duration-300 ease-out" 
                  strokeWidth="2" 
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * progress) / 100}
                />
              </svg>
              
              {/* Geometric central spinner core */}
              <div className="w-24 h-24 rounded-full bg-[#121316]/80 border border-white/5 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md">
                <span className="text-white font-display font-bold text-2xl tracking-tighter">{progress}%</span>
                <span className="text-gold font-sans text-[8px] uppercase tracking-widest mt-1">Loaded</span>
              </div>
            </div>

            {/* Glowing status */}
            <h2 className="text-white font-display text-base font-light tracking-[0.2em] mb-4 uppercase select-none opacity-90">
              {statusText}
            </h2>

            {/* Fading bottom indicator */}
            <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent animate-pulse" />
          </>
        ) : (
          /* Premium Frosted Audio Consent Modal */
          <div 
            className="w-full p-8 sm:p-10 bg-[#0c0d10]/85 border border-gold/15 rounded-3xl backdrop-blur-2xl shadow-2xl text-center relative"
            style={{
              boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 45px rgba(233,200,116,0.15)'
            }}
          >
            {/* Ambient golden spot glow inside modal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full bg-gold/5 blur-[40px] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner animate-pulse">
              <span>🎵</span>
            </div>

            <h3 className="text-white font-display text-lg font-bold tracking-wide mb-3">
              Explore with sound?
            </h3>
            
            <p className="text-gray font-sans text-xs font-light tracking-wide leading-relaxed mb-8 max-w-xs mx-auto">
              We recommend turning on sound to fully experience the custom cinematic chimes and ambient soundscapes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <button 
                onClick={() => handleAudioChoice(true)}
                className="clickable px-8 py-3.5 bg-gradient-to-r from-accent to-gold text-bg font-sans font-bold tracking-[0.15em] text-xs uppercase rounded-full shadow-[0_0_20px_rgba(233,200,116,0.45)] hover:scale-[1.03] transition-all duration-300 cursor-pointer"
              >
                🎧 Yes, Play Music
              </button>
              <button 
                onClick={() => handleAudioChoice(false)}
                className="clickable px-8 py-3.5 bg-transparent hover:bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-white/30 font-sans font-semibold tracking-[0.15em] text-xs uppercase rounded-full transition-all duration-300 cursor-pointer"
              >
                🔇 Silence Intro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};