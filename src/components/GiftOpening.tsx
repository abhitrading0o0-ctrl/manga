import React, { useEffect, useRef, useState } from 'react';
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

export const GiftOpening: React.FC = () => {
  const { setView } = useView();
  const { playSound } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const [currentGiftIdx, setCurrentGiftIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  
  const loadedGiftFramesRef = useRef<HTMLImageElement[]>([]);
  const TOTAL_GIFT_FRAMES = 299;
  const loopIntervalRef = useRef<number | null>(null);

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

  // 1. Load gift opening frames
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 1; i <= TOTAL_GIFT_FRAMES; i++) {
      const img = new Image();
      const pad = String(i).padStart(3, '0');
      img.src = `/gift-frames/ezgif-frame-${pad}.jpg`;
      loadedImages[i] = img;
    }
    loadedGiftFramesRef.current = loadedImages;

    // Canvas sizing
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      // Internal buffer size scaled by DPR
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      // CSS layout size matching viewport exactly
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      drawFrame(1);
    };
    window.addEventListener('resize', resize);
    resize();

    // Trigger box slide in
    gsap.fromTo(canvas, { y: -200, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: 'back.out(1.2)' });

    // Start box shake timer
    startGiftSequence(true);

    return () => {
      window.removeEventListener('resize', resize);
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    };
  }, []);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = loadedGiftFramesRef.current[frameIndex];
    if (!ctx || !img || !img.complete) return;

    const wRatio = window.innerWidth / img.width;
    const hRatio = window.innerHeight / img.height;
    const scale = Math.min(wRatio, hRatio) * 0.95; // fit

    const x = (window.innerWidth - img.width * scale) / 2;
    const y = (window.innerHeight - img.height * scale) / 2;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  };

  const startGiftSequence = (isFirst: boolean) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCardRevealed(false);

    let currentFrame = isFirst ? 1 : 120; // Skip shaking for cards 2-5

    const fps = 30;
    const interval = 1000 / fps;

    if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);

    loopIntervalRef.current = window.setInterval(() => {
      currentFrame++;
      drawFrame(currentFrame);

      // Play Sound effects
      if (isFirst && currentFrame < 120 && currentFrame % 24 === 0) {
        playSound('shake');
      }
      if (currentFrame === 120) {
        playSound('open');
      }
      // Reveal card at frame 150
      if (currentFrame === 150) {
        playSound('reveal');
        revealCard();
      }

      if (currentFrame >= TOTAL_GIFT_FRAMES) {
        if (loopIntervalRef.current) {
          clearInterval(loopIntervalRef.current);
          loopIntervalRef.current = null;
        }
        setIsAnimating(false);
      }
    }, interval);
  };

  const revealCard = () => {
    setCardRevealed(true);
    // GSAP rise up card animation
    setTimeout(() => {
      if (cardRef.current) {
        gsap.killTweensOf(cardRef.current);
        gsap.fromTo(cardRef.current, 
          { opacity: 0, scale: 0.3, y: 150, rotationY: -45 }, 
          { opacity: 1, scale: 1, y: 0, rotationY: 0, duration: 1.4, ease: 'back.out(1.4)' }
        );
      }
    }, 50);
  };

  // Card Mouse Hover coordinates & 3D Tilt calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set CSS properties for magnifier position, dimensions, and background offset
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
    card.style.setProperty('--card-w', `${rect.width}px`);
    card.style.setProperty('--card-h', `${rect.height}px`);
    card.style.setProperty('--bg-x', `${-(x * 2 - 90)}px`);
    card.style.setProperty('--bg-y', `${-(y * 2 - 90)}px`);

    // 3D rotation tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * 10; // max 10 deg
    const rotateX = -((y - centerY) / centerY) * 10; // max 10 deg

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

    setZoomScale(1.0); // Reset zoom scale on mouse exit

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.65,
      ease: 'elastic.out(1.1, 0.5)'
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Prevent default scroll behavior
    e.preventDefault();
    setZoomScale(prev => {
      const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
      const nextScale = prev + zoomFactor;
      return Math.max(1.0, Math.min(3.0, nextScale)); // Clamp between 1.0x and 3.0x
    });
  };

  const handleNextGift = () => {
    playSound('click');
    if (currentGiftIdx < gifts.length - 1) {
      // Fade out active card before starting next box open
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          opacity: 0,
          scale: 0.45,
          y: -100,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            setCardRevealed(false);
            setZoomScale(1.0); // Reset zoom for next card
            setCurrentGiftIdx(prev => prev + 1);
            startGiftSequence(false);
          }
        });
      }
    } else {
      // Transition to floating island homepage
      setView('HOME');
    }
  };

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
      {cardRevealed && (
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
                backgroundImage: `url(${gifts[currentGiftIdx].image})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `var(--bg-x, 0px) var(--bg-y, 0px)`,
                backgroundSize: `calc(var(--card-w, 100%) * 2) calc(var(--card-h, 100%) * 2)`,
                boxShadow: '0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(255,255,255,0.3)'
              }}
            />

            {/* Card Content image/vector asset filling edge-to-edge */}
            <img 
              src={gifts[currentGiftIdx].image} 
              alt={gifts[currentGiftIdx].title} 
              className="max-w-[85vw] max-h-[60vh] w-auto h-auto block object-contain pointer-events-none transition-transform duration-200"
              style={{
                transform: `scale(${zoomScale})`
              }}
            />
          </div>

          {/* Trigger button */}
          <button
            onClick={handleNextGift}
            className="clickable mt-10 px-10 py-4 bg-transparent border border-gold text-white font-sans text-xs font-semibold tracking-[0.25em] uppercase rounded-full shadow-lg transition-all duration-300 hover:bg-gold hover:text-bg hover:shadow-[0_0_20px_rgba(233,200,116,0.35)] active:scale-95 cursor-pointer"
          >
            {currentGiftIdx < gifts.length - 1 ? "Hold on, one more gift... →" : "📖 Read My Gift"}
          </button>
        </div>
      )}
    </div>
  );
};