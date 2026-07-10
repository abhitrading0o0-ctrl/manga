import React, { useEffect, useRef, useState } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import Lenis from 'lenis';
import gsap from 'gsap';

interface WishSlide {
  triggerPct: [number, number]; // [start%, end%]
  title: string;
  subtitle: string;
  effect: 'stars' | 'balloons' | 'sakura' | 'hearts' | 'shootingStars';
}

export const ScrollStory: React.FC = () => {
  const { setView } = useView();
  const { playSound } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const skipBtnRef = useRef<HTMLButtonElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const trustBtnRef = useRef<HTMLButtonElement | null>(null);

  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const TOTAL_FRAMES = 300;
  const loadedFramesRef = useRef<HTMLImageElement[]>([]);
  const targetFrameRef = useRef(1);
  const currentFrameRef = useRef(1);

  // Custom particle state for scroll overlays
  const effectParticlesRef = useRef<any[]>([]);

  const wishes: WishSlide[] = [
    {
      triggerPct: [0.08, 0.22],
      title: "",
      subtitle: "",
      effect: "stars"
    },
    {
      triggerPct: [0.26, 0.42],
      title: "",
      subtitle: "",
      effect: "balloons"
    },
    {
      triggerPct: [0.46, 0.62],
      title: "",
      subtitle: "",
      effect: "sakura"
    },
    {
      triggerPct: [0.66, 0.82],
      title: "",
      subtitle: "",
      effect: "hearts"
    },
    {
      triggerPct: [0.85, 0.94],
      title: "",
      subtitle: "",
      effect: "shootingStars"
    }
  ];

  useEffect(() => {
    // 1. Load preloaded frames from browser cache
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const pad = String(i).padStart(3, '0');
      img.src = `/scroll-frames/ezgif-frame-${pad}.jpg`;
      loadedImages[i] = img;
    }
    loadedFramesRef.current = loadedImages;

    // 2. Setup Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      drawFrame(currentFrameRef.current);
    };
    window.addEventListener('resize', resize);

    const drawFrame = (frameIndex: number) => {
      const img = loadedFramesRef.current[Math.round(frameIndex)];
      if (!img || !img.complete) return;

      const wRatio = window.innerWidth / img.width;
      const hRatio = window.innerHeight / img.height;
      const scale = Math.min(wRatio, hRatio);

      const x = (window.innerWidth - img.width * scale) / 2;
      const y = (window.innerHeight - img.height * scale) / 2;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Draw scroll effects
      drawEffectParticles(ctx);
    };

    // 3. Setup Lenis Scroll
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const progress = scrollTop / docHeight;
      setScrollProgress(progress);

      // Map progress to frames
      let frame = 1 + Math.floor(progress * (TOTAL_FRAMES - 1));
      frame = Math.max(1, Math.min(TOTAL_FRAMES, frame));
      targetFrameRef.current = frame;

      // Track active wish text overlays
      let activeIdx = null;
      for (let i = 0; i < wishes.length; i++) {
        const [start, end] = wishes[i].triggerPct;
        if (progress >= start && progress <= end) {
          activeIdx = i;
          break;
        }
      }
      setActiveSlide(activeIdx);

      // Trigger effects creation on slide enters
      if (activeIdx !== null) {
        triggerEffectParticles(wishes[activeIdx].effect);
      }

      // Show/Hide footer section near bottom (last 5%)
      if (progress >= 0.95) {
        if (footerRef.current) footerRef.current.classList.add('active');
        if (skipBtnRef.current) skipBtnRef.current.classList.add('hide');
      } else {
        if (footerRef.current) footerRef.current.classList.remove('active');
        if (skipBtnRef.current) skipBtnRef.current.classList.remove('hide');
      }
    };

    lenis.on('scroll', onScroll);

    // Particle drawer
    const drawEffectParticles = (c: CanvasRenderingContext2D) => {
      const pArr = effectParticlesRef.current;
      for (let i = pArr.length - 1; i >= 0; i--) {
        const p = pArr[i];
        p.y += p.vy;
        p.x += p.vx;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          pArr.splice(i, 1);
          continue;
        }

        c.beginPath();
        if (p.type === 'sakura') {
          c.fillStyle = `rgba(255, 183, 197, ${p.alpha})`;
          c.ellipse(p.x, p.y, p.size, p.size * 0.6, p.rotation, 0, Math.PI * 2);
        } else if (p.type === 'balloon') {
          c.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          c.fill();
          // Draw a small thread line
          c.beginPath();
          c.strokeStyle = `rgba(255,255,255, ${p.alpha * 0.35})`;
          c.moveTo(p.x, p.y + p.size);
          c.lineTo(p.x, p.y + p.size + 15);
          c.stroke();
          continue;
        } else {
          // Heart or sparkle stars
          c.fillStyle = `rgba(${p.color}, ${p.alpha})`;
          c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        c.fill();
      }
    };

    const triggerEffectParticles = (type: string) => {
      const pArr = effectParticlesRef.current;
      // throttle particle spawn
      if (pArr.length > 80) return;

      const isLeft = Math.random() > 0.5;
      const x = isLeft ? Math.random() * (window.innerWidth * 0.3) : window.innerWidth * 0.7 + Math.random() * (window.innerWidth * 0.3);

      if (type === 'sakura') {
        pArr.push({
          type: 'sakura',
          x: Math.random() * window.innerWidth,
          y: -10,
          vx: (Math.random() - 0.2) * 1.5,
          vy: Math.random() * 1.2 + 0.8,
          size: Math.random() * 5 + 3,
          alpha: 0.95,
          decay: Math.random() * 0.003 + 0.002,
          rotation: Math.random() * Math.PI
        });
      } else if (type === 'balloons') {
        const colors = ['251, 113, 133', '96, 165, 250', '252, 211, 77', '167, 139, 250'];
        pArr.push({
          type: 'balloon',
          x: x,
          y: window.innerHeight + 20,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -(Math.random() * 1.5 + 1.0),
          size: Math.random() * 12 + 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 0.9,
          decay: 0.001
        });
      } else if (type === 'hearts') {
        pArr.push({
          type: 'heart',
          x: x,
          y: window.innerHeight + 20,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * 1.2 + 0.8),
          size: Math.random() * 6 + 4,
          color: '244, 63, 94', // Rose
          alpha: 0.95,
          decay: 0.002
        });
      }
    };

    // 4. Smooth scroll animations ticker
    const tick = (time: number) => {
      lenis.raf(time);

      // Lerp frame indices
      currentFrameRef.current += (targetFrameRef.current - currentFrameRef.current) * 0.08;

      drawFrame(currentFrameRef.current);

      requestAnimationFrame(tick);
    };

    resize();
    const rafId = requestAnimationFrame(tick);

    // Initial button entrance animations in footer
    gsap.set(trustBtnRef.current, { scale: 0.85, opacity: 0 });

    return () => {
      window.removeEventListener('resize', resize);
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Watch for footer active class triggers
  useEffect(() => {
    if (scrollProgress >= 0.95) {
      gsap.to(trustBtnRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1.0,
        ease: 'elastic.out(1, 0.6)',
        overwrite: 'auto'
      });
    } else {
      gsap.to(trustBtnRef.current, {
        scale: 0.85,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    }
  }, [scrollProgress]);

  const handleSkip = () => {
    playSound('click');
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleOpenGift = () => {
    playSound('click');
    setView('GIFT');
  };

  return (
    <div ref={scrollContainerRef} className="relative bg-bg">

      {/* Skip Button */}
      <button
        ref={skipBtnRef}
        onClick={handleSkip}
        className="clickable fixed top-8 right-8 z-[40] px-5 py-2.5 bg-bg/60 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-gray hover:text-white hover:border-gold hover:bg-gold/10 transition-all duration-300 shadow-md backdrop-blur-md cursor-pointer select-none [&.hide]:opacity-0 [&.hide]:pointer-events-none"
      >
        Skip Scroll →
      </button>

      {/* Floating Canvas viewer */}
      <div className="fixed inset-0 w-screen h-screen z-10 pointer-events-none flex items-center justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain block bg-transparent" />
      </div>

      {/* Story Overlay panel */}
      <div className="relative z-20 pointer-events-none flex flex-col justify-start">

        {/* Placeholder scrolls to drive scroll length */}
        <div className="h-[750vh] relative">

          {/* Initial Scroll Guide Overlay */}
          <div 
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-xl px-6 transition-all duration-1000 ease-out flex flex-col items-center z-30
              ${scrollProgress < 0.05 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
            `}
          >
            <div className="glass-panel px-10 py-8 rounded-2xl border-white/5 relative">
              {/* Fireflies under slides */}
              <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-accent/25 blur-xl animate-pulse" />
              <div className="absolute -bottom-6 -right-6 w-12 h-12 rounded-full bg-gold/25 blur-xl animate-pulse" />

              <p className="text-gold font-sans font-light tracking-[0.2em] text-xs sm:text-sm uppercase mb-4 select-text animate-pulse">
                Scroll to explore
              </p>
              
              <div className="flex flex-col items-center gap-1.5 opacity-80">
                <svg 
                  className="w-5 h-5 text-gold animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Active slides viewer */}
          {wishes.map((w, index) => {
            const isCurrent = activeSlide === index;
            return (
              <div
                key={index}
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-xl px-6 transition-all duration-1000 ease-out flex flex-col items-center
                  ${isCurrent ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
                `}
              >
                {(w.title || w.subtitle) && (
                  <div className="glass-panel px-8 py-6 rounded-2xl border-white/5 relative">
                    {/* Fireflies under slides */}
                    <div className="absolute -top-6 -left-6 w-12 h-12 rounded-full bg-accent/25 blur-xl animate-pulse" />
                    <div className="absolute -bottom-6 -right-6 w-12 h-12 rounded-full bg-gold/25 blur-xl animate-pulse" />

                    {w.title && (
                      <h2 className="text-white font-display text-xl sm:text-2xl font-semibold mb-3 tracking-[0.05em] leading-normal select-text">
                        {w.title}
                      </h2>
                    )}
                    {w.subtitle && (
                      <p className="text-gold font-sans font-light tracking-wide text-xs sm:text-sm leading-relaxed max-w-md select-text">
                        {w.subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll footer (The Gift reveal block) */}
        <div
          ref={footerRef}
          className="relative min-h-screen z-30 flex flex-col items-center justify-center text-center px-4 [&.active]:pointer-events-auto"
        >
          {/* Frosted Glass Contrast protection card */}
          <div className="glass-panel bg-[#0b0c10]/85 border border-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-12 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(90,73,214,0.15)] max-w-sm w-full flex flex-col items-center justify-center">
            <h2 className="text-white font-display text-2xl sm:text-3xl font-bold tracking-[0.08em] mb-2.5 glow-text-gold select-text">
              A Box of Echoes
            </h2>
            <p className="text-gold/90 font-sans font-light text-[10px] sm:text-xs tracking-widest uppercase mb-8 leading-relaxed select-text">
              When words fall short, let magic speak.
            </p>

            <button
              ref={trustBtnRef}
              onClick={handleOpenGift}
              className="clickable cursor-pointer text-white font-display text-xs tracking-[0.3em] font-bold uppercase border border-gold rounded-full px-10 py-4 bg-accent/40 backdrop-blur-md shadow-md transition-all duration-500 hover:bg-gold hover:text-bg hover:shadow-[0_0_30px_rgba(233,200,116,0.6)] active:scale-95 glow-text-gold"
            >
              TRUST ME
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};