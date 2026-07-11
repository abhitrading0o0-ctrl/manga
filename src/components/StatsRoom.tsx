import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';
import { SpaceBackground } from './SpaceBackground';

interface RoomCard {
  id: string;
  label: string;
  icon: string;
  desc: string;
  color: string;
}

// ── Interactive counting score helper ──────────────────────
const GlowingScoreCounter: React.FC<{ target: number }> = ({ target }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: target,
            duration: 1.5,
            ease: 'power3.out',
            onUpdate: () => {
              setCount(Math.floor(obj.val));
            },
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    return () => observer.disconnect();
  }, [target]);

  return (
    <h4
      ref={elementRef}
      className="font-mono text-xl sm:text-2xl font-bold glowing-score-digit tracking-widest text-[#E9C874] mt-2 mb-1"
    >
      {count}
    </h4>
  );
};

export const StatsRoom: React.FC = () => {
  const { setView, visitedRooms, highScores } = useView();
  const { playSound } = useAudio();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [constellationPoints, setConstellationPoints] = useState<{ x: number; y: number }[]>([]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [activeTwinkles, setActiveTwinkles] = useState<Record<string, boolean>>({});

  const rooms: RoomCard[] = [
    { id: 'manga', label: 'Manga', icon: '📖', desc: 'The Story', color: '#5C4833' },
    { id: 'peace', label: 'Peace Room', icon: '🌿', desc: 'Anxiety Killer', color: '#8B7BC7' },
    { id: 'heart', label: 'Heart Letters', icon: '♡', desc: 'The Message', color: '#D4756B' },
    { id: 'games', label: 'Retro Arcade', icon: '🕹', desc: 'Arcade Games', color: '#E88FA6' },
    { id: 'credits', label: 'Credits', icon: '✦', desc: 'The Collection', color: '#C49A3C' },
  ];

  const setCardRef = useCallback(
    (idx: number) => (el: HTMLDivElement | null) => {
      cardRefs.current[idx] = el;
    },
    [],
  );

  const updateConstellationPoints = useCallback(() => {
    const parent = containerRef.current;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();

    const points = cardRefs.current
      .map((card) => {
        if (!card) return null;
        const rect = card.getBoundingClientRect();
        return {
          x: rect.right - 14 - parentRect.left,
          y: rect.top + 14 - parentRect.top,
        };
      })
      .filter(Boolean) as { x: number; y: number }[];

    setConstellationPoints(points);
  }, []);

  useEffect(() => {
    setTimeout(updateConstellationPoints, 300);
    window.addEventListener('resize', updateConstellationPoints);
    return () => window.removeEventListener('resize', updateConstellationPoints);
  }, [updateConstellationPoints]);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline({ delay: 0.1 });
    tl.fromTo(
      '.space-title-text',
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' },
    );

    if (pathRef.current) {
      const path = pathRef.current;
      const totalLen = path.getTotalLength?.() || 1000;
      gsap.set(path, { strokeDasharray: totalLen, strokeDashoffset: totalLen });

      tl.fromTo(
        '.space-card',
        { opacity: 0, y: 25, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: {
            amount: 0.6,
            onStart: function (this: gsap.core.Tween) {
              const target = this.targets()[0] as HTMLElement;
              const idx = target?.getAttribute('data-idx');
              if (idx) {
                setActiveTwinkles((prev) => ({ ...prev, [idx]: true }));
                playSound('click');
                setTimeout(() => {
                  setActiveTwinkles((prev) => ({ ...prev, [idx]: false }));
                }, 800);
              }
            },
          },
          ease: 'power3.out',
        },
      );

      tl.to(
        path,
        {
          strokeDashoffset: 0,
          duration: 1.0,
          ease: 'power2.inOut',
        },
        '-=0.8',
      );
    }

    gsap.fromTo(
      '.space-section-log',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 1.0 },
    );
  }, [constellationPoints.length, playSound]);

  const handleBackToHome = () => {
    playSound('click');
    setView('HOME');
  };

  const handleGoToCredits = () => {
    playSound('click');
    setView('CREDITS');
  };

  const visitedCount = Object.values(visitedRooms).filter((v) => v).length;
  const dPath = constellationPoints
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex flex-col items-center py-10 px-6 overflow-hidden deep-space-container custom-scrollbar"
    >
      <SpaceBackground />

      {/* Header */}
      <div className="relative z-10 w-full max-w-3xl flex items-center justify-between select-none mb-10">
        <button
          onClick={handleBackToHome}
          className="space-back-btn flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
        >
          ← Home
        </button>

        <h2 className="space-title-text font-serif text-xl sm:text-2xl font-bold tracking-widest text-[#FAF5EE] select-none opacity-0">
          ✦ Journey Stats
        </h2>

        <button
          onClick={handleGoToCredits}
          className="space-back-btn flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
        >
          Closing →
        </button>
      </div>

      {/* Room progress grid */}
      <div className="relative z-10 w-full max-w-3xl mb-12">
        <h3 className="space-section-log font-sans text-xs font-bold tracking-[0.2em] uppercase mb-5 text-[#B9B9B9] flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E9C874] halo-glow-icon" />
          Room Progress — {visitedCount}/5 Explored
        </h3>

        {constellationPoints.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <path ref={pathRef} d={dPath} className="constellation-path active" />
          </svg>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 relative z-10">
          {rooms.map((room, idx) => {
            const isVisited = visitedRooms[room.id];
            const isTwinkling = activeTwinkles[idx];
            return (
              <div
                key={room.id}
                data-idx={idx}
                ref={setCardRef(idx)}
                className={`space-card rounded-xl p-5 flex flex-col items-center text-center transition-all duration-300 ${
                  isVisited ? 'visited' : ''
                }`}
                style={{ opacity: 0 }}
              >
                <span className="constellation-dot" />
                {isTwinkling && (
                  <span
                    className="absolute inset-0 rounded-xl bg-white/10 pointer-events-none animate-ping"
                    style={{ boxShadow: '0 0 20px 5px rgba(233,200,116,0.3)' }}
                  />
                )}
                <span className="text-3xl mb-3 halo-glow-icon block">{room.icon}</span>
                <h4
                  className="font-sans text-xs font-bold tracking-wider mb-1"
                  style={{ color: isVisited ? '#E9C874' : '#888888' }}
                >
                  {room.label}
                </h4>
                <span className="text-[9px] tracking-widest uppercase font-light text-[#888888]">
                  {isVisited ? '✓ Complete' : 'Not visited'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arcade high scores */}
      <div className="space-section-log credit-section relative z-10 w-full max-w-3xl mb-12 opacity-0">
        <h3 className="font-sans text-xs font-bold tracking-[0.2em] uppercase mb-5 text-[#B9B9B9] flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E9C874] halo-glow-icon" />
          Arcade High Scores
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '🐍 Snake', score: highScores.snake },
            { label: '🐦 Flappy', score: highScores.flappy },
            { label: '🎨 Tracer', score: highScores.artist },
          ].map((g) => (
            <div key={g.label} className="space-card rounded-xl p-5 text-center border">
              <span className="text-xl block mb-1 halo-glow-icon">{g.label.split(' ')[0]}</span>
              <GlowingScoreCounter target={g.score} />
              <span className="font-sans text-[9px] tracking-[0.15em] uppercase text-[#888888]">
                {g.label.split(' ')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Built WithHUD Section */}
      <div className="space-section-log credit-section relative z-10 w-full max-w-3xl mb-12 opacity-0">
        <h3 className="font-sans text-xs font-bold tracking-[0.2em] uppercase mb-5 text-[#B9B9B9] flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E9C874] halo-glow-icon" />
          Built With (System Manifest)
        </h3>
        <div className="mission-log-panel rounded-xl p-6 border relative">
          <div className="mission-log-scanlines" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
            {[
              { title: '🎨 Design', desc: 'Manga-ink aesthetic, paper textures, organic SVG borders' },
              { title: '⚛️ Framework', desc: 'React 19 + TypeScript + Vite' },
              { title: '✨ Animation', desc: 'GSAP 3 for transitions and interactions' },
              { title: '🔊 Audio', desc: 'Howler.js for music & Web Audio API synth fallback' },
              { title: '🎮 Games', desc: 'HTML5 Canvas with requestAnimationFrame' },
              { title: '💅 Styling', desc: 'Tailwind CSS 4 with CSS variable theming' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col gap-1">
                <h4 className="font-sans text-xs font-bold tracking-wider text-[#E9C874] flex items-center gap-1.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-cyan-400 cyan-hud-glow" />
                  {item.title}
                </h4>
                <p className="font-sans text-xs font-light leading-relaxed text-[#B9B9B9]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default StatsRoom;
