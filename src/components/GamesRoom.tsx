import React, { useEffect, useState, useRef } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import { SnakeGame } from './games/SnakeGame';
import { FlappyGame } from './games/FlappyGame';
import { TracerGame } from './games/TracerGame';
import gsap from 'gsap';

type GameType = 'SNAKE' | 'FLAPPY' | 'TRACER' | null;

// Floating ambient particles
const ArcadeParticles: React.FC = () => {
  const particles = [
    { size: 2.5, left: '6%', top: '20%', delay: '0s', dur: '18s', color: '#F472B6' },
    { size: 3, left: '80%', top: '12%', delay: '2s', dur: '25s', color: '#FBBF24' },
    { size: 2, left: '90%', top: '55%', delay: '4s', dur: '20s', color: '#F472B6' },
    { size: 3.5, left: '15%', top: '75%', delay: '1s', dur: '22s', color: '#4ADE80' },
    { size: 2, left: '50%', top: '88%', delay: '3s', dur: '28s', color: '#FBBF24' },
    { size: 2.5, left: '28%', top: '35%', delay: '5s', dur: '24s', color: '#F472B6' },
    { size: 2, left: '65%', top: '42%', delay: '1.5s', dur: '19s', color: '#4ADE80' },
    { size: 3, left: '42%', top: '10%', delay: '6s', dur: '26s', color: '#FBBF24' },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {particles.map((p, idx) => (
        <div
          key={idx}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            top: p.top,
            backgroundColor: p.color,
            boxShadow: `0 0 6px ${p.color}, 0 0 12px ${p.color}`,
            animation: `slow-drift ${p.dur} ease-in-out infinite`,
            animationDelay: p.delay,
            opacity: 0.5,
          }}
        />
      ))}
    </div>
  );
};

export const GamesRoom: React.FC = () => {
  const { setView, markRoomVisited, highScores, saveHighScore } = useView();
  const { playSound, setMusicPlaying, isMusicPlaying } = useAudio();

  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const wasMusicPlayingRef = useRef(false);

  useEffect(() => {
    markRoomVisited('games');

    // Flicker-in title animation
    if (titleRef.current) {
      const tl = gsap.timeline();
      tl.fromTo(titleRef.current, 
        { opacity: 0, filter: 'blur(8px)' },
        { opacity: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' }
      )
      .to(titleRef.current, { opacity: 0.3, duration: 0.08 })
      .to(titleRef.current, { opacity: 1, duration: 0.08 })
      .to(titleRef.current, { opacity: 0.6, duration: 0.05 })
      .to(titleRef.current, { opacity: 1, duration: 0.15 });
    }

    return () => {
      // Restore music if unmounting/leaving room
      if (wasMusicPlayingRef.current) {
        setMusicPlaying(true);
      }
    };
  }, []);

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const toggleFullscreen = () => {
    playSound('click');
    const elem = screenRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        console.warn(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const selectGame = (type: GameType) => {
    playSound('click');

    if (activeGame === type) return;

    // If changing game or returning to select, restore background music if we had paused it
    if (wasMusicPlayingRef.current) {
      setMusicPlaying(true);
      wasMusicPlayingRef.current = false;
    }

    // CRT power-off effect on current screen
    if (screenRef.current && isPoweredOn) {
      const tl = gsap.timeline();
      tl.to(screenRef.current, {
        scaleY: 0.01,
        scaleX: 1.1,
        opacity: 0.8,
        duration: 0.15,
        ease: 'power4.in',
      })
      .to(screenRef.current, {
        scaleX: 0,
        opacity: 0,
        duration: 0.1,
        ease: 'power4.in',
        onComplete: () => {
          setActiveGame(type);
          setGameState('IDLE');
          setScore(0);
          setLevel(1);

          // CRT power-on effect
          gsap.timeline()
            .set(screenRef.current!, { scaleX: 0, scaleY: 0.01, opacity: 0 })
            .to(screenRef.current!, { scaleX: 1.05, opacity: 0.6, duration: 0.08 })
            .to(screenRef.current!, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.2, ease: 'power2.out' });
        }
      });
    } else {
      setActiveGame(type);
      setGameState('IDLE');
      setScore(0);
      setLevel(1);
      setIsPoweredOn(true);

      // Initial power-on
      if (screenRef.current) {
        gsap.timeline()
          .set(screenRef.current, { scaleX: 0, scaleY: 0.01, opacity: 0 })
          .to(screenRef.current, { scaleX: 1.05, opacity: 0.6, duration: 0.08 })
          .to(screenRef.current, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.2, ease: 'power2.out' });
      }
    }
  };

  const startNewGame = () => {
    playSound('click');
    
    // Pause background classical music so we can play the game's energy chiptunes
    if (isMusicPlaying) {
      wasMusicPlayingRef.current = true;
      setMusicPlaying(false);
    } else {
      wasMusicPlayingRef.current = false;
    }

    setGameState('PLAYING');
    setScore(0);
    setLevel(1);
  };

  const handleGameOver = (finalScore: number) => {
    playSound('reveal');
    setGameState('OVER');
    setScore(finalScore);
    if (activeGame === 'SNAKE') saveHighScore('snake', finalScore);
    if (activeGame === 'FLAPPY') saveHighScore('flappy', finalScore);
    if (activeGame === 'TRACER') saveHighScore('artist', finalScore);

    // Resume classical music if we paused it
    if (wasMusicPlayingRef.current) {
      setMusicPlaying(true);
      wasMusicPlayingRef.current = false;
    }
  };

  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const GAME_CONFIGS: { type: GameType; label: string; glowColor: string; icon: React.ReactNode }[] = [
    {
      type: 'SNAKE',
      label: 'Snake',
      glowColor: '#4ADE80',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6">
          <path d="M4 20C4 20 4 14 8 14C12 14 12 8 16 8C20 8 20 4 20 4" />
          <circle cx="20" cy="4" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      type: 'FLAPPY',
      label: 'Flappy',
      glowColor: '#F472B6',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6">
          <circle cx="12" cy="12" r="6" />
          <path d="M6 12C4 10 4 8 6 7" />
          <circle cx="14" cy="10" r="1" fill="currentColor" />
          <path d="M18 12L21 13L18 14" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      type: 'TRACER',
      label: 'Tracer',
      glowColor: '#FBBF24',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-6 h-6">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
  ];

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center py-8 px-4 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1A1020 0%, #0D0810 50%, #060408 100%)',
        color: '#FCE4E6',
      }}
    >
      {/* Floating ambient particles */}
      <ArcadeParticles />

      {/* CRT Scanline overlay (very subtle) */}
      <div
        className="fixed inset-0 pointer-events-none z-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Vignette darkening at edges */}
      <div
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.7)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full max-w-[80vw] flex items-center justify-between select-none mb-6">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'rgba(252, 228, 230, 0.6)',
            borderColor: 'rgba(244, 114, 182, 0.15)',
            backgroundColor: 'rgba(18, 12, 20, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          ← Home
        </button>

        <h2 
          ref={titleRef}
          className="font-mono text-base tracking-[0.3em] uppercase font-bold"
          style={{ 
            color: '#F472B6',
            textShadow: '0 0 12px rgba(244, 114, 182, 0.5), 0 0 30px rgba(244, 114, 182, 0.2)',
          }}
        >
          Retro Arcade
        </h2>

        <button
          onClick={toggleFullscreen}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'rgba(252, 228, 230, 0.6)',
            borderColor: 'rgba(244, 114, 182, 0.15)',
            backgroundColor: 'rgba(18, 12, 20, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          📺 Fullscreen
        </button>
      </div>

      {/* ─── Game Select Buttons ─── */}
      <div className="relative z-10 flex gap-4 mb-6">
        {GAME_CONFIGS.map(cfg => {
          const isSelected = activeGame === cfg.type;
          return (
            <button
              key={cfg.type}
              onClick={() => selectGame(cfg.type)}
              className="clickable group relative flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none overflow-hidden"
              style={{
                backgroundColor: isSelected ? `${cfg.glowColor}11` : 'rgba(18, 12, 20, 0.7)',
                borderColor: isSelected ? cfg.glowColor : 'rgba(255,255,255,0.06)',
                boxShadow: isSelected
                  ? `0 0 20px ${cfg.glowColor}33, inset 0 0 15px ${cfg.glowColor}11`
                  : '0 4px 15px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = `${cfg.glowColor}66`;
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 0 12px ${cfg.glowColor}22, 0 8px 20px rgba(0,0,0,0.4)`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                }
              }}
            >
              {/* Scan sweep on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${cfg.glowColor}15 50%, transparent 100%)`,
                  animation: 'none',
                }}
              />
              <div style={{ color: isSelected ? cfg.glowColor : 'rgba(255,255,255,0.4)', filter: isSelected ? `drop-shadow(0 0 6px ${cfg.glowColor})` : 'none', transition: 'all 0.3s' }}>
                {cfg.icon}
              </div>
              <span 
                className="font-mono text-[10px] tracking-widest uppercase font-bold relative z-10"
                style={{ 
                  color: isSelected ? cfg.glowColor : 'rgba(255,255,255,0.5)',
                  textShadow: isSelected ? `0 0 6px ${cfg.glowColor}` : 'none',
                }}
              >
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Play Area Screen ─── */}
      <div className="relative z-10 w-full flex justify-center">
        <div
          ref={screenRef}
          className="arcade-screen"
          style={{
            border: '2px solid rgba(244, 114, 182, 0.15)',
            backgroundColor: '#0D0B0F',
            boxShadow: `0 0 30px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3)${activeGame ? `, 0 0 15px ${GAME_CONFIGS.find(g => g.type === activeGame)?.glowColor}15` : ''}`,
          }}
        >
          {/* Inner Aspect Container */}
          <div className="relative w-full h-full aspect-[8/5] max-w-full max-h-full overflow-hidden flex flex-col justify-between">
            {/* Inner screen glow gradient */}
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(244, 114, 182, 0.03) 0%, transparent 70%)',
              }}
            />

          {activeGame === 'SNAKE' && (
            <SnakeGame
              gameState={gameState}
              onStart={startNewGame}
              onGameOver={handleGameOver}
              onScoreChange={handleScoreChange}
              highScore={highScores.snake}
              onLevelChange={setLevel}
            />
          )}

          {activeGame === 'FLAPPY' && (
            <FlappyGame
              gameState={gameState}
              onStart={startNewGame}
              onGameOver={handleGameOver}
              onScoreChange={handleScoreChange}
              highScore={highScores.flappy}
            />
          )}

          {activeGame === 'TRACER' && (
            <TracerGame
              gameState={gameState}
              onStart={startNewGame}
              onGameOver={handleGameOver}
              onScoreChange={handleScoreChange}
              highScore={highScores.artist}
            />
          )}

          {/* Empty state — no game selected */}
          {!activeGame && (
            <div className="w-full h-full flex flex-col items-center justify-center select-none">
              {/* Pulsing joystick icon */}
              <div className="mb-4" style={{ animation: 'pulse 2.5s ease-in-out infinite' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-10 h-10" style={{ color: 'rgba(244, 114, 182, 0.35)' }}>
                  <rect x="6" y="14" width="12" height="6" rx="2" />
                  <path d="M12 14V8" />
                  <circle cx="12" cy="6" r="2" />
                </svg>
              </div>
              {/* Blinking cursor prompt */}
              <h4
                className="font-mono text-[10px] tracking-widest uppercase"
                style={{
                  color: 'rgba(244, 114, 182, 0.4)',
                  animation: 'blink-sakura-cursor 1.2s step-end infinite',
                  borderRight: '2px solid rgba(244, 114, 182, 0.4)',
                  paddingRight: '4px',
                }}
              >
                Select a game above
              </h4>
            </div>
          )}
          </div>
        </div>

        {/* Live score bar */}
        {activeGame && gameState === 'PLAYING' && (
          <div 
            className="flex justify-between items-center mt-3 px-3 font-mono text-[10px] tracking-widest uppercase select-none"
            style={{ color: GAME_CONFIGS.find(g => g.type === activeGame)?.glowColor || '#F472B6' }}
          >
            <span style={{ textShadow: `0 0 4px ${GAME_CONFIGS.find(g => g.type === activeGame)?.glowColor}` }}>
              Playing: {activeGame}
            </span>
            {activeGame === 'SNAKE' && (
              <span style={{ textShadow: `0 0 4px ${GAME_CONFIGS.find(g => g.type === activeGame)?.glowColor}` }}>
                Level: {level}
              </span>
            )}
            <span style={{ textShadow: `0 0 4px ${GAME_CONFIGS.find(g => g.type === activeGame)?.glowColor}` }}>
              Score: {score}{activeGame === 'TRACER' ? '%' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};