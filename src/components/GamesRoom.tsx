import React, { useEffect, useState, useRef } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';

type GameType = 'SNAKE' | 'FLAPPY' | 'ARTIST' | null;

export const GamesRoom: React.FC = () => {
  const { setView, markRoomVisited, highScores, saveHighScore } = useView();
  const { playSound } = useAudio();

  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'OVER'>('IDLE');
  const [score, setScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<number | null>(null);

  useEffect(() => {
    markRoomVisited('games');
    return () => stopGameLoop();
  }, [activeGame]);

  const stopGameLoop = () => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  };

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const startNewGame = () => {
    playSound('click');
    setGameState('PLAYING');
    setScore(0);
    if (activeGame === 'SNAKE') initSnakeGame();
    if (activeGame === 'FLAPPY') initFlappyGame();
    if (activeGame === 'ARTIST') initArtistGame();
  };

  // ==========================================
  // 1. SNAKE GAME LOGIC
  // ==========================================
  const snakeDirRef = useRef({ x: 0, y: -1 });
  const snakeGridSize = 20;

  const initSnakeGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    snakeDirRef.current = { x: 0, y: -1 };
    let snake = [
      { x: 10, y: 12 },
      { x: 10, y: 13 },
      { x: 10, y: 14 }
    ];
    let food = { x: 5, y: 5 };
    let gridCountX = Math.floor(canvas.width / snakeGridSize);
    let gridCountY = Math.floor(canvas.height / snakeGridSize);

    const spawnFood = () => {
      food = {
        x: Math.floor(Math.random() * gridCountX),
        y: Math.floor(Math.random() * gridCountY)
      };
      if (snake.some(s => s.x === food.x && s.y === food.y)) spawnFood();
    };
    spawnFood();

    const handleDirKeys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && snakeDirRef.current.y === 0) snakeDirRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && snakeDirRef.current.y === 0) snakeDirRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && snakeDirRef.current.x === 0) snakeDirRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && snakeDirRef.current.x === 0) snakeDirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleDirKeys);

    // Touch/swipe support
    let touchStartX = 0, touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30 && snakeDirRef.current.x === 0) snakeDirRef.current = { x: 1, y: 0 };
        if (dx < -30 && snakeDirRef.current.x === 0) snakeDirRef.current = { x: -1, y: 0 };
      } else {
        if (dy > 30 && snakeDirRef.current.y === 0) snakeDirRef.current = { x: 0, y: 1 };
        if (dy < -30 && snakeDirRef.current.y === 0) snakeDirRef.current = { x: 0, y: -1 };
      }
    };
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);

    let lastTick = 0;
    const speed = 100;

    const runSnake = (timestamp: number) => {
      if (gameState !== 'PLAYING') return;
      loopRef.current = requestAnimationFrame(runSnake);
      if (timestamp - lastTick < speed) return;
      lastTick = timestamp;

      const head = { 
        x: snake[0].x + snakeDirRef.current.x, 
        y: snake[0].y + snakeDirRef.current.y 
      };

      if (head.x < 0 || head.x >= gridCountX || head.y < 0 || head.y >= gridCountY) {
        handleGameOver('snake');
        window.removeEventListener('keydown', handleDirKeys);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
        return;
      }

      if (snake.some(s => s.x === head.x && s.y === head.y)) {
        handleGameOver('snake');
        window.removeEventListener('keydown', handleDirKeys);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchend', handleTouchEnd);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        playSound('hover');
        setScore(prev => prev + 10);
        spawnFood();
      } else {
        snake.pop();
      }

      // Draw with pastel pink theme
      ctx.fillStyle = '#FFF0F3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines (subtle)
      ctx.strokeStyle = 'rgba(232, 143, 166, 0.08)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += snakeGridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += snakeGridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Draw food
      ctx.fillStyle = '#E88FA6';
      ctx.beginPath();
      ctx.arc(food.x * snakeGridSize + snakeGridSize/2, food.y * snakeGridSize + snakeGridSize/2, snakeGridSize/2 - 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw snake
      snake.forEach((s, idx) => {
        ctx.fillStyle = idx === 0 ? '#D4756B' : '#E88FA6';
        const r = 3;
        const x = s.x * snakeGridSize + 1;
        const y = s.y * snakeGridSize + 1;
        const w = snakeGridSize - 2;
        const h = snakeGridSize - 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
      });
    };

    loopRef.current = requestAnimationFrame(runSnake);
  };

  // ==========================================
  // 2. FLAPPY BIRD GAME LOGIC
  // ==========================================
  const initFlappyGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let birdY = canvas.height / 2;
    let velocity = 0;
    const gravity = 0.28;
    const lift = -6.0;

    let pipes: { x: number; top: number; bottom: number; passed?: boolean }[] = [];
    const pipeWidth = 50;
    const gap = 120;
    let frameCount = 0;

    const onFlap = (e: KeyboardEvent | MouseEvent | TouchEvent) => {
      if (e instanceof KeyboardEvent && e.key !== ' ') return;
      playSound('hover');
      velocity = lift;
    };

    window.addEventListener('keydown', onFlap);
    canvas.addEventListener('click', onFlap);
    canvas.addEventListener('touchstart', onFlap);

    const runFlappy = () => {
      if (gameState !== 'PLAYING') return;
      loopRef.current = requestAnimationFrame(runFlappy);
      frameCount++;

      velocity += gravity;
      birdY += velocity;

      if (birdY > canvas.height - 15 || birdY < 0) {
        handleGameOver('flappy');
        window.removeEventListener('keydown', onFlap);
        canvas.removeEventListener('click', onFlap);
        canvas.removeEventListener('touchstart', onFlap);
        return;
      }

      if (frameCount % 100 === 0) {
        const topHeight = Math.random() * (canvas.height - gap - 60) + 30;
        pipes.push({ x: canvas.width, top: topHeight, bottom: canvas.height - topHeight - gap });
      }

      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= 2.5;

        if (p.x < 110 && p.x + pipeWidth > 80 && (birdY - 12 < p.top || birdY + 12 > canvas.height - p.bottom)) {
          handleGameOver('flappy');
          window.removeEventListener('keydown', onFlap);
          canvas.removeEventListener('click', onFlap);
          canvas.removeEventListener('touchstart', onFlap);
          return;
        }

        if (!p.passed && p.x + pipeWidth < 85) {
          p.passed = true;
          playSound('hover');
          setScore(prev => prev + 1);
        }

        if (p.x < -pipeWidth) pipes.splice(i, 1);
      }

      // Draw with pastel theme
      ctx.fillStyle = '#FFF0F3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw pipes
      ctx.fillStyle = '#E88FA6';
      pipes.forEach(p => {
        // Top pipe with rounded bottom
        ctx.beginPath();
        ctx.roundRect(p.x, 0, pipeWidth, p.top, [0, 0, 8, 8]);
        ctx.fill();
        // Bottom pipe with rounded top
        ctx.beginPath();
        ctx.roundRect(p.x, canvas.height - p.bottom, pipeWidth, p.bottom, [8, 8, 0, 0]);
        ctx.fill();
      });

      // Draw bird
      ctx.beginPath();
      ctx.fillStyle = '#D4756B';
      ctx.arc(90, birdY, 12, 0, Math.PI * 2);
      ctx.fill();
      // Bird eye
      ctx.beginPath();
      ctx.fillStyle = '#FFF0F3';
      ctx.arc(96, birdY - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = '#3D2030';
      ctx.arc(97, birdY - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    };

    loopRef.current = requestAnimationFrame(runFlappy);
  };

  // ==========================================
  // 3. ARTIST CHALLENGE (Line Tracing)
  // ==========================================
  const robotPosRef = useRef({ x: 100, y: 150 });
  const playerTrailRef = useRef<{ x: number; y: number }[]>([]);
  const isTracingRef = useRef(false);

  const [brushStyle, setBrushStyle] = useState<'rainbow' | 'gold' | 'neon'>('rainbow');
  const [difficulty, setDifficulty] = useState<'normal' | 'hard'>('normal');

  const initArtistGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pathPoints: { x: number; y: number }[] = [];
    let activePointIdx = 0;
    
    const generatePath = () => {
      pathPoints = [];
      let x = 40;
      let y = canvas.height / 2;
      pathPoints.push({ x, y });
      
      const segmentCount = 6;
      for (let i = 0; i < segmentCount; i++) {
        x += (canvas.width - 80) / segmentCount;
        y = Math.sin(i * 1.5) * 80 + canvas.height / 2 + (Math.random() - 0.5) * 50;
        pathPoints.push({ x, y });
      }
    };
    generatePath();

    robotPosRef.current = { ...pathPoints[0] };
    playerTrailRef.current = [];
    isTracingRef.current = false;

    let totalPointsTraced = 0;
    let deviationSum = 0;

    const handleTraceMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (!isTracingRef.current) return;

      playerTrailRef.current.push({ x: px, y: py });
      if (playerTrailRef.current.length > 50) playerTrailRef.current.shift();

      const dx = px - robotPosRef.current.x;
      const dy = py - robotPosRef.current.y;
      deviationSum += Math.sqrt(dx * dx + dy * dy);
      totalPointsTraced++;
    };

    const handleTraceStart = () => { isTracingRef.current = true; playerTrailRef.current = []; };
    const handleTraceEnd = () => { isTracingRef.current = false; };

    canvas.addEventListener('mousemove', handleTraceMove);
    canvas.addEventListener('mousedown', handleTraceStart);
    canvas.addEventListener('mouseup', handleTraceEnd);

    const robotSpeed = difficulty === 'normal' ? 1.8 : 3.0;

    const runArtist = () => {
      if (gameState !== 'PLAYING') return;
      loopRef.current = requestAnimationFrame(runArtist);

      const target = pathPoints[activePointIdx];
      const dx = target.x - robotPosRef.current.x;
      const dy = target.y - robotPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        activePointIdx++;
        if (activePointIdx >= pathPoints.length) {
          const averageDeviation = totalPointsTraced > 0 ? deviationSum / totalPointsTraced : 100;
          const accuracy = Math.max(0, Math.min(100, Math.round(100 - averageDeviation)));
          setScore(accuracy);
          handleGameOver('artist', accuracy);
          canvas.removeEventListener('mousemove', handleTraceMove);
          canvas.removeEventListener('mousedown', handleTraceStart);
          canvas.removeEventListener('mouseup', handleTraceEnd);
          return;
        }
      } else {
        robotPosRef.current.x += (dx / dist) * robotSpeed;
        robotPosRef.current.y += (dy / dist) * robotSpeed;
      }

      // Draw with pastel theme
      ctx.fillStyle = '#FFF0F3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw target curve
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(232, 143, 166, 0.15)';
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
      ctx.stroke();

      // Draw player trail
      if (playerTrailRef.current.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = brushStyle === 'rainbow' ? '#D4756B' : brushStyle === 'gold' ? '#C49A3C' : '#8B7BC7';
        ctx.lineWidth = 4;
        ctx.moveTo(playerTrailRef.current[0].x, playerTrailRef.current[0].y);
        for (let i = 1; i < playerTrailRef.current.length; i++) ctx.lineTo(playerTrailRef.current[i].x, playerTrailRef.current[i].y);
        ctx.stroke();
      }

      // Draw robot node
      ctx.beginPath();
      ctx.fillStyle = '#E88FA6';
      ctx.arc(robotPosRef.current.x, robotPosRef.current.y, 8, 0, Math.PI * 2);
      ctx.fill();
    };

    loopRef.current = requestAnimationFrame(runArtist);
  };

  const handleGameOver = (gameKey: 'snake' | 'flappy' | 'artist', finalScoreVal?: number) => {
    playSound('reveal');
    setGameState('OVER');
    stopGameLoop();
    const checkScore = finalScoreVal ?? score;
    saveHighScore(gameKey, checkScore);
  };

  const selectGame = (type: GameType) => {
    playSound('click');
    setActiveGame(type);
    setGameState('IDLE');
    setScore(0);
    stopGameLoop();
  };

  const gameOptions: { type: GameType; icon: string; label: string }[] = [
    { type: 'SNAKE', icon: '🐍', label: 'Snake' },
    { type: 'FLAPPY', icon: '🐦', label: 'Flappy' },
    { type: 'ARTIST', icon: '🎨', label: 'Tracer' },
  ];

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center py-8 px-4 overflow-hidden crt-scanlines"
      style={{ backgroundColor: 'var(--room-bg, #FFF0F3)', color: 'var(--room-text, #3D2030)' }}
    >
      {/* Header */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between select-none mb-6">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'var(--room-text-muted, #9B7080)',
            borderColor: 'var(--room-card-border, rgba(232, 143, 166, 0.2))',
          }}
        >
          ← Home
        </button>

        <h2 
          className="font-mono text-sm font-bold tracking-wider uppercase"
          style={{ color: 'var(--room-accent, #E88FA6)' }}
        >
          🕹 Retro Arcade
        </h2>

        <div className="w-[80px]" />
      </div>

      {/* Arcade Cabinet Game Selector */}
      <div className="relative z-10 flex gap-3 mb-6">
        {gameOptions.map(opt => (
          <button
            key={opt.type}
            onClick={() => selectGame(opt.type)}
            className={`arcade-btn ${activeGame === opt.type ? 'selected' : ''}`}
          >
            <span className="text-lg block mb-1">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Game Screen */}
      <div className="relative z-10 w-full max-w-[560px]">
        <div 
          className="relative w-full h-[340px] rounded-2xl overflow-hidden"
          style={{
            border: '8px solid var(--room-card-border, rgba(232, 143, 166, 0.3))',
            backgroundColor: '#FFF0F3',
            boxShadow: '0 15px 40px rgba(0,0,0,0.08), inset 0 0 30px rgba(232, 143, 166, 0.05)'
          }}
        >
          {activeGame ? (
            <>
              <canvas 
                ref={canvasRef} 
                width={520} 
                height={320} 
                className="w-full h-full block"
                style={{ backgroundColor: '#FFF0F3' }}
              />

              {gameState === 'IDLE' && (
                <div 
                  className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none"
                  style={{ backgroundColor: 'rgba(255, 240, 243, 0.95)' }}
                >
                  <h3 className="font-mono text-sm tracking-wider mb-2 uppercase" style={{ color: 'var(--room-text)' }}>
                    Ready Player One
                  </h3>
                  <p className="font-mono text-[9px] mb-6 tracking-widest uppercase" style={{ color: 'var(--room-accent)' }}>
                    High Score: {activeGame === 'SNAKE' ? highScores.snake : activeGame === 'FLAPPY' ? highScores.flappy : highScores.artist}
                  </p>
                  <button
                    onClick={startNewGame}
                    className="clickable px-6 py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:scale-105"
                    style={{
                      backgroundColor: 'var(--room-accent)',
                      color: 'white',
                      boxShadow: '0 4px 15px var(--room-accent-glow)'
                    }}
                  >
                    ▶ Insert Coin
                  </button>
                </div>
              )}

              {gameState === 'OVER' && (
                <div 
                  className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none"
                  style={{ backgroundColor: 'rgba(255, 240, 243, 0.95)' }}
                >
                  <h3 className="font-mono text-lg tracking-wider mb-2 uppercase" style={{ color: '#D4756B' }}>
                    Game Over
                  </h3>
                  <p className="font-mono text-xs tracking-wider mb-6 uppercase" style={{ color: 'var(--room-text)' }}>
                    Score: {score}
                  </p>
                  <button
                    onClick={startNewGame}
                    className="clickable px-6 py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:scale-105"
                    style={{
                      backgroundColor: 'var(--room-accent)',
                      color: 'white',
                      boxShadow: '0 4px 15px var(--room-accent-glow)'
                    }}
                  >
                    ↺ Retry
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center select-none">
              <span className="text-4xl block mb-4 animate-bounce">🕹</span>
              <h4 className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--room-text-muted)' }}>
                Choose a game above
              </h4>
            </div>
          )}
        </div>

        {/* Live score */}
        {activeGame && gameState === 'PLAYING' && (
          <div 
            className="flex justify-between items-center mt-3 px-2 font-mono text-[10px] tracking-widest uppercase select-none"
            style={{ color: 'var(--room-accent)' }}
          >
            <span>Playing: {activeGame}</span>
            <span>Score: {score}</span>
          </div>
        )}

        {/* Artist options */}
        {activeGame === 'ARTIST' && (
          <div 
            className="mt-4 p-4 rounded-xl border grid grid-cols-2 gap-4 text-left font-sans text-xs tracking-wider select-none"
            style={{
              backgroundColor: 'var(--room-card-bg)',
              borderColor: 'var(--room-card-border)',
            }}
          >
            <div>
              <label className="font-semibold uppercase block mb-2 text-[10px]" style={{ color: 'var(--room-accent)' }}>Difficulty</label>
              <div className="flex gap-2">
                {(['normal', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => { playSound('click'); setDifficulty(d); }}
                    className={`clickable px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase cursor-pointer transition-all`}
                    style={{
                      borderColor: difficulty === d ? 'var(--room-accent)' : 'var(--room-card-border)',
                      backgroundColor: difficulty === d ? 'var(--room-accent)' : 'transparent',
                      color: difficulty === d ? 'white' : 'var(--room-text-muted)',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-semibold uppercase block mb-2 text-[10px]" style={{ color: 'var(--room-accent)' }}>Pen Brush</label>
              <div className="flex gap-2">
                {(['rainbow', 'gold', 'neon'] as const).map(b => (
                  <button
                    key={b}
                    onClick={() => { playSound('click'); setBrushStyle(b); }}
                    className={`clickable px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase cursor-pointer transition-all`}
                    style={{
                      borderColor: brushStyle === b ? 'var(--room-accent)' : 'var(--room-card-border)',
                      backgroundColor: brushStyle === b ? 'var(--room-accent)' : 'transparent',
                      color: brushStyle === b ? 'white' : 'var(--room-text-muted)',
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};