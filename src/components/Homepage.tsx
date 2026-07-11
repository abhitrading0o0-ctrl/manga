import React, { useEffect, useRef, useState } from 'react';
import { useView } from '../context/ViewContext';
import type { ViewType } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface MenuItem {
  id: string;
  label: string;
  view: ViewType;
  tagline: string;
  accentColor: string;
  sigil: React.ReactNode;
}

// ─── Custom hand-inked manga sigils ───
const MangaSigil = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-12 h-12">
    <path d="M 14 10 L 32 10 L 32 54 L 14 54 Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 32 10 L 50 10 L 50 54 L 32 54 Z" strokeLinecap="round" strokeLinejoin="round" />
    {/* Ink splash dots */}
    <circle cx="20" cy="22" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="24" cy="38" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="44" cy="30" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const PeaceSigil = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-12 h-12">
    {/* Swirling wind lines */}
    <path d="M 8 18 H 40 C 44 18 46 21 44 23 C 42 25 36 24 38 20" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 14 32 H 48 C 52 32 54 35 52 37 C 50 39 44 38 46 34" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 6 46 H 32 C 36 46 38 49 36 51 C 34 53 28 52 30 48" strokeLinecap="round" strokeLinejoin="round" />
    {/* Speed lines */}
    <line x1="44" y1="18" x2="56" y2="18" strokeLinecap="round" opacity="0.6" />
    <line x1="6" y1="32" x2="10" y2="32" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const HeartSigil = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-12 h-12">
    {/* Cracked heart */}
    <path d="M 32 54 C 32 54 8 36 8 20 C 8 11 16 5 24 11 C 28 14 32 19 32 19 C 32 19 36 14 40 11 C 48 5 56 11 56 20 C 56 36 32 54 32 54 Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 32 19 L 29 27 L 35 34 L 28 41 L 33 48" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArcadeSigil = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-12 h-12">
    <rect x="14" y="34" width="36" height="22" rx="4" strokeLinecap="round" />
    <line x1="32" y1="34" x2="32" y2="16" strokeLinecap="round" />
    <circle cx="32" cy="10" r="5" fill="currentColor" stroke="none" />
    <circle cx="22" cy="45" r="2" fill="currentColor" />
    <circle cx="42" cy="45" r="2" fill="currentColor" />
  </svg>
);

const CreditsSigil = () => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-12 h-12">
    <circle cx="32" cy="22" r="12" strokeLinecap="round" />
    <path d="M 24 32 L 16 54 L 32 46 L 48 54 L 40 32" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="32" cy="22" r="5" fill="currentColor" stroke="none" />
  </svg>
);



export const Homepage: React.FC = () => {
  const { setView, previousView, visitedRooms, allRoomsVisited, requestRestart, confirmRestart, cancelRestart, confirmingRestart } = useView();
  const { playSound } = useAudio();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredDoor, setHoveredDoor] = useState<number | null>(null);
  const [transitioningDoor, setTransitioningDoor] = useState<number | null>(null);
  const [doorsOpen, setDoorsOpen] = useState<boolean[]>(Array(5).fill(false));
  const [showPortalOverlay, setShowPortalOverlay] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; left: number; top: number; size: number }[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visitedCount = Object.values(visitedRooms).filter(v => v).length;

  const handleUnlockSurprise = () => {
    playSound('reveal');
    setView('SURPRISE');
  };

  const menuItems: MenuItem[] = [
    {
      id: "games",
      label: "Retro Arcade",
      view: "GAMES",
      tagline: "Retro Games",
      accentColor: "#E88FA6",
      sigil: <ArcadeSigil />
    },
    {
      id: "heart",
      label: "Heart Letters",
      view: "HEART",
      tagline: "The Message",
      accentColor: "#D4756B",
    },
    {
      id: "manga",
      label: "Manga",
      view: "MANGA",
      tagline: "The Story",
      accentColor: "#E9C874",
      sigil: <MangaSigil />
    },
    {
      id: "peace",
      label: "Peace Room",
      view: "PEACE",
      tagline: "Anxiety Killer",
      accentColor: "#8B7BC7",
      sigil: <PeaceSigil />
    },
    {
      id: "credits",
      label: "Credits",
      view: "CREDITS",
      tagline: "The Collection",
      accentColor: "#C49A3C",
      sigil: <CreditsSigil />
    }
  ];

  // Helper mapping room keys to door indices
  const roomIndexMap: Record<string, number> = {
    GAMES: 0,
    HEART: 1,
    MANGA: 2,
    PEACE: 3,
    CREDITS: 4
  };

  // 1. Handle reverse transition when returning from a room
  useEffect(() => {
    if (previousView && previousView in roomIndexMap) {
      const returnIndex = roomIndexMap[previousView];

      // Setup initial return state: door open, transition overlay active
      setTransitioningDoor(returnIndex);
      setShowPortalOverlay(true);

      const newDoorsOpen = [...doorsOpen];
      newDoorsOpen[returnIndex] = true;
      setDoorsOpen(newDoorsOpen);

      // Animate closing sequence
      const tl = gsap.timeline();
      tl.to('.portal-burst-overlay', {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => setShowPortalOverlay(false)
      });

      tl.add(() => {
        // Swing doors shut
        const updatedDoors = [...newDoorsOpen];
        updatedDoors[returnIndex] = false;
        setDoorsOpen(updatedDoors);
      }, 0.2);

      tl.add(() => {
        setTransitioningDoor(null);
      }, 0.8);
    }
  }, [previousView]);

  // 2. Drifting gold and rose embers canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: { x: number; y: number; vx: number; vy: number; radius: number; color: string; alpha: number; speed: number }[] = [];
    const colors = ['#E9C874', '#D4756B', '#F2B8C6'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.5,
        radius: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.2 + Math.random() * 0.5,
        speed: 0.5 + Math.random() * 0.5
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y += p.vy * p.speed;
        p.x += p.vx * p.speed;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10 || p.x > width + 10) {
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 3. Dynamic sparks shooting from the seam on hover
  useEffect(() => {
    if (hoveredDoor === null) {
      setSparks([]);
      return;
    }

    const interval = setInterval(() => {
      setSparks(prev => {
        const id = Date.now() + Math.random();
        const newSpark = {
          id,
          left: 45 + Math.random() * 10, // near center seam
          top: 15 + Math.random() * 70,  // spread vertically
          size: 2 + Math.random() * 4
        };
        // Keep last 15 sparks
        return [...prev.slice(-14), newSpark];
      });
    }, 150);

    return () => clearInterval(interval);
  }, [hoveredDoor]);

  const handleDoorClick = (index: number, view: ViewType) => {
    if (transitioningDoor !== null) return;

    // Play custom sound effect
    playSound('doorOpen');
    setTransitioningDoor(index);

    // Open panels immediately
    const updatedDoors = [...doorsOpen];
    updatedDoors[index] = true;
    setDoorsOpen(updatedDoors);

    // Set transition overlay state
    setShowPortalOverlay(true);

    // Timeline for portal explosion zoom
    const tl = gsap.timeline();
    tl.to(`.door-wrapper-${index}`, {
      scale: 3.2,
      z: 400,
      duration: 0.8,
      ease: 'power2.in'
    });

    tl.fromTo('.portal-burst-overlay',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.in' },
      0.3
    );

    tl.add(() => {
      // Trigger navigation view state switch
      setView(view);
    }, 0.85);
  };

  const getDoorTransform = (index: number) => {
    if (transitioningDoor === index) return ''; // Let GSAP timeline control it

    const isHovered = hoveredDoor === index;

    // Base 3D corridor positions (horizontal position is managed by the physical left layout style)
    const angles = [35, 18, 0, -18, -35];
    const translateZs = [-120, -50, 0, -50, -120];

    let angle = angles[index];
    let translateZ = translateZs[index];
    let translateY = 0;
    let scale = 1;

    if (isHovered) {
      angle = 0; // face viewer directly
      translateZ = 65; // move forward
      translateY = -12; // lift slightly
      scale = 1.05;
    }

    return `translateY(${translateY}px) rotateY(${angle}deg) translateZ(${translateZ}px) scale(${scale})`;
  };

  const isFinalSurpriseUnlocked = allRoomsVisited;

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative flex flex-col justify-between items-center py-10 px-6 overflow-hidden select-none"
      style={{ backgroundColor: 'var(--room-bg, #0f0507)', color: 'var(--room-text, #F7F7F7)' }}
    >
      {/* ─── Background Infrastructure ─── */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      <div className="fixed inset-0 blueprint-grid-overlay pointer-events-none z-0" />
      <div className="fixed inset-0 manga-halftone-overlay manga-halftone-animated pointer-events-none z-0" />
      <div className="fixed inset-0 manga-speed-lines pointer-events-none z-0" />

      {/* ─── Header ─── */}
      <div className="relative z-10 text-center flex flex-col items-center select-none">
        <h2 className="text-4xl sm:text-5xl font-bold tracking-wide mb-3 flex items-center gap-1.5 drop-shadow-[0_0_15px_rgba(212,117,107,0.45)]">
          <span className="manga-title-script text-[#D4756B]">twin</span>
          <span className="manga-title-bold text-white tracking-tighter">ZOLD'S WORLD</span>
        </h2>
        {/* Handwritten underline element */}
        <div className="w-48 h-2 bg-gradient-to-r from-transparent via-[#D4756B]/60 to-transparent rounded-full mb-2" />
      </div>

      {/* ─── Futuristic 3D Corridor Layout ─── */}
      <div className="relative z-10 w-full max-w-5xl h-[420px] flex justify-center items-center door-3d-wrapper my-4">
        {menuItems.map((item, idx) => {
          const isVisited = visitedRooms[item.id];
          const isHovered = hoveredDoor === idx;
          const isCurrentTransition = transitioningDoor === idx;
          const panelStyle = {
            borderColor: isVisited ? 'var(--room-accent, #D4756B)' : 'rgba(212, 117, 107, 0.15)',
            backgroundColor: 'var(--room-card-bg, rgba(26, 12, 15, 0.75))'
          };
          const spacing = windowWidth < 640 ? 64 : windowWidth < 1024 ? 130 : 190;
          const translateXs = [-2 * spacing, -1 * spacing, 0, 1 * spacing, 2 * spacing];
          const translateX = translateXs[idx];
          const halfWidth = windowWidth < 640 ? 56 : 80;
          const leftPos = `calc(50% + ${translateX}px - ${halfWidth}px)`;

          return (
            <div
              key={item.id}
              className={`door-wrapper-${idx} absolute w-28 h-56 sm:w-40 sm:h-80 flex flex-col items-center cursor-pointer`}
              style={{
                left: leftPos,
                perspective: '1000px',
                zIndex: isHovered || isCurrentTransition ? 50 : 20 - Math.abs(idx - 2),
                opacity: hoveredDoor !== null && hoveredDoor !== idx && !isCurrentTransition ? 0.35 : 1,
                transition: 'opacity 0.5s ease',
              }}
              onMouseEnter={() => transitioningDoor === null && setHoveredDoor(idx)}
              onMouseLeave={() => setHoveredDoor(null)}
              onClick={() => handleDoorClick(idx, item.view)}
            >
              {/* Inner 3D visual wrapper — pointer-events:none so clicks pass through to parent */}
              <div
                className="w-full h-full relative"
                style={{
                  transform: getDoorTransform(idx),
                  transformStyle: 'preserve-3d',
                  pointerEvents: 'none',
                }}
              >
              {/* Ground highlights under hovered door */}
              {isHovered && (
                <>
                  <div className="absolute top-[90%] w-32 h-6 sm:w-48 sm:h-10 manga-impact-pool pointer-events-none z-0" />
                  <div className="absolute top-[85%] w-32 h-10 sm:w-48 sm:h-16 manga-ground-impact-lines pointer-events-none z-0" />
                </>
              )}

              {/* Door Container split panels */}
              <div
                className="w-full h-full relative rounded-xl border border-transparent overflow-hidden"
                style={{
                  boxShadow: isVisited
                    ? '0 0 25px rgba(212, 117, 107, 0.25), inset 0 0 15px rgba(212, 117, 107, 0.15)'
                    : 'none'
                }}
              >
                {/* 1. Left Hinge Panel */}
                <div
                  className={`absolute left-0 top-0 w-1/2 h-full door-panel-left`}
                  style={{
                    ...panelStyle,
                    backgroundImage:
                      item.id === 'games' ? "url('/assets/arcade-bg.png')" :
                      item.id === 'heart' ? "url('/assets/heart-bg.jpg')" :
                      item.id === 'manga' ? "url('/assets/manga-bg.jpg')" :
                      item.id === 'peace' ? "url('/assets/peace-bg.jpg')" :
                      item.id === 'credits' ? "url('/assets/credits-bg.png')" : undefined,
                    backgroundSize: (item.id === 'games' || item.id === 'heart' || item.id === 'manga' || item.id === 'peace' || item.id === 'credits') ? '200% 100%' : undefined,
                    backgroundPosition: (item.id === 'games' || item.id === 'heart' || item.id === 'manga' || item.id === 'peace' || item.id === 'credits') ? 'left center' : undefined,
                    backgroundRepeat: (item.id === 'games' || item.id === 'heart' || item.id === 'manga' || item.id === 'peace' || item.id === 'credits') ? 'no-repeat' : undefined,
                    transform: doorsOpen[idx] ? 'rotateY(-110deg)' : 'rotateY(0deg)',
                    borderRight: '1px solid rgba(212, 117, 107, 0.3)'
                  }}
                >
                  {/* Irregular hand-inked border outline */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 200" preserveAspectRatio="none">
                    <path
                      d="M 0 0 L 95 0 L 92 30 L 97 60 L 93 90 L 96 120 L 91 150 L 97 180 L 95 200 L 0 200 Z"
                      fill="none"
                      stroke={isVisited ? 'var(--room-accent)' : 'rgba(212, 117, 107, 0.25)'}
                      strokeWidth="2"
                    />
                  </svg>
                  {/* Screentone pattern gradient */}
                  <div className="absolute inset-0 manga-halftone-overlay opacity-20 pointer-events-none" />
                </div>

                {/* 2. Right Hinge Panel */}
                <div
                  className={`absolute right-0 top-0 w-1/2 h-full door-panel-right`}
                  style={{
                    ...panelStyle,
                    backgroundImage:
                      item.id === 'games' ? "url('/assets/arcade-bg.png')" :
                      item.id === 'heart' ? "url('/assets/heart-bg.jpg')" :
                      item.id === 'manga' ? "url('/assets/manga-bg.jpg')" :
                      item.id === 'peace' ? "url('/assets/peace-bg.jpg')" :
                      item.id === 'credits' ? "url('/assets/credits-bg.png')" : undefined,
                    backgroundSize: (item.id === 'games' || item.id === 'heart' || item.id === 'manga' || item.id === 'peace' || item.id === 'credits') ? '200% 100%' : undefined,
                    backgroundPosition: (item.id === 'games' || item.id === 'heart' || item.id === 'manga' || item.id === 'peace' || item.id === 'credits') ? 'right center' : undefined,
                    backgroundRepeat: (item.id === 'games' || item.id === 'heart' || item.id === 'manga' || item.id === 'peace' || item.id === 'credits') ? 'no-repeat' : undefined,
                    transform: doorsOpen[idx] ? 'rotateY(110deg)' : 'rotateY(0deg)',
                    borderLeft: '1px solid rgba(212, 117, 107, 0.3)'
                  }}
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 200" preserveAspectRatio="none">
                    <path
                      d="M 100 0 L 5 0 L 8 30 L 3 60 L 7 90 L 4 120 L 9 150 L 3 180 L 5 200 L 100 200 Z"
                      fill="none"
                      stroke={isVisited ? 'var(--room-accent)' : 'rgba(212, 117, 107, 0.25)'}
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute inset-0 manga-halftone-overlay opacity-20 pointer-events-none" />
                </div>

                {/* 3. Seam crack glow fault-line */}
                <div
                  className={`absolute left-1/2 top-0 -translate-x-1/2 w-[3px] h-full bg-[#D4756B] blur-[2px] transition-opacity duration-300 z-10
                    ${isHovered ? 'opacity-100 shadow-[0_0_12px_rgba(212,117,107,0.85)]' : 'opacity-40'}`}
                />

                {/* Seam crack particle sparks (relative HTML dots) */}
                {isHovered && sparks.map(spark => (
                  <div
                    key={spark.id}
                    className="absolute bg-[#E9C874] rounded-full blur-[1px] pointer-events-none z-20 animate-ping"
                    style={{
                      left: `${spark.left}%`,
                      top: `${spark.top}%`,
                      width: `${spark.size}px`,
                      height: `${spark.size}px`,
                    }}
                  />
                ))}

                {/* 4. Sigil / Icon */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 transition-opacity duration-500
                    ${doorsOpen[idx] ? 'opacity-0' : 'opacity-100'}`}
                >
                  {/* Visited Stamp Seal */}
                  {isVisited && (
                    <div className="absolute top-4 right-4 px-2 py-0.5 rounded text-[8px] tracking-wider uppercase font-bold visited-manga-stamp z-20">
                      ✓ CLEARED
                    </div>
                  )}

                  <div
                    className={`sigil-pulsing flex items-center justify-center p-3 rounded-full mb-3
                      ${isVisited ? 'text-white' : 'text-[#B99C9F] opacity-40'}`}
                    style={{
                      backgroundColor: 'rgba(15, 5, 7, 0.8)',
                      borderColor: isVisited ? item.accentColor : 'rgba(212, 117, 107, 0.15)',
                      borderWidth: '1.5px',
                    }}
                  >
                    {item.sigil}
                  </div>

                  <h3
                    className="font-mono text-sm tracking-widest uppercase text-white drop-shadow-md"
                  >
                    {item.label}
                  </h3>
                  <span className="font-serif text-[10px] text-[#B99C9F] italic mt-1 drop-shadow-sm">
                    {item.tagline}
                  </span>
                </div>
              </div>
              </div>{/* end inner 3D visual wrapper */}
            </div>
          );
        })}
      </div>

      {/* ─── Status power-tracker readout & surprises ─── */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6 select-none mt-2">
        {/* Status Line */}
        <div className="flex items-center gap-2">
          {menuItems.map((item, i) => (
            <React.Fragment key={item.id}>
              <div
                className={`w-6 h-6 border rounded-full flex items-center justify-center text-[10px] transition-all duration-300
                  ${visitedRooms[item.id]
                    ? 'border-[#E9C874] text-[#E9C874] shadow-[0_0_8px_rgba(233,200,116,0.5)] bg-[#E9C874]/10'
                    : 'border-[#B99C9F]/30 text-[#B99C9F]/30 bg-transparent'}`}
                title={item.label}
              >
                {item.label[0]}
              </div>
              {i < menuItems.length - 1 && (
                <div
                  className={`w-8 h-[2px] transition-all duration-300
                    ${visitedRooms[item.id] && visitedRooms[menuItems[i + 1].id]
                      ? 'bg-[#E9C874] shadow-[0_0_4px_rgba(233,200,116,0.5)]'
                      : 'bg-[#B99C9F]/20'}`}
                />
              )}
            </React.Fragment>
          ))}
          {/* 6th Sigil loop for final surprise */}
          <div className="w-8 h-[2px] bg-[#B99C9F]/20" />
          <div
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500
              ${isFinalSurpriseUnlocked
                ? 'border-[#E9C874] text-[#E9C874] bg-[#E9C874]/15 shadow-[0_0_15px_rgba(233,200,116,0.6)] cursor-pointer hover:scale-105'
                : 'border-[#B99C9F]/20 text-[#B99C9F]/20 cursor-not-allowed opacity-40'}`}
            onClick={isFinalSurpriseUnlocked ? handleUnlockSurprise : undefined}
          >
            🎁
          </div>
        </div>

        <p className="font-sans text-[10px] tracking-widest uppercase text-[#B99C9F] text-center">
          {isFinalSurpriseUnlocked
            ? '✦ STATUS: constellations aligned. final portal unlocked.'
            : `STATUS: ${visitedCount}/5 cores active. align all systems.`
          }
        </p>

        {/* Restart triggers */}
        {!confirmingRestart ? (
          <button
            onClick={requestRestart}
            className="clickable font-sans text-[9px] tracking-[0.2em] uppercase px-4 py-1.5 rounded-full transition-all duration-300 cursor-pointer mt-1 border border-[#B99C9F]/20 text-[#B99C9F] hover:text-white hover:border-[#D4756B]/40 hover:bg-[#D4756B]/5"
          >
            ↺ reset corridor
          </button>
        ) : (
          <div className="flex items-center gap-3 mt-1">
            <span className="font-sans text-[9px] tracking-wider uppercase text-[#B99C9F]">
              Confirm reset?
            </span>
            <button
              onClick={confirmRestart}
              className="clickable font-sans text-[9px] tracking-wider uppercase px-3 py-1 rounded-full cursor-pointer transition-all border border-[#D4756B] text-[#D4756B] bg-[#D4756B]/15"
            >
              Reset
            </button>
            <button
              onClick={cancelRestart}
              className="clickable font-sans text-[9px] tracking-wider uppercase px-3 py-1 rounded-full cursor-pointer transition-all border border-[#B99C9F]/20 text-[#B99C9F]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ─── Portal explosion speedlines transition overlay ─── */}
      {showPortalOverlay && (
        <div className="portal-burst-overlay fixed inset-0 pointer-events-none" />
      )}
    </div>
  );
};