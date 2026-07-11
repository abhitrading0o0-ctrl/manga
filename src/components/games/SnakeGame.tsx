import React, { useEffect, useRef, useState, useCallback } from 'react';

interface SnakeGameProps {
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
  gameState: 'IDLE' | 'PLAYING' | 'OVER';
  onStart: () => void;
  highScore: number;
  onLevelChange?: (level: number) => void;
}

const GRID = 20;

// Simple chiptune synth helper class (Web Audio API)
class RetroSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCollect() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two quick notes: E5 then B5 (satisfying collect/coin sound)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(987.77, now + 0.08); // B5

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {
      console.warn('Audio Context failed to play collect chime:', e);
    }
  }

  playGameOver() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Descending warning slide chiptune
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(55, now + 0.45);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {
      console.warn('Audio Context failed to play game over chime:', e);
    }
  }
}

const synth = new RetroSynth();

class ChiptuneBGM {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      let step = 0;
      const tempo = 125; // BPM
      const stepDuration = 60 / tempo / 2; // 8th note duration

      // Energetic gaming chiptune loops
      const bassline = [110.00, 110.00, 130.81, 130.81, 146.83, 146.83, 164.81, 196.00];
      const melody = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99];

      const nextNote = () => {
        if (!this.isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;

        // Triangle bass channel
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        const bassFreq = bassline[step % bassline.length];
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.04, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration - 0.02);

        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration);

        // Square melody channel
        if (step % 2 === 0 || step % 3 === 0) {
          const melOsc = this.ctx.createOscillator();
          const melGain = this.ctx.createGain();
          melOsc.type = 'square';

          const melNoteIdx = (step * 3) % melody.length;
          const melFreq = melody[melNoteIdx];
          melOsc.frequency.setValueAtTime(melFreq, now);

          melGain.gain.setValueAtTime(0.01, now);
          melGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.75);

          melOsc.connect(melGain);
          melGain.connect(this.ctx.destination);
          melOsc.start(now);
          melOsc.stop(now + stepDuration * 0.85);
        }

        // Noise beat snare channel
        if (step % 4 === 2) {
          const snareOsc = this.ctx.createOscillator();
          const snareGain = this.ctx.createGain();
          snareOsc.type = 'sawtooth';
          snareOsc.frequency.setValueAtTime(120, now);
          snareOsc.frequency.exponentialRampToValueAtTime(10, now + 0.06);

          snareGain.gain.setValueAtTime(0.02, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          snareOsc.connect(snareGain);
          snareGain.connect(this.ctx.destination);
          snareOsc.start(now);
          snareOsc.stop(now + 0.07);
        }

        step++;
        this.intervalId = setTimeout(nextNote, stepDuration * 1000);
      };

      nextNote();
    } catch (e) {
      console.warn("Snake game chiptune BGM initialization failed:", e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }
}

interface LevelConfig {
  name: string;
  snakeColorHead: string;
  snakeColorBody: string;
  foodColor: string;
  gridColor: string;
  bgColor: string;
  speed: number;
  denserGrid: boolean;
  obstaclesCount: number;
  obstacleColor: string;
  obstacleGlow: string;
}

const LEVELS: LevelConfig[] = [
  {
    name: "Grid Runner",
    snakeColorHead: "#4ADE80", // neon green
    snakeColorBody: "#15803D",
    foodColor: "#FBBF24", // gold
    gridColor: "rgba(74, 222, 128, 0.025)",
    bgColor: "#0D0B0F",
    speed: 120,
    denserGrid: false,
    obstaclesCount: 0,
    obstacleColor: "#EF4444",
    obstacleGlow: "rgba(239, 68, 68, 0.4)",
  },
  {
    name: "Deep Signal",
    snakeColorHead: "#22D3EE", // neon cyan
    snakeColorBody: "#0369A1",
    foodColor: "#FBBF24",
    gridColor: "rgba(34, 211, 238, 0.035)",
    bgColor: "#090D16",
    speed: 114,
    denserGrid: true,
    obstaclesCount: 0,
    obstacleColor: "#EF4444",
    obstacleGlow: "rgba(239, 68, 68, 0.4)",
  },
  {
    name: "Cyber Wave",
    snakeColorHead: "#A855F7", // purple
    snakeColorBody: "#6B21A8",
    foodColor: "#FBBF24",
    gridColor: "rgba(168, 85, 247, 0.035)",
    bgColor: "#0F0914",
    speed: 108,
    denserGrid: false,
    obstaclesCount: 1,
    obstacleColor: "#F43F5E",
    obstacleGlow: "rgba(244, 63, 94, 0.4)",
  },
  {
    name: "Overdrive",
    snakeColorHead: "#F472B6", // hot pink
    snakeColorBody: "#9D174D",
    foodColor: "#FBBF24",
    gridColor: "rgba(244, 114, 182, 0.035)",
    bgColor: "#120914",
    speed: 102,
    denserGrid: true,
    obstaclesCount: 2,
    obstacleColor: "#F43F5E",
    obstacleGlow: "rgba(244, 63, 94, 0.5)",
  },
  {
    name: "Hyperspace",
    snakeColorHead: "#3B82F6", // neon blue
    snakeColorBody: "#1D4ED8",
    foodColor: "#FBBF24",
    gridColor: "rgba(59, 130, 246, 0.035)",
    bgColor: "#090E16",
    speed: 96,
    denserGrid: false,
    obstaclesCount: 3,
    obstacleColor: "#EF4444",
    obstacleGlow: "rgba(239, 68, 68, 0.5)",
  },
  {
    name: "Glitch Zone",
    snakeColorHead: "#FFFFFF", // white/gold contrast
    snakeColorBody: "#D97706",
    foodColor: "#FFFFFF",
    gridColor: "rgba(245, 158, 11, 0.045)",
    bgColor: "#161109",
    speed: 90, // maximum increase speed capped under 30% (90ms vs 120ms is a 25% tick reduction)
    denserGrid: true,
    obstaclesCount: 4,
    obstacleColor: "#EF4444",
    obstacleGlow: "rgba(239, 68, 68, 0.6)",
  }
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const SnakeGame: React.FC<SnakeGameProps> = ({
  onGameOver,
  onScoreChange,
  gameState,
  onStart,
  highScore,
  onLevelChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const loopRef = useRef<number | null>(null);
  const gameRunningRef = useRef(false);

  // Level state
  const [level, setLevel] = useState(1);
  const [highestLevel, setHighestLevel] = useState(() => {
    return Number(localStorage.getItem('birthday_snake_highest_level') || 1);
  });

  // Track values in refs to avoid React state lag in fast loop
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const obstaclesRef = useRef<{ x: number; y: number }[]>([]);

  // Feedback animations
  const edgeGlowPulseRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const levelUpAnimRef = useRef<{ active: boolean; startTime: number; level: number; name: string } | null>(null);

  // Crash visual sequence
  const isCrashingRef = useRef(false);
  const crashStartTimeRef = useRef(0);

  const bgmRef = useRef(new ChiptuneBGM());

  // Helpers for linear color interpolation
  const lerpColor = (color1: string, color2: string, factor: number) => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  };

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    gameRunningRef.current = false;
    bgmRef.current.stop();
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      initGame();
    } else {
      stopLoop();
    }
    return () => {
      stopLoop();
      bgmRef.current.stop();
    };
  }, [gameState]);

  // Global key listener for spacebar/enter to start/retry game when in IDLE/OVER state
  useEffect(() => {
    const handleGlobalSpace = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'IDLE' || gameState === 'OVER') {
          e.preventDefault();
          onStart();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalSpace);
    return () => window.removeEventListener('keydown', handleGlobalSpace);
  }, [gameState, onStart]);

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopLoop();
    bgmRef.current.start();
    scoreRef.current = 0;
    levelRef.current = 1;
    setLevel(1);
    onScoreChange(0);
    onLevelChange?.(1);

    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    gameRunningRef.current = true;
    isCrashingRef.current = false;
    crashStartTimeRef.current = 0;
    edgeGlowPulseRef.current = 0;
    particlesRef.current = [];
    levelUpAnimRef.current = null;

    const gridCountX = Math.floor(canvas.width / GRID);
    const gridCountY = Math.floor(canvas.height / GRID);

    let snake = [
      { x: Math.floor(gridCountX / 2), y: Math.floor(gridCountY / 2) },
      { x: Math.floor(gridCountX / 2), y: Math.floor(gridCountY / 2) + 1 },
      { x: Math.floor(gridCountX / 2), y: Math.floor(gridCountY / 2) + 2 },
    ];

    let prevSnake = snake.map(s => ({ ...s }));

    // Generate safe static obstacles
    const generateObstaclesList = (count: number, currentSnake: { x: number; y: number }[], currentFood: { x: number; y: number }) => {
      const list: { x: number; y: number }[] = [];
      let attempts = 0;
      while (list.length < count && attempts < 100) {
        attempts++;
        const ox = Math.floor(Math.random() * (gridCountX - 2)) + 1;
        const oy = Math.floor(Math.random() * (gridCountY - 2)) + 1;
        const onSnake = currentSnake.some(s => s.x === ox && s.y === oy);
        const nearStart = Math.abs(ox - Math.floor(gridCountX / 2)) < 5 && Math.abs(oy - Math.floor(gridCountY / 2)) < 5;
        const onFood = currentFood.x === ox && currentFood.y === oy;
        const duplicate = list.some(o => o.x === ox && o.y === oy);

        if (!onSnake && !nearStart && !onFood && !duplicate) {
          list.push({ x: ox, y: oy });
        }
      }
      return list;
    };

    let food = { x: 0, y: 0 };
    const spawnFood = () => {
      food = {
        x: Math.floor(Math.random() * gridCountX),
        y: Math.floor(Math.random() * gridCountY),
      };
      // Make sure food doesn't land on snake body or obstacles
      const onSnake = snake.some(s => s.x === food.x && s.y === food.y);
      const onObstacle = obstaclesRef.current.some(o => o.x === food.x && o.y === food.y);
      if (onSnake || onObstacle) {
        spawnFood();
      }
    };

    // Obstacles start empty for level 1
    obstaclesRef.current = [];
    spawnFood();

    // Keyboard controls
    const handleKey = (e: KeyboardEvent) => {
      const cur = dirRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && cur.y === 0)
        nextDirRef.current = { x: 0, y: -1 };
      if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && cur.y === 0)
        nextDirRef.current = { x: 0, y: 1 };
      if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && cur.x === 0)
        nextDirRef.current = { x: -1, y: 0 };
      if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && cur.x === 0)
        nextDirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKey);

    // Touch/swipe controls
    let touchStartX = 0, touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const cur = dirRef.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30 && cur.x === 0) nextDirRef.current = { x: 1, y: 0 };
        if (dx < -30 && cur.x === 0) nextDirRef.current = { x: -1, y: 0 };
      } else {
        if (dy > 30 && cur.y === 0) nextDirRef.current = { x: 0, y: 1 };
        if (dy < -30 && cur.y === 0) nextDirRef.current = { x: 0, y: -1 };
      }
    };
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    const cleanupListeners = () => {
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };

    let lastTick = performance.now();
    let sweepY = 0;

    const loop = (timestamp: number) => {
      if (!gameRunningRef.current) {
        cleanupListeners();
        return;
      }
      loopRef.current = requestAnimationFrame(loop);

      const levelIndex = Math.min(levelRef.current - 1, LEVELS.length - 1);
      const theme = LEVELS[levelIndex];

      // ── Handle Crash Sequence ──
      if (isCrashingRef.current) {
        if (crashStartTimeRef.current === 0) {
          crashStartTimeRef.current = timestamp;
          synth.playGameOver();
          bgmRef.current.stop();
        }

        const elapsed = timestamp - crashStartTimeRef.current;
        if (elapsed > 700) {
          gameRunningRef.current = false;
          cleanupListeners();
          onGameOver(scoreRef.current);
          return;
        }

        // Draw crash flash render
        ctx.fillStyle = theme.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = theme.gridColor;
        ctx.lineWidth = 0.5;
        const gridStep = theme.denserGrid ? GRID / 2 : GRID;
        for (let x = 0; x < canvas.width; x += gridStep) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridStep) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Static obstacles
        obstaclesRef.current.forEach(o => {
          ctx.save();
          ctx.fillStyle = theme.obstacleColor;
          ctx.shadowColor = theme.obstacleGlow;
          ctx.shadowBlur = 10;
          const ox = o.x * GRID + 1;
          const oy = o.y * GRID + 1;
          const os = GRID - 2;
          ctx.fillRect(ox, oy, os, os);
          ctx.restore();
        });

        // Alternating red flashing snake
        const flash = Math.floor(elapsed / 80) % 2 === 0;
        snake.forEach((s) => {
          ctx.save();
          ctx.fillStyle = flash ? '#EF4444' : theme.snakeColorBody;
          ctx.shadowColor = flash ? '#EF4444' : theme.snakeColorHead;
          ctx.shadowBlur = 12;
          ctx.fillRect(s.x * GRID + 1, s.y * GRID + 1, GRID - 2, GRID - 2);
          ctx.restore();
        });
        return;
      }

      // Calculate interpolation t
      let t = (timestamp - lastTick) / theme.speed;
      if (t > 1) t = 1;
      if (t < 0) t = 0;

      // ── Core Game Loop Tick ──
      if (timestamp - lastTick >= theme.speed) {
        lastTick = timestamp;
        t = 0;

        // Queue old snake coordinates
        prevSnake = snake.map(s => ({ ...s }));

        // Apply direction
        dirRef.current = { ...nextDirRef.current };

        const head = {
          x: snake[0].x + dirRef.current.x,
          y: snake[0].y + dirRef.current.y,
        };

        // Check walls
        const hitWall = head.x < 0 || head.x >= gridCountX || head.y < 0 || head.y >= gridCountY;
        // Check self
        const hitSelf = snake.some(s => s.x === head.x && s.y === head.y);
        // Check static level obstacles
        const hitObstacle = obstaclesRef.current.some(o => o.x === head.x && o.y === head.y);

        if (hitWall || hitSelf || hitObstacle) {
          isCrashingRef.current = true;
          return;
        }

        snake.unshift(head);

        // Check food eat
        if (head.x === food.x && head.y === food.y) {
          scoreRef.current += 10;
          onScoreChange(scoreRef.current);
          synth.playCollect();

          // Spawn particle sparkles
          for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 2.5 + 1;
            particlesRef.current.push({
              x: food.x * GRID + GRID / 2,
              y: food.y * GRID + GRID / 2,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              color: '#FBBF24', // golden particles
              alpha: 1.0,
              size: Math.random() * 2.5 + 1.2,
            });
          }

          // Trigger screen edge pulse
          edgeGlowPulseRef.current = 1.0;

          // Check Level Up threshold (every 5 food eaten = 50 score points)
          const expectedLevel = Math.floor(scoreRef.current / 50) + 1;
          if (expectedLevel > levelRef.current) {
            levelRef.current = expectedLevel;
            setLevel(expectedLevel);
            onLevelChange?.(expectedLevel);

            // Record highest level reached
            if (expectedLevel > highestLevel) {
              setHighestLevel(expectedLevel);
              localStorage.setItem('birthday_snake_highest_level', String(expectedLevel));
            }

            // Trigger Level Up on-screen Banner
            const nextTheme = LEVELS[Math.min(expectedLevel - 1, LEVELS.length - 1)];
            levelUpAnimRef.current = {
              active: true,
              startTime: timestamp,
              level: expectedLevel,
              name: nextTheme.name,
            };

            // Regenerate obstacles list for new level config
            obstaclesRef.current = generateObstaclesList(nextTheme.obstaclesCount, snake, food);
          }

          spawnFood();
        } else {
          snake.pop();
        }
      }

      // ── SCREEN RENDER ──
      ctx.fillStyle = theme.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Glitch visual flicker (Level 4+ Glitch Zone)
      let isGlitched = false;
      let dxOffset = 0;
      let dyOffset = 0;
      if (levelRef.current >= 4) {
        if (Math.random() < 0.012) {
          isGlitched = true;
          dxOffset = (Math.random() - 0.5) * 5;
          dyOffset = (Math.random() - 0.5) * 5;
          ctx.save();
          ctx.translate(dxOffset, dyOffset);
        }
      }

      // Render faint Grid Lines
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 0.5;
      const gridStep = theme.denserGrid ? GRID / 2 : GRID;
      for (let x = 0; x < canvas.width; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Radar scanline sweep effect
      sweepY += 1.8;
      if (sweepY > canvas.height + 40) sweepY = 0;
      const sweepGrad = ctx.createLinearGradient(0, sweepY - 35, 0, sweepY + 5);
      sweepGrad.addColorStop(0, 'rgba(255,255,255,0)');
      sweepGrad.addColorStop(0.5, `${theme.snakeColorHead}18`);
      sweepGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, sweepY - 35, canvas.width, 40);

      // Draw outer boundary lines when game is playing/active
      ctx.save();
      ctx.strokeStyle = theme.snakeColorHead;
      ctx.lineWidth = 3;
      ctx.shadowColor = theme.snakeColorHead;
      ctx.shadowBlur = 10;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw level obstacles
      obstaclesRef.current.forEach(o => {
        ctx.save();
        ctx.fillStyle = theme.obstacleColor;
        ctx.shadowColor = theme.obstacleGlow;
        ctx.shadowBlur = 10;

        const ox = o.x * GRID + 1;
        const oy = o.y * GRID + 1;
        const os = GRID - 2;

        // Rounded hazard blocks
        ctx.beginPath();
        ctx.roundRect(ox, oy, os, os, 3);
        ctx.fill();

        // Futuristic hazard inner cross pattern
        ctx.strokeStyle = theme.bgColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ox + 4, oy + 4);
        ctx.lineTo(ox + os - 4, oy + os - 4);
        ctx.moveTo(ox + os - 4, oy + 4);
        ctx.lineTo(ox + 4, oy + os - 4);
        ctx.stroke();

        ctx.restore();
      });

      // Food Pulsing Glow and Core
      const foodScale = 1.0 + Math.sin(timestamp * 0.009) * 0.12;
      const fx = food.x * GRID + GRID / 2;
      const fy = food.y * GRID + GRID / 2;
      const foodRadius = (GRID / 2 - 3.5) * foodScale;

      ctx.save();
      ctx.shadowColor = theme.foodColor;
      ctx.shadowBlur = 16 * foodScale;

      // Gold outer radial gradient glow
      const radialGrad = ctx.createRadialGradient(fx, fy, 1, fx, fy, foodRadius + 6);
      radialGrad.addColorStop(0, '#FFFFFF'); // Bright core
      radialGrad.addColorStop(0.2, '#FFFBEB');
      radialGrad.addColorStop(0.6, theme.foodColor); // Golden outer
      radialGrad.addColorStop(1.0, 'rgba(245,158,11,0)');

      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(fx, fy, foodRadius + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render Snake with direction indicator, eyes, gradient, pulsing glow and interpolation
      const glowPulse = 1.0 + Math.sin(timestamp * 0.004) * 0.18;
      
      snake.forEach((s, idx) => {
        const isHead = idx === 0;

        // Interpolate render coordinates
        let renderX = s.x;
        let renderY = s.y;
        if (prevSnake[idx]) {
          renderX = prevSnake[idx].x + (s.x - prevSnake[idx].x) * t;
          renderY = prevSnake[idx].y + (s.y - prevSnake[idx].y) * t;
        }

        const sx = renderX * GRID + 1;
        const sy = renderY * GRID + 1;
        const sSize = isHead ? GRID - 1 : GRID - 3.5;
        const centerOffset = (GRID - sSize) / 2;

        ctx.save();
        
        // Base color gradient fading to tail
        const factor = idx / (snake.length - 1 || 1);
        const segmentColor = isHead ? theme.snakeColorHead : lerpColor(theme.snakeColorHead, theme.snakeColorBody, factor);

        ctx.fillStyle = segmentColor;
        ctx.shadowColor = theme.snakeColorHead;
        ctx.shadowBlur = (isHead ? 14 : 7) * glowPulse;

        ctx.beginPath();
        ctx.roundRect(sx + centerOffset, sy + centerOffset, sSize, sSize, isHead ? 5 : 4);
        ctx.fill();

        // Head eyes/direction indicators
        if (isHead) {
          ctx.fillStyle = '#000000';
          ctx.shadowBlur = 0; // turn off shadow blur for eyes
          
          const curDir = dirRef.current;
          const hX = sx + centerOffset;
          const hY = sy + centerOffset;

          // Align small indicator eyes based on 2D motion vector
          if (curDir.x === 0 && curDir.y === -1) { // Up
            ctx.beginPath();
            ctx.arc(hX + 4, hY + 5, 1.8, 0, Math.PI * 2);
            ctx.arc(hX + sSize - 4, hY + 5, 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (curDir.x === 0 && curDir.y === 1) { // Down
            ctx.beginPath();
            ctx.arc(hX + 4, hY + sSize - 5, 1.8, 0, Math.PI * 2);
            ctx.arc(hX + sSize - 4, hY + sSize - 5, 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (curDir.x === -1 && curDir.y === 0) { // Left
            ctx.beginPath();
            ctx.arc(hX + 5, hY + 4, 1.8, 0, Math.PI * 2);
            ctx.arc(hX + 5, hY + sSize - 4, 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (curDir.x === 1 && curDir.y === 0) { // Right
            ctx.beginPath();
            ctx.arc(hX + sSize - 5, hY + 4, 1.8, 0, Math.PI * 2);
            ctx.arc(hX + sSize - 5, hY + sSize - 4, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      });

      // Render sparkles/particles
      particlesRef.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.024;
        if (p.alpha <= 0) {
          particlesRef.current.splice(idx, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Screen edge pulse glow
      if (edgeGlowPulseRef.current > 0) {
        edgeGlowPulseRef.current -= 0.035;
        if (edgeGlowPulseRef.current < 0) edgeGlowPulseRef.current = 0;

        ctx.save();
        ctx.strokeStyle = theme.snakeColorHead;
        ctx.lineWidth = 6 * edgeGlowPulseRef.current;
        ctx.globalAlpha = 0.35 * edgeGlowPulseRef.current;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      // Subtle glitch bars in Glitch Zone
      if (levelRef.current >= 4 && Math.random() < 0.15) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.fillRect(0, Math.random() * canvas.height, canvas.width, Math.random() * 8 + 2);
        ctx.restore();
      }

      // Pop context translation if glitch zone was active
      if (isGlitched) {
        ctx.restore();
      }

      // Draw "LEVEL UP" Banner
      if (levelUpAnimRef.current && levelUpAnimRef.current.active) {
        const elapsed = timestamp - levelUpAnimRef.current.startTime;
        if (elapsed > 1600) {
          levelUpAnimRef.current.active = false;
        } else {
          const progress = elapsed / 1600;
          let opacity = 1;
          if (progress < 0.15) {
            opacity = progress / 0.15;
          } else if (progress > 0.85) {
            opacity = (1 - progress) / 0.15;
          }

          const scale = 1.0 + Math.sin(progress * Math.PI) * 0.15;

          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.globalAlpha = opacity;

          // Draw neon drop shadow/glow for text banner
          ctx.shadowColor = theme.snakeColorHead;
          ctx.shadowBlur = 15;

          // Scaled level up message
          ctx.font = `bold ${Math.round(20 * scale)}px 'Press Start 2P', monospace`;
          ctx.fillStyle = theme.snakeColorHead;
          ctx.fillText("LEVEL UP!", canvas.width / 2, canvas.height / 2 - 20);

          ctx.font = "8px 'Press Start 2P', monospace";
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowBlur = 4;
          ctx.fillText(`Level ${levelUpAnimRef.current.level}: ${levelUpAnimRef.current.name}`, canvas.width / 2, canvas.height / 2 + 15);
          ctx.restore();
        }
      }
    };

    loopRef.current = requestAnimationFrame(loop);
  };

  const currentTheme = LEVELS[Math.min(level - 1, LEVELS.length - 1)];

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full block"
        style={{ backgroundColor: currentTheme.bgColor }}
      />

      {/* IDLE overlay */}
      {gameState === 'IDLE' && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none"
          style={{ backgroundColor: 'rgba(13, 11, 15, 0.95)' }}
        >
          <div className="text-4xl mb-3" style={{ color: currentTheme.snakeColorHead, textShadow: `0 0 25px ${currentTheme.snakeColorHead}` }}>
            🐍
          </div>
          <h3 className="font-mono text-sm tracking-wider mb-2 uppercase" style={{ color: currentTheme.snakeColorHead, textShadow: `0 0 8px ${currentTheme.snakeColorHead}` }}>
            Snake Game
          </h3>
          <p className="font-mono text-[9px] mb-2 tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Level 1: Grid Runner (Neon)
          </p>
          <p className="font-mono text-[8px] mb-1 tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Arrow keys / WASD / Swipe to Turn
          </p>
          <p className="font-mono text-[8px] mb-3 tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Every 5 Food eaten = Next Level
          </p>

          {/* Level Progress Stepper */}
          <div className="flex flex-col items-center gap-1.5 my-3 font-mono text-[8px] tracking-widest text-left w-full max-w-[280px]">
            {LEVELS.map((lvlConfig, idx) => {
              const isCurrent = (idx + 1) === level;
              const isPassed = (idx + 1) < level;
              const isReached = (idx + 1) <= highestLevel;
              let marker = "  ";
              let color = "rgba(255,255,255,0.2)"; // LOCKED (dimmed gray)
              let shadow = "none";
              if (isCurrent) {
                marker = "> ";
                color = currentTheme.snakeColorHead;
                shadow = `0 0 8px ${currentTheme.snakeColorHead}`;
              } else if (isPassed) {
                marker = "• ";
                color = "#4ADE80"; // PASSED (bright green)
                shadow = "0 0 4px rgba(74, 222, 128, 0.4)";
              } else if (isReached) {
                marker = "o ";
                color = "rgba(74, 222, 128, 0.75)"; // REACHED (soft green)
                shadow = "0 0 3px rgba(74, 222, 128, 0.2)";
              }
              return (
                <div key={idx} style={{ color, textShadow: shadow }} className="flex justify-between w-full">
                  <span>{marker}Lvl {idx + 1}: {lvlConfig.name}</span>
                  <span>{isReached ? "REACHED" : "LOCKED"}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 font-mono text-[9px] mb-6 tracking-widest uppercase">
            <span style={{ color: currentTheme.snakeColorHead }}>High Score: {highScore}</span>
            <span style={{ color: '#FBBF24' }}>Best Level: {highestLevel}</span>
          </div>
          <button
            onClick={onStart}
            className="clickable px-6 py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:scale-105 border"
            style={{
              backgroundColor: 'rgba(74, 222, 128, 0.15)',
              color: currentTheme.snakeColorHead,
              borderColor: 'rgba(74, 222, 128, 0.4)',
              boxShadow: `0 0 15px rgba(74, 222, 128, 0.2)`,
            }}
          >
            ▶ Start Game
          </button>
        </div>
      )}

      {/* GAME OVER overlay */}
      {gameState === 'OVER' && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none"
          style={{ backgroundColor: 'rgba(13, 11, 15, 0.95)' }}
        >
          <h3 className="font-mono text-lg tracking-wider mb-2 uppercase" style={{ color: '#EF4444', textShadow: '0 0 12px rgba(239, 68, 68, 0.6)' }}>
            Game Over
          </h3>
          <p className="font-mono text-xs tracking-wider mb-2 uppercase" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Score: {scoreRef.current}
          </p>

          {/* Level Progress Stepper */}
          <div className="flex flex-col items-center gap-1.5 my-3 font-mono text-[8px] tracking-widest text-left w-full max-w-[280px]">
            {LEVELS.map((lvlConfig, idx) => {
              const isCurrent = (idx + 1) === level;
              const isPassed = (idx + 1) < level;
              const isReached = (idx + 1) <= highestLevel;
              let marker = "  ";
              let color = "rgba(255,255,255,0.2)"; // LOCKED (dimmed gray)
              let shadow = "none";
              if (isCurrent) {
                marker = "> ";
                color = currentTheme.snakeColorHead;
                shadow = `0 0 8px ${currentTheme.snakeColorHead}`;
              } else if (isPassed) {
                marker = "• ";
                color = "#4ADE80"; // PASSED (bright green)
                shadow = "0 0 4px rgba(74, 222, 128, 0.4)";
              } else if (isReached) {
                marker = "o ";
                color = "rgba(74, 222, 128, 0.75)"; // REACHED (soft green)
                shadow = "0 0 3px rgba(74, 222, 128, 0.2)";
              }
              return (
                <div key={idx} style={{ color, textShadow: shadow }} className="flex justify-between w-full">
                  <span>{marker}Lvl {idx + 1}: {lvlConfig.name}</span>
                  <span>{isReached ? "REACHED" : "LOCKED"}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 font-mono text-[9px] mb-6 tracking-wider uppercase">
            <span style={{ color: currentTheme.snakeColorHead }}>Best Score: {highScore}</span>
            <span style={{ color: '#FBBF24' }}>Best Level: {highestLevel}</span>
          </div>
          <button
            onClick={onStart}
            className="clickable px-6 py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:scale-105 border"
            style={{
              backgroundColor: 'rgba(74, 222, 128, 0.15)',
              color: currentTheme.snakeColorHead,
              borderColor: 'rgba(74, 222, 128, 0.4)',
              boxShadow: `0 0 15px rgba(74, 222, 128, 0.2)`,
            }}
          >
            ↺ Retry
          </button>
        </div>
      )}
    </div>
  );
};
