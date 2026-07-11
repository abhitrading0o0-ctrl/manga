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
  frameCount: number;
}

// Helper to load image as a promise
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
  });
};

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

  // Background frame states
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(currentTrackIndex);
  const [loadedFrames, setLoadedFrames] = useState<HTMLImageElement[]>([]);
  const [prevFrames, setPrevFrames] = useState<HTMLImageElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(1); // 0 to 1 for visual crossfade
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIndexRef = useRef(0);
  const prevFrameIndexRef = useRef(0);

  // Sync selected track if changed externally (e.g. from bottom controller)
  useEffect(() => {
    setSelectedTrackIndex(currentTrackIndex);
  }, [currentTrackIndex]);

  const environments: EnvPreset[] = [
    {
      id: 'summer',
      name: 'Summer',
      icon: '☀️',
      frameCount: 30, // Change to 500 when full high-res folders are used in production
      quoteList: [
        "Sunlight is the best medicine, and the warmth is a reminder of peace.",
        "Golden rays of sun, warm breeze, let your mind rest.",
        "Like a long summer day, let your thoughts stretch out and relax."
      ]
    },
    {
      id: 'ocean',
      name: 'Ocean',
      icon: '🌊',
      frameCount: 30, // Change to 450 when full high-res folders are used in production
      quoteList: [
        "Your strength is as deep and infinite as the ocean.",
        "In the ebb and flow of life, find your inner calmness.",
        "Let the worries drift away like writing on wet sand."
      ]
    },
    {
      id: 'rain',
      name: 'Rain',
      icon: '🌧',
      frameCount: 30, // Change to 113 when full high-res folders are used in production
      quoteList: [
        "Let the rain wash away all your stress and worries.",
        "Like raindrops, remember that it's okay to fall and grow again.",
        "Quiet moments are where the soul finds its rhythm."
      ]
    }
  ];

  // Expose Peace Mode when mounting
  useEffect(() => {
    setPeaceMode(true);
    markRoomVisited('peace');
    
    // Initialize tonearm position off-disc
    if (tonearmRef.current) {
      gsap.set(tonearmRef.current, { rotation: -28 });
    }

    // Entrance animation
    gsap.fromTo('.peace-content', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });

    // Load thumbnails (first frame of each folder) on mount
    environments.forEach((env) => {
      const src = `/peace-room/${env.id}/frames/frame_001.jpg`;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setThumbnails(prev => ({ ...prev, [env.id]: src }));
      };
    });

    return () => {
      setPeaceMode(false);
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, []);

  // Preload selected environment frames and trigger category crossfade
  useEffect(() => {
    let active = true;

    const loadCategoryAssets = async () => {
      const env = environments[selectedTrackIndex];
      if (!env) return;

      setLoading(true);
      setLoadingProgress(0);

      const total = env.frameCount;
      const imgs: HTMLImageElement[] = [];
      let loaded = 0;

      // Parallel batch loading for optimal performance
      const promises = Array.from({ length: total }, (_, i) => {
        const frameNum = i + 1;
        const pad = String(frameNum).padStart(3, '0');
        const src = `/peace-room/${env.id}/frames/frame_${pad}.jpg`;

        return loadImage(src)
          .then((img) => {
            if (active) {
              loaded++;
              setLoadingProgress(Math.round((loaded / total) * 100));
              imgs[i] = img;
            }
          })
          .catch((err) => {
            console.error(`Failed loading sequence frame: ${src}`, err);
          });
      });

      await Promise.all(promises);

      if (!active) return;

      // Filter out failures to keep rendering smooth
      const finalImgs = imgs.filter(Boolean);

      if (finalImgs.length > 0) {
        // Trigger audio transition now that assets are preloaded
        if (isMusicPlaying) {
          playTrack(selectedTrackIndex);
        } else {
          selectTrack(selectedTrackIndex);
        }

        if (loadedFrames.length > 0) {
          // Store old frames for visual crossfade transition
          setPrevFrames(loadedFrames);
          setTransitionProgress(0);

          // Animate crossfade progress from 0 to 1
          gsap.to({ val: 0 }, {
            val: 1,
            duration: 1.0,
            ease: 'power2.out',
            onUpdate: function() {
              if (active) {
                setTransitionProgress(this.targets()[0].val);
              }
            },
            onComplete: () => {
              if (active) {
                setPrevFrames([]);
              }
            }
          });
        }

        setLoadedFrames(finalImgs);
      }

      setLoading(false);
    };

    loadCategoryAssets();

    return () => {
      active = false;
    };
  }, [selectedTrackIndex]);

  // Looping Canvas Background Animation Loop
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas || loadedFrames.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;

    const totalFrames = loadedFrames.length;
    // Ambient timing loop targeted at 5s duration, capped between 8fps and 24fps
    const targetDuration = 5.0;
    const fps = Math.min(24, Math.max(8, totalFrames / targetDuration));
    const frameInterval = 1000 / fps;

    const draw = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      // Update active frames index in sync with play state
      if (isMusicPlaying && elapsed >= frameInterval) {
        frameIndexRef.current = (frameIndexRef.current + 1) % totalFrames;

        if (prevFrames.length > 0) {
          prevFrameIndexRef.current = (prevFrameIndexRef.current + 1) % prevFrames.length;
        }

        lastTime = timestamp - (elapsed % frameInterval);
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw standard aspect-fill cover onto canvas
      const drawImageCover = (img: HTMLImageElement, opacity: number) => {
        ctx.globalAlpha = opacity;

        const imgWidth = img.width;
        const imgHeight = img.height;
        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = width / height;

        let drawWidth, drawHeight, x, y;

        if (canvasRatio > imgRatio) {
          drawWidth = width;
          drawHeight = width / imgRatio;
          x = 0;
          y = (height - drawHeight) / 2;
        } else {
          drawWidth = height * imgRatio;
          drawHeight = height;
          x = (width - drawWidth) / 2;
          y = 0;
        }

        ctx.drawImage(img, x, y, drawWidth, drawHeight);
      };

      // Seamless loop crossfader helper
      const getLoopedFrameInfo = (framesList: HTMLImageElement[], baseIndex: number) => {
        const len = framesList.length;
        if (len === 0) return null;

        // Crossfade loop boundaries over the last 15% of frames to eliminate jumps
        const fadeLength = Math.min(10, Math.floor(len * 0.15));
        const idx = baseIndex % len;

        if (idx >= len - fadeLength) {
          const fadeRatio = (idx - (len - fadeLength)) / fadeLength;
          const frameA = framesList[idx];
          const frameB = framesList[idx - (len - fadeLength)];
          return { frameA, frameB, fadeRatio };
        }

        return { frameA: framesList[idx], frameB: null, fadeRatio: 0 };
      };

      // Draw background layers with interpolations
      if (prevFrames.length > 0 && transitionProgress < 1) {
        // Draw previous scene fading out
        const prevInfo = getLoopedFrameInfo(prevFrames, prevFrameIndexRef.current);
        if (prevInfo && prevInfo.frameA) {
          if (prevInfo.frameB) {
            drawImageCover(prevInfo.frameA, (1 - prevInfo.fadeRatio) * (1 - transitionProgress));
            drawImageCover(prevInfo.frameB, prevInfo.fadeRatio * (1 - transitionProgress));
          } else {
            drawImageCover(prevInfo.frameA, 1 - transitionProgress);
          }
        }

        // Draw incoming scene fading in
        const currentInfo = getLoopedFrameInfo(loadedFrames, frameIndexRef.current);
        if (currentInfo && currentInfo.frameA) {
          if (currentInfo.frameB) {
            drawImageCover(currentInfo.frameA, (1 - currentInfo.fadeRatio) * transitionProgress);
            drawImageCover(currentInfo.frameB, currentInfo.fadeRatio * transitionProgress);
          } else {
            drawImageCover(currentInfo.frameA, transitionProgress);
          }
        }
      } else {
        // Draw only active scene with loops
        const currentInfo = getLoopedFrameInfo(loadedFrames, frameIndexRef.current);
        if (currentInfo && currentInfo.frameA) {
          if (currentInfo.frameB) {
            drawImageCover(currentInfo.frameA, 1 - currentInfo.fadeRatio);
            drawImageCover(currentInfo.frameB, currentInfo.fadeRatio);
          } else {
            drawImageCover(currentInfo.frameA, 1.0);
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    // Keep size calibrated to pixel ratios
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [loadedFrames, prevFrames, transitionProgress, isMusicPlaying, currentTrackIndex]);

  // Sync breathing label updates with GSAP fade-out -> swap text -> fade-in animation
  useEffect(() => {
    if (!breathingTextRef.current) return;

    const tl = gsap.timeline();
    tl.to(breathingTextRef.current, {
      opacity: 0,
      scale: 0.96,
      filter: 'blur(5px)',
      duration: 0.45,
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
          ease: 'power2.out',
          onStart: () => {
            // Slow down the disc spinning
            if (rotationTweenRef.current) {
              gsap.to(rotationTweenRef.current, {
                timeScale: 0,
                duration: 0.4,
                ease: 'power2.out'
              });
            }
          }
        })
        .to(tonearmRef.current, {
          rotation: 12, // place back down
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.1,
          onStart: () => {
            // Restart/accelerate disc spinning again
            if (rotationTweenRef.current) {
              rotationTweenRef.current.play();
              gsap.to(rotationTweenRef.current, {
                timeScale: 1,
                duration: 0.6,
                ease: 'power1.in'
              });
            }
          }
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
    if (loading) return; // Prevent clicking another card while one is loading
    playSound('click');
    setSelectedTrackIndex(index);
  };

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const renderIcon = (id: string, className?: string) => {
    switch (id) {
      case 'summer':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
          </svg>
        );
      case 'ocean':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M2 6c.6.5 1.2 1 2.5 1s2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 1.9-.5 2.5-1" />
            <path d="M2 12c.6.5 1.2 1 2.5 1s2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 1.9-.5 2.5-1" />
            <path d="M2 18c.6.5 1.2 1 2.5 1s2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 2.5-.5 3-.5 1.2.5 2.5.5 1.9-.5 2.5-1" />
          </svg>
        );
      case 'rain':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M16 14v6" />
            <path d="M8 14v6" />
            <path d="M12 16v6" />
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
    >
      {/* Dynamic Loop Animated Canvas Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-30 bg-[#050608]">
        <canvas ref={backgroundCanvasRef} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/45" /> {/* Scrim for card contrast */}
      </div>

      {/* Star Particles drift in front of the background for rich parallax depth */}
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

        {/* Sleek record sleeve track tabs - restructured into 3 premium cards */}
        <div className="grid grid-cols-3 gap-4 w-full px-4 mt-2">
          {environments.map((env, index) => {
            const isActive = selectedTrackIndex === index;
            const isActualPlaying = currentTrackIndex === index;
            const thumbnailSrc = thumbnails[env.id];
            const isLoadingThis = loading && selectedTrackIndex === index;
            
            return (
              <button
                key={env.id}
                onClick={() => handleEnvChange(index)}
                className="clickable relative flex flex-col items-center justify-center w-full h-24 p-3 rounded-2xl border transition-all duration-500 overflow-hidden cursor-pointer hover:-translate-y-1 group active:scale-[0.98]"
                style={{
                  color: isActive ? '#E6C280' : '#FFF9E6',
                  borderColor: isActive ? 'rgba(230, 194, 128, 0.45)' : 'rgba(230, 194, 128, 0.12)',
                  backgroundColor: isActive ? 'rgba(18, 15, 24, 0.8)' : 'rgba(18, 15, 24, 0.45)',
                  boxShadow: isActive ? '0 0 20px rgba(230, 194, 128, 0.25)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Background image preview with zoom effect */}
                {thumbnailSrc && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 -z-10"
                    style={{ backgroundImage: `url('${thumbnailSrc}')` }}
                  />
                )}
                
                {/* Vignette overlay inside card */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent -z-10" />

                {/* Bottom line indicator */}
                <div 
                  className="absolute right-0 left-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#E6C280]/60 to-transparent transition-transform duration-500 ease-out"
                  style={{
                    transform: isActualPlaying ? 'scaleX(1)' : 'scaleX(0)',
                    opacity: isActualPlaying ? 1 : 0,
                  }}
                />

                {/* Content */}
                <div className="flex flex-col items-center gap-1.5 text-center z-10">
                  {isLoadingThis ? (
                    <div className="flex flex-col items-center justify-center min-h-[44px]">
                      {/* Tiny elegant loader */}
                      <div className="w-5 h-5 border-2 border-[#E6C280] border-t-transparent rounded-full animate-spin mb-1" />
                      <span className="text-[9px] font-sans text-[#E6C280] font-bold tracking-wider">{loadingProgress}%</span>
                    </div>
                  ) : (
                    <>
                      <div className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#E6C280]' : 'text-[#FFF9E6]/60'}`}>
                        {renderIcon(env.id, "w-6 h-6 filter drop-shadow-[0_0_2px_rgba(255,255,255,0.15)]")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[7px] font-bold uppercase tracking-widest opacity-40">Category 0{index + 1}</span>
                        <span className="text-xs font-bold leading-tight mt-0.5 tracking-wider" style={{ opacity: isActive ? 1 : 0.85 }}>{env.name}</span>
                      </div>
                    </>
                  )}
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