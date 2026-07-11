import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface GiftCard {
  id: number;
  label: string;
  image: string;
  type: 'image' | 'svg';
  title: string;
  description: string;
}

const TOTAL_GIFT_FRAMES = 299;

const gifts: GiftCard[] = [
  {
    id: 1,
    label: "📖 The Manga",
    image: "/assets/manga-cover.jpg",
    type: "image",
    title: "Hardcover Manga",
    description: "A customized tale, crafted frame-by-frame just for you."
  },
  {
    id: 2,
    label: "🎵 Peace Room",
    image: "/assets/playlist-cover.png",
    type: "image",
    title: "Soothing Soundscapes",
    description: "A calm sanctuary for whenever the world gets too loud."
  },
  {
    id: 3,
    label: "🎮 Arcade Cabin",
    image: "/assets/gaming-cover.png?v=2",
    type: "image",
    title: "Retro Gaming Lounge",
    description: "Challenge your reflexes and test your path-tracing skills."
  },
  {
    id: 4,
    label: "❤️ Heart Letters",
    image: "/assets/last-gift.svg",
    type: "svg",
    title: "Letters of the Heart",
    description: "Warm thoughts, handwritten chapters, and secrets never said."
  },
  {
    id: 5,
    label: "✨ One Last Surprise",
    image: "/assets/secret-gift.svg",
    type: "svg",
    title: "The Climax Celebration",
    description: "A final surprise waiting once your journey is complete."
  }
];

export const GiftOpening: React.FC = () => {
  const { setView } = useView();
  const { playSound } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [currentGiftIdx, setCurrentGiftIdx] = useState(0);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);

  const loadedGiftFramesRef = useRef<HTMLImageElement[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const currentFrameRef = useRef(1);
  const isFirstOpenRef = useRef(true);
  const soundTriggeredRef = useRef<Record<string, boolean>>({});

  // Draw a single frame to the canvas (no getContext call — uses cached ctx)
  const drawFrame = useCallback((frameIndex: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const img = loadedGiftFramesRef.current[frameIndex];
    if (!img || !img.complete) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const wRatio = w / img.width;
    const hRatio = h / img.height;
    const scale = Math.min(wRatio, hRatio) * 0.95;

    const x = (w - img.width * scale) / 2;
    const y = (h - img.height * scale) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }, []);

  // rAF-based animation loop (replaces setInterval for smoother playback)
  const startAnimation = useCallback((startFrame: number, isFirst: boolean) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    currentFrameRef.current = startFrame;
    soundTriggeredRef.current = {};

    const fps = 30;
    const frameDuration = 1000 / fps;
    let lastTime = 0;

    const animate = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      if (lastTime === 0) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed >= frameDuration) {
        lastTime = timestamp - (elapsed % frameDuration);
        currentFrameRef.current++;
        const frame = currentFrameRef.current;

        if (frame > TOTAL_GIFT_FRAMES) {
          isPlayingRef.current = false;
          rafIdRef.current = null;
          return;
        }

        drawFrame(frame);

        // Sound effects (fire once per trigger point)
        if (isFirst && frame < 120 && frame % 24 === 0 && !soundTriggeredRef.current[`shake-${frame}`]) {
          soundTriggeredRef.current[`shake-${frame}`] = true;
          playSound('shake');
        }
        if (frame === 120 && !soundTriggeredRef.current['open']) {
          soundTriggeredRef.current['open'] = true;
          playSound('open');
        }
        if (frame === 150 && !soundTriggeredRef.current['reveal']) {
          soundTriggeredRef.current['reveal'] = true;
          playSound('reveal');
          revealCard();
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
  }, [drawFrame, playSound]);

  // Stop current animation cleanly
  const stopAnimation = useCallback(() => {
    isPlayingRef.current = false;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Card reveal animation
  const revealCard = useCallback(() => {
    setCardRevealed(true);
    setTimeout(() => {
      if (cardRef.current) {
        gsap.killTweensOf(cardRef.current);
        gsap.fromTo(cardRef.current,
          { opacity: 0, scale: 0.3, y: 150, rotationY: -45 },
          { opacity: 1, scale: 1, y: 0, rotationY: 0, duration: 1.4, ease: 'back.out(1.4)' }
        );
      }
    }, 50);
  }, []);

  // 1. Load gift frames and setup canvas (runs once on mount)
  useEffect(() => {
    // Cache canvas context once
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    // Load frames — images are already cached by the Loader, so this is fast
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_GIFT_FRAMES; i++) {
      const img = new Image();
      const pad = String(i).padStart(3, '0');
      img.src = `/gift-frames/ezgif-frame-${pad}.jpg`;
      loadedImages[i] = img;
    }
    loadedGiftFramesRef.current = loadedImages;

    // Canvas sizing
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      drawFrame(Math.max(1, currentFrameRef.current));
    };
    window.addEventListener('resize', resize);
    resize();

    // Slide-in entrance animation
    gsap.fromTo(canvas, { y: -200, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: 'back.out(1.2)' });

    // Start initial gift sequence after a brief delay so the canvas is ready
    const startTimer = setTimeout(() => {
      startAnimation(1, true);
      isFirstOpenRef.current = false;
    }, 100);

    return () => {
      window.removeEventListener('resize', resize);
      stopAnimation();
      clearTimeout(startTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Card Mouse Hover coordinates & 3D Tilt calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.setProperty('--card-w', `${rect.width}px`);
    card.style.setProperty('--card-h', `${rect.height}px`);
    card.style.setProperty('--bg-x', `${-(x * 2 - 90)}px`);
    card.style.setProperty('--bg-y', `${-(y * 2 - 90)}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 10;
    const rotateX = -((y - centerY) / centerY) * 10;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.35,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    setZoomScale(1.0);

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.65,
      ease: 'elastic.out(1.1, 0.5)'
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoomScale(prev => {
      const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
      const nextScale = prev + zoomFactor;
      return Math.max(1.0, Math.min(3.0, nextScale));
    });
  };

  const handleNextGift = () => {
    // Prevent double-clicks and clicks during transitions
    if (isTransitioningRef.current || !cardRevealed) return;
    isTransitioningRef.current = true;

    playSound('click');

    // Cancel any running frame-loop animation immediately
    stopAnimation();

    if (currentGiftIdx < gifts.length - 1) {
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          opacity: 0,
          scale: 0.45,
          y: -100,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            setCardRevealed(false);
            setZoomScale(1.0);
            setCurrentGiftIdx(prev => prev + 1);
            isTransitioningRef.current = false;
            // Start from frame 120 (skip shaking) for subsequent gifts
            startAnimation(120, false);
          }
        });
      } else {
        setCardRevealed(false);
        setZoomScale(1.0);
        setCurrentGiftIdx(prev => prev + 1);
        isTransitioningRef.current = false;
        startAnimation(120, false);
      }
    } else {
      setView('HOME');
    }
  };

  // Safe gift lookup (guards against out-of-bounds)
  const currentGift = gifts[currentGiftIdx];

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col justify-center items-center select-none overflow-hidden">
      {/* Dynamic box animation canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-10 pointer-events-none block bg-transparent 
          ${cardRevealed ? 'blur-backdrop-canvas' : 'transition-all duration-700'}`}
      />

      {/* Floating Sparkles behind active card */}
      {cardRevealed && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-gold rounded-full blur-[1px]"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                top: `${40 + Math.random() * 20}%`,
                left: `${30 + Math.random() * 40}%`,
                opacity: Math.random() * 0.8,
                animation: `float ${Math.random() * 5 + 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Card view layer */}
      {cardRevealed && currentGift && (
        <div className="relative z-30 flex flex-col items-center max-w-[90vw] w-fit px-6">

          {/* Main 3D borderless card wrapper */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            className="clickable group card-cursor-blur-container max-w-[90vw] max-h-[65vh] w-fit h-fit rounded-2xl flex items-center justify-center shadow-[0_30px_80px_rgba(0,0,0,0.9)] overflow-hidden cursor-none relative"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Magnifying Glass Overlay (2x zoom) */}
            <div
              className="absolute pointer-events-none rounded-full border border-white/20 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              style={{
                width: '180px',
                height: '180px',
                left: `var(--mouse-x, 0px)`,
                top: `var(--mouse-y, 0px)`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20,
                backgroundImage: `url(${currentGift.image})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `var(--bg-x, 0px) var(--bg-y, 0px)`,
                backgroundSize: `calc(var(--card-w, 100%) * 2) calc(var(--card-h, 100%) * 2)`,
                boxShadow: '0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(255,255,255,0.3)'
              }}
            />

            {/* Card Content image/vector asset filling edge-to-edge */}
            <img
              src={currentGift.image}
              alt={currentGift.title}
              className="max-w-[85vw] max-h-[60vh] w-auto h-auto block object-contain pointer-events-none transition-transform duration-200"
              style={{
                transform: `scale(${zoomScale})`
              }}
            />
          </div>

          {/* Trigger button */}
          <button
            onClick={handleNextGift}
            disabled={isTransitioningRef.current}
            className="clickable mt-10 px-10 py-4 bg-transparent border border-gold text-white font-sans text-xs font-semibold tracking-[0.25em] uppercase rounded-full shadow-lg transition-all duration-300 hover:bg-gold hover:text-bg hover:shadow-[0_0_20px_rgba(233,200,116,0.35)] active:scale-95 cursor-pointer"
          >
            {currentGiftIdx < gifts.length - 1 ? "Hold on, one more gift... →" : "📖 Read My Gift"}
          </button>
        </div>
      )}
    </div>
  );
};