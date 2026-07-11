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
  "I wish you a life so long you get to see how every story you love ends.",
  "I wish your passport fills up faster than you can keep track of.",
  "I wish your body forgives you on the days you forget to rest.",
  "I wish someone believes in your art before you even ask them to.",
  "I wish you stand at the edge of a canyon and feel completely tiny and completely alive.",
  "I wish your worst days still have one good hour hidden in them.",
  "I wish you never have to choose between your art and your peace.",
  "I wish the ocean surprises you with a color you didn't know it could be.",
  "I wish you outgrow every doubt someone else planted in you.",
  "I wish your money grows without you having to sacrifice your joy for it.",
  "I wish a stranger's kindness catches you off guard one day this year.",
  "I wish you climb something  a mountain, a challenge, anything  and look back proud.",
  "I wish you never mistake being alone for being lonely.",
  "I wish your art is still yours even after the whole world has seen it.",
  "I wish you taste food in a country you never expected to visit.",
  "I wish your heart heals faster than it breaks.",
  "I wish you find a forest that makes you feel like you're the first person to ever see it.",
  "I wish you never have to explain your worth to someone who should already see it.",
  "I wish you get exactly the kind of fame that lets you keep your privacy too.",
  "I wish your body stays kind to you well into old age.",
  "I wish you cross a border and feel like a completely different person on the other side.",
  "I wish your friendships age like something valuable, not something forgotten.",
  "I wish you never settle for love that asks you to shrink.",
  "I wish you see snow somewhere you never expected to see it.",
  "I wish your art collection grows too large for any one wall.",
  "I wish you a year where nothing breaks that can't be fixed.",
  "I wish you dance somewhere unexpected, just because the moment called for it.",
  "I wish your name is spoken with respect in rooms you're not even in.",
  "I wish you never doubt that you're allowed to take up space.",
  "I wish you a desert sunset that stops you mid-sentence.",
  "I wish your bank account stops being a source of stress.",
  "I wish you meet an animal in the wild that looks at you like it recognizes you.",
  "I wish your art is protected  from theft, from doubt, from anyone who'd undervalue it.",
  "I wish you a hundred birthdays and not one of them spent feeling unloved.",
  "I wish your favorite hobby never becomes a chore.",
  "I wish you stand somewhere so old  ruins, temples, cities  that time feels different for a moment.",
  "I wish you never have to fight for a love that should come easily.",
  "I wish your health outlasts everyone's expectations of you.",
  "I wish you sail somewhere, even once, just to feel the world move under you.",
  "I wish your art teaches you something about yourself you didn't already know.",
  "I wish you a body of water so clear you can see straight to the bottom.",
  "I wish every year adds to your confidence instead of chipping away at it.",
  "I wish you never carry financial worry into your sleep.",
  "I wish you a friendship that survives a real disagreement and comes out stronger.",
  "I wish you see the northern lights, or something just as impossible-looking.",
  "I wish illness never gets the chance to slow you down.",
  "I wish your art hangs somewhere you'd never have guessed it would end up.",
  "I wish you a hundred years long enough to become someone's favorite memory.",
  "I wish you find a city that feels like it was built just for you to wander in.",
  "I wish love, when it comes, never once makes you feel smaller.",
  "I wish your talent gets discovered by exactly the right person at exactly the right time.",
  "I wish you a mountain range that makes you rethink how big the world actually is.",
  "I wish your body never betrays you when you need it most.",
  "I wish you cross paths with someone whose friendship changes your whole year.",
  "I wish your art is remembered long after you've stopped worrying about being remembered.",
  "I wish you a jungle so loud with life it drowns out every worry in your head.",
  "I wish your success comes without anyone telling you that you don't deserve it.",
  "I wish you visit a place so remote it feels like the edge of the map.",
  "I wish your heart is protected from anyone who'd take it for granted.",
  "I wish you live to see your art outlive every doubt you ever had about it.",
  "I wish a hundred years is only the beginning of how long people remember you.",
  "I wish your body stays strong enough to keep chasing every horizon.",
  "I wish you a coastline that makes you want to stay just one more day, every time.",
  "I wish you never have to prove your talent to someone who refuses to see it.",
  "I wish your wealth is the kind that buys you time, not just things.",
  "I wish you a volcano, a glacier, or something wild enough to remind you the earth is alive.",
  "I wish your friendships never need explaining to anyone outside them.",
  "I wish disease never finds a way past everything protecting you.",
  "I wish you an island so quiet you can hear your own thoughts clearly for once.",
  "I wish your art is loved by someone who needed exactly what you made.",
  "I wish you a love that grows instead of one that just lasts.",
  "I wish you a hundred years with more laughter in them than tears.",
  "I wish you a river you can trace from source to sea, at least once.",
  "I wish your success never costs you the people who mattered before it.",
  "I wish you're tall enough, strong enough, and sure enough to never feel small in a room.",
  "I wish you a temple, shrine, or sacred place that leaves you quietly changed.",
  "I wish your art survives every trend that tries to make it feel outdated.",
  "I wish you never have to guard your heart against someone who claims to love you.",
  "I wish your finances give you options instead of limits.",
  "I wish you a night sky so full of stars it makes you forget to check your phone.",
  "I wish your body carries you through every year without complaint.",
  "I wish you a friendship that starts as strangers and becomes family.",
  "I wish your talent is recognized in your lifetime, not after it.",
  "I wish you a country whose language you don't speak but somehow still understand.",
  "I wish love finds you when you're not even looking for it.",
  "I wish you a hundred years long enough to forgive every mistake you're afraid of making.",
  "I wish your art is the thing people remember about you first.",
  "I wish you a plain, a valley, a horizon so flat and endless it resets your mind.",
  "I wish your health is never something you have to fight for.",
  "I wish you a market, a festival, a celebration in a culture that isn't your own, and love every second of it.",
  "I wish your success is measured by your own definition, not the world's.",
  "I wish a hundred years still isn't enough time for people to stop loving you.",
  "I wish you a waterfall loud enough to drown out every anxious thought.",
  "I wish you never have to settle for a friend group that doesn't actually see you.",
  "I wish your art is the reason someone else finally starts making their own.",
  "I wish you a cave, a cliff, a hidden place that feels like it was waiting just for you.",
  "I wish your finances never dictate the size of your dreams.",
  "I wish you a hundred years of being exactly, unapologetically yourself.",
  "I wish protection surrounds every relationship you choose to enter.",
  "I wish you a life so full  of art, of travel, of love, of health  that a hundred years barely feels like enough."
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