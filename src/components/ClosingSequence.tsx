import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  decay: number;
  color: string;
}

interface GatheringStar {
  x: number;
  y: number;
  tx: number;
  ty: number;
  alpha: number;
  size: number;
  speed: number;
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Premium starlight-gold text styling
const goldGradientStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontStyle: 'italic',
  background: 'linear-gradient(135deg, #FFF5E0 0%, #E9C874 40%, #C49A3C 80%, #8A6421 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  filter: 'drop-shadow(0 0 25px rgba(233, 200, 116, 0.45))',
  padding: '10px 0',
};

const revealGradientStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 'bold',
  background: 'linear-gradient(135deg, #FFFFFF 0%, #F9EAD0 50%, #E9C874 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  filter: 'drop-shadow(0 0 35px rgba(233, 200, 116, 0.35))',
};

// Interactive, smooth Breathing Guide System component (Lovely style, Tap & Hold)
const BreathingSystem: React.FC<{ containerRef: React.RefObject<HTMLDivElement | null> }> = ({ containerRef }) => {
  const [isHolding, setIsHolding] = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);
  const [timerText, setTimerText] = useState('Tap & hold');

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;

    const parent = containerRef.current?.closest<HTMLElement>('.deep-space-container');

    if (isHolding) {
      setTimerText('Breathe in...');

      // Scale up continuously and shift to warm rose shadow
      const tl = gsap.timeline();
      tl.to(el, {
        scale: 2.3,
        duration: 6.0,
        ease: 'power1.out',
        borderColor: 'rgba(212, 117, 107, 0.8)',
        backgroundColor: 'rgba(212, 117, 107, 0.18)',
        boxShadow: '0 0 80px rgba(212, 117, 107, 0.7), 0 0 30px rgba(233, 200, 116, 0.35)',
      });

      // Warm up full viewport background to deep intimate rose
      if (parent) {
        gsap.to(parent, {
          backgroundColor: '#4a1525',
          duration: 4.0,
          ease: 'power1.out',
        });
      }

      const textTimer = setTimeout(() => {
        setTimerText('Holding... ♥');
      }, 1800);

      return () => {
        tl.kill();
        clearTimeout(textTimer);
      };
    } else {
      setTimerText('Tap & hold');

      // Shrink back to normal size
      gsap.to(el, {
        scale: 1.0,
        duration: 0.8,
        ease: 'power3.out',
        borderColor: 'rgba(233, 200, 116, 0.35)',
        backgroundColor: 'rgba(233, 200, 116, 0.05)',
        boxShadow: '0 0 20px rgba(233, 200, 116, 0.15)',
      });

      // Cool background back to resting rose-gold
      if (parent) {
        gsap.to(parent, {
          backgroundColor: '#3d1926',
          duration: 1.2,
          ease: 'power2.out',
        });
      }
    }
  }, [isHolding, containerRef]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        ref={circleRef}
        className="rounded-full flex flex-col items-center justify-center border cursor-pointer select-none active:scale-95 transition-transform duration-200"
        style={{
          width: '180px',
          height: '180px',
          borderColor: 'rgba(233, 200, 116, 0.35)',
          backgroundColor: 'rgba(233, 200, 116, 0.05)',
          backdropFilter: 'blur(8px)',
        }}
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={() => setIsHolding(false)}
        onMouseLeave={() => setIsHolding(false)}
        onTouchStart={(e) => {
          e.preventDefault();
          setIsHolding(true);
        }}
        onTouchEnd={() => setIsHolding(false)}
      >
        <span className="font-sans text-xs sm:text-sm tracking-[0.25em] uppercase text-[#FAF5EE] font-medium transition-all duration-300 select-none">
          {timerText}
        </span>
        <span className="text-xl sm:text-2xl mt-2 select-none text-rose-300 animate-pulse">
          ♥
        </span>
      </div>
      <p className="font-sans text-base sm:text-xl text-[#E9C874] tracking-wider font-light mt-10 animate-pulse select-none">
        Take a deep breath and be happy.
      </p>
    </div>
  );
};

export const ClosingSequence: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for each of the 11 sections
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setSectionRef = (index: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[index] = el;
  };

  const line4NightsRef = useRef<HTMLSpanElement>(null);

  // Track played state for lazy observer triggering


  // Canvas drawing references
  const shootingStar = useRef<{
    x: number;
    y: number;
    tx: number;
    ty: number;
    active: boolean;
    trail: { x: number; y: number }[];
  } | null>(null);

  const particles = useRef<Particle[]>([]);
  const gatheringStars = useRef<GatheringStar[]>([]);
  const risingSun = useRef<{ x: number; y: number; opacity: number; size: number } | null>(null);
  const nightsStarField = useRef<{ x: number; y: number; r: number; alpha: number }[]>([]);

  // ── Scroll-linked Background Color Warm-up ──
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const fraction = Math.min(Math.max(scrollY / maxScroll, 0), 1);

      // Interpolate from deep space indigo/plum (#06050b -> rgb(6,5,11))
      // to intimate warm rose-gold (#3d1926 -> rgb(61,25,38))
      const r = Math.round(6 + (61 - 6) * fraction);
      const g = Math.round(5 + (25 - 5) * fraction);
      const b = Math.round(11 + (38 - 11) * fraction);

      const parent = containerRef.current?.closest<HTMLElement>('.deep-space-container');
      if (parent) {
        parent.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      } else {
        document.documentElement.style.setProperty('--space-bg-color', `rgb(${r}, ${g}, ${b})`);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Fixed Canvas Overlay Rendering Loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let rafId: number;

    const tick = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      // 1. Draw Rising Sun (Section 2 backdrop)
      if (risingSun.current && risingSun.current.opacity > 0) {
        const sun = risingSun.current;
        const grad = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, sun.size);
        grad.addColorStop(0, `rgba(233, 200, 116, ${sun.opacity * 0.3})`);
        grad.addColorStop(0.5, `rgba(212, 117, 107, ${sun.opacity * 0.1})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, sun.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Shooting Star (Section 0)
      if (shootingStar.current && shootingStar.current.active) {
        const star = shootingStar.current;
        star.x += (star.tx - star.x) * 0.15;
        star.y += (star.ty - star.y) * 0.15;

        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 15) star.trail.shift();

        if (star.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(star.trail[0].x, star.trail[0].y);
          for (let i = 1; i < star.trail.length; i++) {
            ctx.lineTo(star.trail[i].x, star.trail[i].y);
          }
          ctx.strokeStyle = 'rgba(233, 200, 116, 0.45)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FAF5EE';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#E9C874';
        ctx.fill();
        ctx.shadowBlur = 0;

        const dist = Math.hypot(star.tx - star.x, star.ty - star.y);
        if (dist < 6) {
          star.active = false;
          // Burst gold spark particles
          for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4.0 + 1.5;
            particles.current.push({
              x: star.tx,
              y: star.ty,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              alpha: 1.0,
              size: Math.random() * 2.2 + 0.8,
              decay: Math.random() * 0.02 + 0.015,
              color: '233, 200, 116',
            });
          }
        }
      }

      // 3. Draw Exploding Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particles.current.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = `rgba(${p.color}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. Draw Gathering Stars (Section 1)
      for (let i = gatheringStars.current.length - 1; i >= 0; i--) {
        const s = gatheringStars.current[i];
        s.x += (s.tx - s.x) * s.speed;
        s.y += (s.ty - s.y) * s.speed;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 200, 116, ${s.alpha})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#E9C874';
        ctx.fill();
        ctx.shadowBlur = 0;

        const dist = Math.hypot(s.tx - s.x, s.ty - s.y);
        if (dist < 3) {
          gatheringStars.current.splice(i, 1);
        }
      }

      // 5. Draw Sleepless Nights Local Star Drift
      if (nightsStarField.current.length > 0) {
        nightsStarField.current.forEach((s) => {
          s.y -= 0.15;
          if (s.y < 0) s.y = H;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 210, 255, ${s.alpha})`;
          ctx.fill();
        });
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ── IntersectionObserver: Trigger animations beat by beat ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setHasPlayed((prev) => {
              if (prev[index]) return prev;
              triggerAnimation(index);
              return { ...prev, [index]: true };
            });
          }
        });
      },
      { threshold: 0.35 },
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [sectionRefs.current.length]);

  // ── Visual Animations per Section ──
  const triggerAnimation = (index: number) => {
    const sec = sectionRefs.current[index];
    if (!sec) return;

    if (prefersReducedMotion()) {
      gsap.to(sec.querySelectorAll('.closing-anim-target'), {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
      });
      return;
    }

    switch (index) {
      case 0: {
        // Section 0: shooting-star reveal
        const target = sec.querySelector('.closing-anim-target');
        const W = window.innerWidth;
        const H = window.innerHeight;
        shootingStar.current = {
          x: W / 2 - 350,
          y: H / 2 - 200,
          tx: W / 2,
          ty: H / 2,
          active: true,
          trail: [],
        };
        gsap.fromTo(target,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out', delay: 0.6 }
        );
        break;
      }
      case 1: {
        // Section 1: gathering starlight
        const target = sec.querySelector('.closing-anim-target');
        const W = window.innerWidth;
        const H = window.innerHeight;

        gatheringStars.current = Array.from({ length: 45 }, () => {
          const angle = Math.random() * Math.PI * 2;
          const dist = 180 + Math.random() * 120;
          return {
            x: W / 2 + Math.cos(angle) * dist,
            y: H / 2 + Math.sin(angle) * dist,
            tx: W / 2 + (Math.random() - 0.5) * 220,
            ty: H / 2 + (Math.random() - 0.5) * 25,
            alpha: Math.random() * 0.7 + 0.3,
            size: Math.random() * 2.0 + 0.5,
            speed: 0.03 + Math.random() * 0.02,
          };
        });

        gsap.fromTo(target,
          { opacity: 0, scale: 0.96 },
          {
            opacity: 1,
            scale: 1,
            textShadow: '0 0 12px rgba(233, 200, 116, 0.45)',
            duration: 1.5,
            ease: 'power2.out',
            delay: 0.3,
          }
        );
        break;
      }
      case 2: {
        // Section 2: Made by Abhi.
        const target = sec.querySelector('.closing-anim-target');
        const W = window.innerWidth;
        const H = window.innerHeight;
        risingSun.current = {
          x: W / 2,
          y: H / 2 + 70,
          opacity: 0,
          size: 260,
        };
        gsap.to(risingSun.current, { y: '-=60', opacity: 1, duration: 1.5, ease: 'power2.out', delay: 0.1 });
        gsap.fromTo(target,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out', delay: 0.2 }
        );
        break;
      }
      case 3: {
        // Section 3: With love, code, sleepless nights
        const phraseLove = sec.querySelector('.phrase-love');
        const phraseCode = sec.querySelector('.phrase-code');
        const phraseNights = sec.querySelector('.phrase-nights');

        const tl = gsap.timeline();
        tl.to(phraseLove, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '+=0.2');
        tl.fromTo(phraseLove, { scale: 1 }, { scale: 1.1, duration: 0.35, yoyo: true, repeat: 1, ease: 'power2.out' }, '-=0.1');
        tl.fromTo(phraseLove,
          { textShadow: '0 0 0px rgba(233,116,107,0)' },
          { textShadow: '0 0 20px rgba(233,116,107,0.7), 0 0 35px rgba(233,116,107,0.3)', duration: 0.5, yoyo: true, repeat: 1 },
          '-=0.7'
        );

        tl.to(phraseCode, { opacity: 1, duration: 0.15 }, '+=0.4');
        tl.to(phraseCode, {
          keyframes: [
            { opacity: 0.2, duration: 0.05 },
            { opacity: 1, duration: 0.05 },
            { opacity: 0.3, duration: 0.05 },
            { opacity: 1, duration: 0.05 },
          ],
        });
        tl.fromTo(phraseCode,
          { textShadow: '0 0 8px rgba(0,220,220,0.7)' },
          { textShadow: '0 0 0px rgba(0,220,220,0)', duration: 0.5 },
          '+=0.1'
        );

        tl.to(phraseNights, { opacity: 0.8, duration: 1.2, ease: 'power2.out' }, '+=0.3');
        tl.add(() => {
          if (line4NightsRef.current) {
            const rect = line4NightsRef.current.getBoundingClientRect();
            const canvasRect = canvasRef.current?.getBoundingClientRect();
            const topOffset = canvasRect ? -canvasRect.top : 0;

            nightsStarField.current = Array.from({ length: 20 }, () => ({
              x: rect.left + Math.random() * rect.width,
              y: rect.top + topOffset + Math.random() * rect.height + 15,
              r: Math.random() * 1.5 + 0.4,
              alpha: Math.random() * 0.6 + 0.2,
            }));
          }
        }, '-=1.0');
        break;
      }
      case 4: {
        // Section 4: Story & Writing
        const target = sec.querySelector('.closing-anim-target');
        const cursor = sec.querySelector('.credit-cursor');
        gsap.fromTo(target,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
        );
        cursor?.classList.add('active');
        setTimeout(() => cursor?.classList.remove('active'), 1800);
        break;
      }
      case 5: {
        // Section 5: Animation
        const target = sec.querySelector('.closing-anim-target');
        const roleWord = sec.querySelector('.credit-role-word');
        gsap.fromTo(target,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
        );
        gsap.fromTo(roleWord,
          { textShadow: '0 0 0px rgba(233,200,116,0)' },
          { textShadow: '0 0 18px rgba(233,200,116,0.85), 0 0 35px rgba(233,200,116,0.45)', duration: 0.5, yoyo: true, repeat: 1, delay: 0.4 }
        );
        break;
      }
      case 6: {
        // Section 6: Sound design
        const target = sec.querySelector('.closing-anim-target');
        const roleWord = sec.querySelector('.credit-role-word');
        gsap.fromTo(target,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
        );
        gsap.to(roleWord, {
          keyframes: [
            { opacity: 0.3, duration: 0.05 },
            { opacity: 1, duration: 0.05 },
            { opacity: 0.5, duration: 0.05 },
            { opacity: 1, duration: 0.05 },
          ],
          delay: 0.3,
        });
        break;
      }
      case 7: {
        // Section 7: Code
        const target = sec.querySelector('.closing-anim-target');
        const cursor = sec.querySelector('.credit-cursor');
        gsap.fromTo(target,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
        );
        cursor?.classList.add('active');
        setTimeout(() => cursor?.classList.remove('active'), 1800);
        break;
      }
      case 8: {
        // Section 8: Reveal Statement
        const target = sec.querySelector('.closing-anim-target');
        gsap.fromTo(target, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out' });
        break;
      }
      case 9: {
        // Section 9: Vulnerable line
        const target = sec.querySelector('.closing-anim-target');
        gsap.fromTo(target, { opacity: 0 }, { opacity: 1, duration: 2.2, ease: 'power2.out' });
        break;
      }
      case 10: {
        // Section 10: Final Breathing System
        const target = sec.querySelector('.breathing-container');
        gsap.fromTo(target, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' });
        break;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative z-10 w-full h-auto flex flex-col items-center select-text"
    >
      {/* Fixed drawing overlay */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 5 }}
      />

      {/* ── SECTION 0: shooting-star reveal ── */}
      <div
        ref={setSectionRef(0)}
        data-index={0}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-6xl mx-auto"
      >
        <h2 className="display-text closing-anim-target text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-tight text-[#FAF5EE]" style={{ opacity: 0 }}>
          You've explored every corner of Twin Zold's World.
        </h2>
      </div>

      {/* ── SECTION 1: gathering starlight ── */}
      <div
        ref={setSectionRef(1)}
        data-index={1}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-6xl mx-auto"
      >
        <h2 className="display-text closing-anim-target text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-tight text-[#FAF5EE]" style={{ opacity: 0 }}>
          Thank you for taking this journey.
        </h2>
      </div>

      {/* ── SECTION 2: Made by Abhi (Italic Serif with Gold Gradient) ── */}
      <div
        ref={setSectionRef(2)}
        data-index={2}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-6xl mx-auto"
      >
        <h2
          className="display-text closing-anim-target text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-wide select-none"
          style={{ ...goldGradientStyle, opacity: 0 }}
        >
          Made by Abhi.
        </h2>
      </div>

      {/* ── SECTION 3: With love, code, sleepless nights ── */}
      <div
        ref={setSectionRef(3)}
        data-index={3}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-6xl mx-auto"
      >
        <h2 className="display-text closing-anim-target text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-normal text-[#FAF5EE]">
          <span className="phrase-love inline-block" style={{ opacity: 0, color: 'var(--room-rose, #D4756B)' }}>
            With love,{' '}
          </span>
          <span className="phrase-code inline-block font-mono text-3xl sm:text-5xl md:text-6xl" style={{ opacity: 0, color: 'cyan' }}>
            code,{' '}
          </span>
          <span ref={line4NightsRef} className="phrase-nights inline-block" style={{ opacity: 0 }}>
            and a whole lot of sleepless nights.
          </span>
        </h2>
      </div>

      {/* ── SECTION 4: Credit 1 - Story & Writing ── */}
      <div
        ref={setSectionRef(4)}
        data-index={4}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-4xl mx-auto"
      >
        <div className="closing-anim-target flex flex-col sm:flex-row items-center gap-3 sm:gap-6" style={{ opacity: 0 }}>
          <span className="credit-role-word font-sans text-xl sm:text-3xl md:text-4xl tracking-[0.3em] uppercase text-[#FAF5EE]/50 font-light">
            Story & writing
          </span>
          <span className="text-[#888888]/40 sm:inline hidden">—</span>
          <span
            className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-wide ml-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #FFF5E0 0%, #E9C874 50%, #C49A3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Abhi
          </span>
          <span
            className="credit-cursor inline-block w-[3px] h-[24px] sm:h-[32px] md:h-[40px] ml-2"
            style={{ background: 'var(--room-gold, #C49A3C)', verticalAlign: 'middle' }}
          />
        </div>
      </div>

      {/* ── SECTION 5: Credit 2 - Animation ── */}
      <div
        ref={setSectionRef(5)}
        data-index={5}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-4xl mx-auto"
      >
        <div className="closing-anim-target flex flex-col sm:flex-row items-center gap-3 sm:gap-6" style={{ opacity: 0 }}>
          <span className="credit-role-word font-sans text-xl sm:text-3xl md:text-4xl tracking-[0.3em] uppercase text-[#FAF5EE]/50 font-light">
            Animation
          </span>
          <span className="text-[#888888]/40 sm:inline hidden">—</span>
          <span
            className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-wide ml-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #FFF5E0 0%, #E9C874 50%, #C49A3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Abhi
          </span>
        </div>
      </div>

      {/* ── SECTION 6: Credit 3 - Sound Design ── */}
      <div
        ref={setSectionRef(6)}
        data-index={6}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-4xl mx-auto"
      >
        <div className="closing-anim-target flex flex-col sm:flex-row items-center gap-3 sm:gap-6" style={{ opacity: 0 }}>
          <span className="credit-role-word font-sans text-xl sm:text-3xl md:text-4xl tracking-[0.3em] uppercase text-[#FAF5EE]/50 font-light">
            Sound design
          </span>
          <span className="text-[#888888]/40 sm:inline hidden">—</span>
          <span
            className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-wide ml-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #FFF5E0 0%, #E9C874 50%, #C49A3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Abhi
          </span>
        </div>
      </div>

      {/* ── SECTION 7: Credit 4 - Code ── */}
      <div
        ref={setSectionRef(7)}
        data-index={7}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-4xl mx-auto"
      >
        <div className="closing-anim-target flex flex-col sm:flex-row items-center gap-3 sm:gap-6" style={{ opacity: 0 }}>
          <span className="credit-role-word font-sans text-xl sm:text-3xl md:text-4xl tracking-[0.3em] uppercase text-[#FAF5EE]/50 font-light">
            Code
          </span>
          <span className="text-[#888888]/40 sm:inline hidden">—</span>
          <span
            className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-wide ml-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #FFF5E0 0%, #E9C874 50%, #C49A3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Abhi
          </span>
          <span
            className="credit-cursor inline-block w-[3px] h-[24px] sm:h-[32px] md:h-[40px] ml-2"
            style={{ background: 'var(--room-gold, #C49A3C)', verticalAlign: 'middle' }}
          />
        </div>
      </div>

      {/* ── SECTION 8: The Reveal Statement ── */}
      <div
        ref={setSectionRef(8)}
        data-index={8}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-6xl mx-auto"
      >
        <h2
          className="display-text closing-anim-target text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-tight select-none text-center"
          style={{ ...revealGradientStyle, opacity: 0 }}
        >
          "This whole gift, every page, every line, every note, is from Abhi."
        </h2>
      </div>

      {/* ── SECTION 9: Vulnerable Line ── */}
      <div
        ref={setSectionRef(9)}
        data-index={9}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-5xl mx-auto"
      >
        <h2 className="display-text closing-anim-target font-sans text-3xl sm:text-5xl md:text-6xl font-light leading-relaxed text-[#B99C9F] max-w-4xl text-center" style={{ opacity: 0 }}>
          I know I can do better. I wanted to add so much more — but life didn't give me the time this round.
        </h2>
      </div>

      {/* ── SECTION 10: Final Breathing System ── */}
      <div
        ref={setSectionRef(10)}
        data-index={10}
        className="min-h-screen relative flex flex-col items-center justify-center text-center p-8 w-full max-w-4xl mx-auto"
      >
        <div className="breathing-container closing-anim-target flex flex-col items-center justify-center" style={{ opacity: 0 }}>
          <p
            className="text-4xl sm:text-6xl font-light tracking-wide mb-3 select-none text-center"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #FFF5E0 0%, #E9C874 50%, #C49A3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 20px rgba(233, 200, 116, 0.35))',
              paddingBottom: '16px',
            }}
          >
            Keep blooming, twin.
          </p>
          <p
            className="text-2xl sm:text-3xl md:text-4xl tracking-wide leading-relaxed mb-14 select-none text-center"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: 'italic',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F5E3C3 50%, #E9C874 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 25px rgba(245, 227, 195, 0.3))',
              paddingBottom: '12px',
            }}
          >
            The world is more beautiful with you in it.
          </p>
          <BreathingSystem containerRef={containerRef} />
        </div>
      </div>
    </div>
  );
};

export default ClosingSequence;
