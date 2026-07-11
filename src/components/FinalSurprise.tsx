import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useView } from '../context/ViewContext';
import gsap from 'gsap';

interface Lantern {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
}

const wishes = [
  "I wish you a long, long life, a hundred years and then some.",
  "I wish you travel to every country you've ever dreamed of.",
  "I wish you grow strong, inside and out.",
  "I wish you find friends who stay for a lifetime, not just a season.",
  "I wish your art becomes known the exact way you want it to be on your own terms.",
  "I wish disease and illness stay far away from you, always.",
  "I wish you stand before mountains that make you feel small in the best way.",
  "I wish god shields you from love that hurts more than it heals.",
  "I wish you achieve every bit of financial freedom you're dreaming of.",
  "I wish you walk on islands so beautiful they don't feel real.",
  "I wish you grow taller than all your friends, just for the fun of it.",
  "I wish you good health for every single year of your life.",
  "I wish you set foot on every continent this earth has.",
  "I wish your heart only knows kindness from the people who stay.",
  "I wish you become the artist you've always wanted to be, in your own way.",
  "I wish you see oceans in every color they come in.",
  "I wish you never have to fight your own body, just live in it, easily.",
  "I wish your bank account reflects your worth someday.",
  "I wish you travel wherever your heart pulls you, without hesitation.",
  "I wish you outlive every worry you have right now.",
  "I wish you find people who love you the way you deserve.",
  "I wish your name becomes one people remember in the art world.",
  "I wish you visit every wonder this world has hidden away.",
  "I wish your body stays strong through every decade of your life.",
  "I wish you never settle for a love that isn't right for you.",
  "I wish you financial peace, not just financial success.",
  "I wish you cross deserts, forests, and everything in between.",
  "I wish you live to see how far your art actually takes you.",
  "I wish protection follows you into every relationship you enter.",
  "I wish you grow taller, stronger, and more sure of yourself every year.",
  "I wish you explore every ocean this planet holds.",
  "I wish good health chooses you, again and again.",
  "I wish you find success measured in your own terms, not anyone else's.",
  "I wish you never know heartbreak that lingers too long.",
  "I wish your travels take you somewhere unexpected and wonderful.",
  "I wish your art hangs somewhere you never imagined it could.",
  "I wish you a body that carries you through a hundred years with ease.",
  "I wish your friendships never fade, no matter the distance.",
  "I wish you see every mountain range worth seeing.",
  "I wish love finds you gently, not painfully.",
  "I wish you achieve the kind of success that lets you breathe easy.",
  "I wish your feet touch sand on every continent's shore.",
  "I wish you're remembered as one of the greats in your craft.",
  "I wish illness never finds a way into your life.",
  "I wish you grow into the tallest, boldest version of yourself.",
  "I wish every country you visit leaves a mark on you.",
  "I wish you're shielded from anyone who doesn't deserve your heart.",
  "I wish wealth comes to you in a way that feels earned and deserved.",
  "I wish your art becomes as loved by the world as it is by me.",
  "I wish you a hundred birthdays, each better than the last.",
  "I wish you stand on top of a mountain you climbed yourself.",
  "I wish you never have to settle for less than real love.",
  "I wish your friendships bring you as much joy as your art does.",
  "I wish you visit every island that's ever caught your eye.",
  "I wish your health stays strong enough to chase every dream.",
  "I wish financial success comes without losing yourself to get it.",
  "I wish you travel until your passport has no room left.",
  "I wish you're protected from people who don't truly value you.",
  "I wish your art becomes famous in exactly the way you'd want, not anyone else's version of it.",
  "I wish you grow up strong, tall, and completely unbothered by comparison.",
  "I wish every continent you visit teaches you something new about yourself.",
  "I wish your body stays free of sickness for all your years.",
  "I wish you a love story that only adds to your life, never subtracts.",
  "I wish you achieve the kind of fame that feels good, not overwhelming.",
  "I wish you walk through every forest and desert you've ever imagined.",
  "I wish your friendships outlast every distance and disagreement.",
  "I wish you a hundred years of good health and good luck.",
  "I wish you see the world's oceans from every coastline that matters to you.",
  "I wish you're guarded against heartbreak that isn't meant for you.",
  "I wish your success in art comes with peace, not pressure.",
  "I wish you climb mountains, literal and otherwise, and win every time.",
  "I wish you a life so long you get to see how everything turns out.",
  "I wish your travels never stop, country after country, year after year.",
  "I wish you tall, strong, and completely yourself.",
  "I wish you real friends who show up for you the way you show up for others.",
  "I wish your art is loved across the whole world someday.",
  "I wish good health becomes a given in your life, not a hope.",
  "I wish you set foot on islands most people only dream about.",
  "I wish love treats you gently and stays only if it's good for you.",
  "I wish your bank account grows the way your talent deserves.",
  "I wish you a body strong enough to carry you through a hundred adventures.",
  "I wish every mountain you see makes you feel alive.",
  "I wish protection surrounds you in every relationship, romantic or otherwise.",
  "I wish you visit every continent before you're done exploring.",
  "I wish your name becomes known for your art, exactly the way you want.",
  "I wish you a century of birthdays, each one sweeter than before.",
  "I wish your health never falters, not once, not ever.",
  "I wish you experience every ocean's beauty firsthand.",
  "I wish you never fall for love that isn't good for your heart.",
  "I wish financial success finds you without any struggle attached.",
  "I wish you're taller, stronger, and more confident with each passing year.",
  "I wish your travels take you across every desert, forest, and shoreline.",
  "I wish your friendships become the kind people write stories about.",
  "I wish you're shielded from anyone who might hurt what makes you, you.",
  "I wish your art becomes the most recognized version of itself, on your terms.",
  "I wish you a hundred years free of illness and full of joy.",
  "I wish you every island, every mountain, every hidden corner of this world.",
  "I wish love only ever adds to your life, never takes from it.",
  "I wish your success, in art, in life, in love, is entirely and completely yours.",
  "I wish you a long, full, beautiful life, exactly the one you'd choose for yourself."
];

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const FinalSurprise: React.FC = () => {
  const { playSound } = useAudio();
  const { setView } = useView();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wishTextRef = useRef<HTMLDivElement | null>(null);
  const entryStarRef = useRef<HTMLSpanElement | null>(null);
  const entryTitleRef = useRef<HTMLHeadingElement | null>(null);

  // States
  const [phase, setPhase] = useState<'entry' | 'scale' | 'playing' | 'ended'>('entry');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scaleCount, setScaleCount] = useState(0);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const lightPoints = useRef<{ x: number; y: number; size: number }[]>([]);

  // Generate 100 random coordinates for the scale moment
  if (lightPoints.current.length === 0) {
    lightPoints.current = Array.from({ length: 100 }, () => ({
      x: 3 + Math.random() * 94,
      y: 3 + Math.random() * 94,
      size: Math.random() * 4 + 2,
    }));
  }

  // 1. Canvas Lantern Drift Overlay Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lanterns: Lantern[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Create initial drifting lanterns
    const count = prefersReducedMotion() ? 5 : 12;
    for (let i = 0; i < count; i++) {
      lanterns.push(createLantern(Math.random() * window.innerHeight));
    }

    function createLantern(yOverride?: number): Lantern {
      const isMotionReduced = prefersReducedMotion();
      return {
        x: Math.random() * window.innerWidth,
        y: yOverride ?? window.innerHeight + 60,
        vx: isMotionReduced ? 0 : (Math.random() - 0.5) * 0.35,
        vy: isMotionReduced ? 0 : -(Math.random() * 0.4 + 0.2),
        width: Math.random() * 14 + 10,
        height: Math.random() * 20 + 14,
        alpha: Math.random() * 0.45 + 0.35,
        rotation: isMotionReduced ? 0 : (Math.random() - 0.5) * 0.08,
        rotSpeed: isMotionReduced ? 0 : (Math.random() - 0.5) * 0.003,
      };
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lanterns.forEach((l, idx) => {
        l.y += l.vy;
        l.x += l.vx;
        l.rotation += l.rotSpeed;

        if (l.y < -60) {
          lanterns[idx] = createLantern();
        }

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rotation);

        const grad = ctx.createLinearGradient(0, 0, 0, l.height);
        grad.addColorStop(0, `rgba(233, 200, 116, ${l.alpha})`);
        grad.addColorStop(1, `rgba(244, 117, 107, ${l.alpha * 0.65})`);

        ctx.fillStyle = grad;
        ctx.shadowBlur = prefersReducedMotion() ? 0 : 18;
        ctx.shadowColor = 'rgba(244, 117, 107, 0.6)';
        ctx.fillRect(-l.width / 2, -l.height / 2, l.width, l.height);
        ctx.shadowBlur = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${l.alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(0, l.height / 3.5, l.width / 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      rafId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // 2. Cinematic Entrance Moment Title timeline (Beat 1)
  useEffect(() => {
    if (phase !== 'entry') return;

    playSound('reveal');

    const star = entryStarRef.current;
    const title = entryTitleRef.current;
    const subtitle = document.querySelector('.entry-subtitle');
    if (!star || !title || !subtitle) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('scale');
      },
    });

    if (prefersReducedMotion()) {
      tl.to([star, title, subtitle], { opacity: 1, duration: 1.0 });
      tl.to({}, { duration: 1.5 });
      tl.to([star, title, subtitle], { opacity: 0, duration: 0.6 });
      return;
    }

    tl.fromTo(star,
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 1.3, duration: 0.8, ease: 'back.out(1.8)' }
    );
    tl.to(star, { scale: 1.0, duration: 0.3 });

    tl.fromTo(title,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', textShadow: '0 0 25px rgba(233, 200, 116, 0.45)' },
      '-=0.4'
    );

    tl.fromTo(subtitle,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.3'
    );

    tl.to({}, { duration: 2.2 });

    tl.to([star, title, subtitle], {
      opacity: 0,
      y: -40,
      duration: 0.9,
      ease: 'power2.in',
    });
  }, [phase]);

  // 3. Cinematic Scale count moment (Beat 2)
  useEffect(() => {
    if (phase !== 'scale') return;

    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: 100,
      duration: 1.8,
      ease: 'power1.inOut',
      onUpdate: () => {
        setScaleCount(Math.floor(obj.val));
      },
      onComplete: () => {
        // Hold for 1 second, then drift/converge upward and transition to playing phase
        setTimeout(() => {
          const targets = document.querySelectorAll('.scale-light-point, .scale-counter');
          if (targets.length === 0) {
            setPhase('playing');
            setCurrentIndex(0);
            return;
          }

          gsap.to(targets, {
            y: -75,
            opacity: 0,
            duration: 1.1,
            ease: 'power2.in',
            stagger: {
              amount: 0.35,
              from: 'random',
            },
            onComplete: () => {
              setPhase('playing');
              setCurrentIndex(0);
            },
          });
        }, 1000);
      },
    });

    return () => {
      tween.kill();
    };
  }, [phase]);

  // 3. Play individual wish sequence using GSAP
  const playWish = (index: number) => {
    const textEl = wishTextRef.current;
    if (!textEl) return;

    const isMilestone = (index + 1) % 25 === 0;

    // Reset previous animations
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    // Set milestone size & shadow styles
    if (isMilestone) {
      textEl.style.fontSize = 'clamp(2.0rem, 5vw, 3.75rem)';
      textEl.style.color = '#FFF3D6';
    } else {
      textEl.style.fontSize = 'clamp(1.6rem, 4vw, 2.75rem)';
      textEl.style.color = '#E9C874';
    }

    // Play chime on milestone checkpoints
    if (isMilestone) {
      playSound('reveal');
    }

    const tl = gsap.timeline({
      paused: !isPlaying,
      onComplete: () => {
        if (index < wishes.length - 1) {
          setCurrentIndex(index + 1);
        } else {
          setPhase('ended');
        }
      },
    });
    timelineRef.current = tl;

    if (prefersReducedMotion()) {
      tl.fromTo(textEl, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      tl.to({}, { duration: 3.0 });
      tl.to(textEl, { opacity: 0, duration: 0.4 });
      return;
    }

    // Standard cinematic drift-up reveal
    tl.fromTo(textEl,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power2.out',
        textShadow: isMilestone
          ? '0 0 25px rgba(233, 200, 116, 0.8), 0 0 45px rgba(233, 200, 116, 0.4)'
          : '0 0 15px rgba(233, 200, 116, 0.35)',
      }
    );

    // Hold step
    tl.to({}, { duration: isMilestone ? 4.5 : 3.0 });

    // Exit upward fade
    tl.to(textEl, {
      opacity: 0,
      y: -30,
      duration: 0.8,
      ease: 'power2.in',
    });
  };

  // 4. Update timeline play/pause state
  useEffect(() => {
    if (phase !== 'playing') return;
    playWish(currentIndex);
  }, [currentIndex, phase]);

  useEffect(() => {
    if (!timelineRef.current) return;
    if (isPlaying) {
      timelineRef.current.play();
    } else {
      timelineRef.current.pause();
    }
  }, [isPlaying]);

  // 5. Navigation overrides
  const handleNext = () => {
    playSound('click');
    if (currentIndex < wishes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setPhase('ended');
    }
  };

  const handlePrev = () => {
    playSound('click');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const togglePlay = () => {
    playSound('click');
    setIsPlaying(!isPlaying);
  };

  const skipToEnd = () => {
    playSound('click');
    if (timelineRef.current) timelineRef.current.kill();
    setPhase('ended');
  };

  // 6. Keyboard Listeners
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isPlaying, phase]);

  // 7. Last Surprise redirect logic
  const handleLastSurprise = () => {
    playSound('click');
    alert("🎁 One Last Surprise:\n\nThis button can be customized to play a secret recording, trigger a photo album, or redirect to a customized video URL!");
  };

  return (
    <div className="fixed inset-0 bg-[#050608] z-50 flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background canvas starfield/lanterns */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none block w-full h-full bg-transparent" />

      {/* ── Home Back Button (Top Left) ── */}
      <button
        onClick={() => {
          playSound('click');
          setView('HOME');
        }}
        className="absolute top-6 left-6 z-30 clickable px-4 py-2 border border-white/10 hover:border-white/30 bg-[#050608]/40 hover:bg-[#050608]/80 text-[#B9B9B9] hover:text-[#FAF5EE] font-sans text-xs tracking-wider uppercase rounded-full transition-all duration-300 cursor-pointer"
      >
        ← Home
      </button>

      {/* ── Skip Link Button (Top Right) ── */}
      {phase !== 'ended' && (
        <button
          onClick={skipToEnd}
          className="absolute top-6 right-6 z-30 clickable px-4 py-2 border border-white/10 hover:border-gold/50 bg-[#050608]/40 hover:bg-[#050608]/80 text-[#B9B9B9] hover:text-[#E9C874] font-sans text-xs tracking-wider uppercase rounded-full transition-all duration-300 cursor-pointer"
        >
          Skip to End
        </button>
      )}

      {/* ── 1. ENTRY PHASE ── */}
      {phase === 'entry' && (
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center max-w-2xl">
          <span
            ref={entryStarRef}
            className="inline-block text-gold text-5xl sm:text-6xl mb-6 select-none"
            style={{ opacity: 0 }}
          >
            ✦
          </span>
          <h1
            ref={entryTitleRef}
            className="text-[#FAF5EE] font-display text-4xl sm:text-6xl font-bold tracking-widest leading-tight select-none uppercase mb-4"
            style={{ opacity: 0 }}
          >
            100 Wishes for You
          </h1>
          <p
            className="entry-subtitle font-sans text-[#FAF5EE]/75 text-base sm:text-lg font-light leading-relaxed max-w-md select-none"
            style={{ opacity: 0 }}
          >
            One for every year, every dream, every reason I'm grateful for you.
          </p>
        </div>
      )}

      {/* ── 2. SCALE MOMENT PHASE (0 to 100 Count up) ── */}
      {phase === 'scale' && (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center z-10 p-6">
          {/* Grid of 100 numbers in background for scale comparison */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 z-0">
            <div className="grid grid-cols-10 grid-rows-10 gap-x-3 gap-y-2 sm:gap-x-6 sm:gap-y-4 max-w-2xl w-full h-auto max-h-[75vh]">
              {Array.from({ length: 100 }, (_, i) => {
                const num = i + 1;
                const isLit = num <= scaleCount;
                return (
                  <div
                    key={num}
                    className="flex items-center justify-center font-sans text-xs sm:text-sm md:text-base transition-all duration-200 select-none scale-light-point"
                    style={{
                      color: isLit ? '#E9C874' : 'rgba(233, 200, 116, 0.08)',
                      fontWeight: isLit ? '700' : '300',
                      textShadow: isLit ? '0 0 10px rgba(233, 200, 116, 0.6)' : 'none',
                      transform: isLit ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Large Centered Counter */}
          <div className="scale-counter relative z-10 text-8xl sm:text-9xl md:text-[10rem] font-bold font-sans text-[#E9C874] select-none text-center pointer-events-none" style={{ filter: 'drop-shadow(0 0 30px rgba(233, 200, 116, 0.5))' }}>
            {scaleCount}
          </div>
        </div>
      )}

      {/* ── 3. PLAYING PHASE (Slideshow View) ── */}
      {phase === 'playing' && (
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl px-8 select-text text-center">
          {/* Progress Indicator */}
          <span className="font-sans text-xs sm:text-sm tracking-[0.2em] text-[#B9B9B9]/55 uppercase mb-8 select-none">
            Wish {currentIndex + 1} of {wishes.length}
          </span>

          {/* Elegant script-styled text reveal container */}
          <div className="min-h-[220px] flex items-center justify-center w-full">
            <div
              ref={wishTextRef}
              className="font-handwritten leading-relaxed select-text font-medium transition-all duration-300"
              style={{
                fontFamily: "'Caveat', cursive",
                letterSpacing: '0.02em',
              }}
            >
              {wishes[currentIndex]}
            </div>
          </div>

          {/* Audio/Slideshow controls panel (Floating Bottom) */}
          <div className="flex items-center gap-6 mt-12 bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-md px-6 py-3 rounded-full shadow-lg transition-all duration-300 select-none">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="clickable p-2 text-white/60 hover:text-[#E9C874] disabled:text-white/20 hover:scale-110 active:scale-95 transition-all cursor-pointer font-bold text-lg"
              title="Previous Wish"
            >
              ◀
            </button>

            <button
              onClick={togglePlay}
              className="clickable px-6 py-2 bg-gradient-to-r from-accent to-[#7b5eff] text-white font-sans font-bold text-xs tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(90,73,214,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause auto-play' : 'Resume auto-play'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={handleNext}
              className="clickable p-2 text-white/60 hover:text-[#E9C874] hover:scale-110 active:scale-95 transition-all cursor-pointer font-bold text-lg"
              title="Next Wish"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* ── 3. RESOLVED ENDING PHASE ── */}
      {phase === 'ended' && (
        <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center select-text">
          <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl relative max-w-xl w-full animate-scale-up">
            <span className="text-gold text-4xl mb-4 block animate-bounce select-none">✦</span>

            <h2 className="text-[#FAF5EE] font-serif italic text-2xl sm:text-3xl leading-relaxed select-none">
              "100 wishes, and I mean every single one."
            </h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalSurprise;