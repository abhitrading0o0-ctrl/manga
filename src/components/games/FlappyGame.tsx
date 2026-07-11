import React, { useEffect, useRef, useState, useCallback } from 'react';

interface FlappyGameProps {
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
  gameState: 'IDLE' | 'PLAYING' | 'OVER';
  onStart: () => void;
  highScore: number;
}

const BG_COLOR = '#FAF6EE'; // Warm cream paper background
const INK_COLOR = '#1A1714'; // Bold black/brown ink color
const PAPER_FLECK_COLOR = '#EAE1D2'; // Paper fiber details

// Custom retro-sound synthesis helper for Flappy
class FlappySynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playFlap() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Quick pitch slide up (soft chiptune flap sound)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playScore() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Soft high chime sound (C6 then G6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.50, now);
      osc.frequency.setValueAtTime(1567.98, now + 0.08);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playCrash() {
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      const now = ctx.currentTime;

      // Heavy retro slide down crash chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.45);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {}
  }
}

const synth = new FlappySynth();

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

      // Energetic gaming B&W theme chiptune loops (slightly higher key for Flappy!)
      const bassline = [130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 196.00, 220.00]; // C3 to A3
      const melody = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // C4 to E5

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
      console.warn("Flappy game chiptune BGM initialization failed:", e);
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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  isLine: boolean;
}

interface BirdTrailPoint {
  x: number;
  y: number;
  alpha: number;
  size: number;
  angle: number;
}

export const FlappyGame: React.FC<FlappyGameProps> = ({
  onGameOver,
  onScoreChange,
  gameState,
  onStart,
  highScore
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const gameRunningRef = useRef(false);

  const [scorePopTime, setScorePopTime] = useState(0);

  // Global key listener for spacebar to start game when in IDLE/OVER state
  useEffect(() => {
    const handleGlobalSpace = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        if (gameState === 'IDLE' || gameState === 'OVER') {
          e.preventDefault();
          onStart();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalSpace);
    return () => window.removeEventListener('keydown', handleGlobalSpace);
  }, [gameState, onStart]);

  const bgmRef = useRef(new ChiptuneBGM());

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

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopLoop();
    bgmRef.current.start();
    scoreRef.current = 0;
    onScoreChange(0);
    gameRunningRef.current = true;

    let birdY = canvas.height / 2;
    let velocity = 0;
    const gravity = 0.38;
    const lift = -6.8;
    const birdX = 80;
    const birdRadius = 12.5;

    let pipes: { x: number; topH: number; gap: number; passed: boolean; styleType: number }[] = [];
    const pipeWidth = 48;
    const gapSize = 125;
    let pipeSpawnTimer = 0;

    // Visual feedback lists
    let particles: Particle[] = [];
    let trail: BirdTrailPoint[] = [];

    // Crash sequence variables
    let isCrashing = false;
    let crashAngle = 0;
    let crashVelocity = 0;
    let crashTime = 0;

    const flap = () => {
      if (isCrashing) return;
      velocity = lift;
      synth.playFlap();

      // Spawn manga speed lines/sparks on flap input
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: birdX - 8,
          y: birdY,
          vx: -2.0 - Math.random() * 3.0,
          vy: (Math.random() - 0.5) * 3.0,
          alpha: 1.0,
          size: Math.random() * 5 + 3,
          isLine: Math.random() < 0.5
        });
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    const handleClick = () => flap();
    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      flap();
    };

    window.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });

    const cleanupListeners = () => {
      window.removeEventListener('keydown', handleKey);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
    };

    let lastTime = performance.now();

    // Parallax background offsets
    let bgScreentoneX = 0;

    const loop = (timestamp: number) => {
      if (!gameRunningRef.current) {
        cleanupListeners();
        return;
      }
      loopRef.current = requestAnimationFrame(loop);

      // Delta time based movement calculation
      const elapsed = timestamp - lastTime;
      lastTime = timestamp;
      
      let dt = elapsed / 16.666;
      if (dt > 3.0) dt = 3.0;
      if (dt < 0.1) dt = 0.1;

      // ── Handle Crash Sequence ──
      if (isCrashing) {
        if (crashTime === 0) {
          crashTime = timestamp;
          synth.playCrash();
          bgmRef.current.stop();
        }

        const crashElapsed = timestamp - crashTime;
        
        // Tumbling falling animation
        crashAngle += 0.22 * dt;
        crashVelocity += gravity * 1.2 * dt;
        birdY += crashVelocity * dt;

        // Draw crash sequence in black and white manga style
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Faint paper flecks
        ctx.fillStyle = PAPER_FLECK_COLOR;
        for (let i = 0; i < 30; i++) {
          const rx = (i * 277) % canvas.width;
          const ry = (i * 139) % canvas.height;
          ctx.fillRect(rx, ry, 2, 2);
        }

        // Draw static sword towers in ink style
        pipes.forEach(p => {
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = INK_COLOR;
          ctx.lineWidth = 2.2;

          // Top spike building
          ctx.beginPath();
          ctx.rect(p.x, 0, pipeWidth, p.topH);
          ctx.fill();
          ctx.stroke();

          // Bottom spike building
          const bottomY = p.topH + p.gap;
          ctx.beginPath();
          ctx.rect(p.x, bottomY, pipeWidth, canvas.height - bottomY);
          ctx.fill();
          ctx.stroke();

          ctx.restore();
        });

        // Alternating red flashing crash bird
        const flash = Math.floor(crashElapsed / 60) % 2 === 0;
        ctx.save();
        ctx.translate(birdX, birdY);
        ctx.rotate(crashAngle);
        ctx.fillStyle = flash ? '#EF4444' : '#FFFFFF';
        ctx.strokeStyle = INK_COLOR;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (birdY - birdRadius > canvas.height) {
          gameRunningRef.current = false;
          cleanupListeners();
          onGameOver(scoreRef.current);
        }
        return;
      }

      // ── normal gameplay physics ──
      velocity += gravity * dt;
      birdY += velocity * dt;

      // Ceiling/floor collision
      if (birdY + birdRadius > canvas.height || birdY - birdRadius < 0) {
        isCrashing = true;
        crashVelocity = velocity;
        return;
      }

      // Parallax scroll velocities
      bgScreentoneX -= 0.6 * dt;

      // Loop background scroll wraps
      if (bgScreentoneX <= -50) bgScreentoneX = 0;

      // Spawn pipes/towers
      pipeSpawnTimer += 1.0 * dt;
      if (pipeSpawnTimer >= 85) {
        pipeSpawnTimer = 0;
        const topH = Math.random() * (canvas.height - gapSize - 110) + 55;
        const styleType = Math.floor(Math.random() * 3); // Tower variations
        pipes.push({ x: canvas.width, topH, gap: gapSize, passed: false, styleType });
      }

      // Throttle collision checks to nearest upcoming obstacle
      let nearestPipeIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        p.x -= 2.8 * dt;

        if (p.x + pipeWidth >= birdX - birdRadius) {
          const dist = p.x - birdX;
          if (dist < minDistance) {
            minDistance = dist;
            nearestPipeIdx = i;
          }
        }

        // Score check
        if (!p.passed && p.x + pipeWidth < birdX) {
          p.passed = true;
          scoreRef.current += 1;
          onScoreChange(scoreRef.current);
          synth.playScore();
          setScorePopTime(timestamp);
        }
      }

      // Run collision only against the nearest upcoming pipe
      if (nearestPipeIdx !== -1) {
        const p = pipes[nearestPipeIdx];
        const birdLeft = birdX - birdRadius;
        const birdRight = birdX + birdRadius;
        const birdTop = birdY - birdRadius;
        const birdBottom = birdY + birdRadius;
        const pipeLeft = p.x;
        const pipeRight = p.x + pipeWidth;

        // Collision logic is identical to original hitbox rectangle bounds
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
          if (birdTop < p.topH || birdBottom > p.topH + p.gap) {
            isCrashing = true;
            crashVelocity = velocity;
          }
        }
      }

      // Clean off-screen pipes properly to prevent memory leak
      for (let i = pipes.length - 1; i >= 0; i--) {
        if (pipes[i].x < -pipeWidth) {
          pipes.splice(i, 1);
        }
      }

      // Update trail points for B&W manga speed lines
      trail.push({ x: birdX, y: birdY, alpha: 1.0, size: birdRadius - 2, angle: velocity * 0.07 });
      if (trail.length > 7) trail.shift();
      trail.forEach(tPoint => {
        tPoint.alpha -= 0.12 * dt;
      });

      // Update particles
      particles.forEach((p, idx) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 0.045 * dt;
        if (p.alpha <= 0) {
          particles.splice(idx, 1);
        }
      });

      // ── SCREEN RENDER ──
      // Off-white paper background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle paper flecks/grain
      ctx.fillStyle = PAPER_FLECK_COLOR;
      for (let i = 0; i < 40; i++) {
        const rx = (i * 277) % canvas.width;
        const ry = (i * 139) % canvas.height;
        ctx.fillRect(rx, ry, 1.8, 1.8);
      }

      // PARALLAX LAYER: Manga Halftone Screentone Shading (subtle low-density dots)
      ctx.fillStyle = 'rgba(26, 23, 20, 0.05)'; // faint ink gray
      const dotSpacing = 16;
      for (let x = (bgScreentoneX % dotSpacing); x < canvas.width + 20; x += dotSpacing) {
        for (let y = 0; y < canvas.height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Sword/Spike Building Towers
      pipes.forEach(p => {
        const bottomY = p.topH + p.gap;

        ctx.save();
        ctx.strokeStyle = INK_COLOR;
        ctx.fillStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;

        // TOP TOWER (Sword blade/Spike building silhouette)
        ctx.beginPath();
        // Left side down
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, p.topH - 24);
        // Taper to sharp tip at bottom of top tower
        ctx.lineTo(p.x + pipeWidth / 2, p.topH);
        ctx.lineTo(p.x + pipeWidth, p.topH - 24);
        ctx.lineTo(p.x + pipeWidth, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shading lines/screentone inside top tower based on style variation
        ctx.beginPath();
        if (p.styleType === 0) {
          // Cross-hatching shading on one side
          for (let y = 10; y < p.topH - 24; y += 12) {
            ctx.moveTo(p.x + 3, y);
            ctx.lineTo(p.x + 18, y + 8);
          }
        } else if (p.styleType === 1) {
          // Vertical lines/window panels
          ctx.moveTo(p.x + pipeWidth / 2 - 6, 10);
          ctx.lineTo(p.x + pipeWidth / 2 - 6, p.topH - 30);
          ctx.moveTo(p.x + pipeWidth / 2 + 6, 10);
          ctx.lineTo(p.x + pipeWidth / 2 + 6, p.topH - 30);
        } else {
          // Blocks/brick outlines
          for (let y = 15; y < p.topH - 25; y += 20) {
            ctx.moveTo(p.x, y);
            ctx.lineTo(p.x + pipeWidth, y);
          }
        }
        ctx.stroke();

        // BOTTOM TOWER (Spike/sword pointing up)
        ctx.beginPath();
        // Left side up from bottom
        ctx.moveTo(p.x, canvas.height);
        ctx.lineTo(p.x, bottomY + 24);
        // Taper to sharp tip pointing up at top of bottom tower
        ctx.lineTo(p.x + pipeWidth / 2, bottomY);
        ctx.lineTo(p.x + pipeWidth, bottomY + 24);
        ctx.lineTo(p.x + pipeWidth, canvas.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shading lines inside bottom tower
        ctx.beginPath();
        if (p.styleType === 0) {
          for (let y = bottomY + 30; y < canvas.height - 10; y += 12) {
            ctx.moveTo(p.x + 3, y);
            ctx.lineTo(p.x + 18, y + 8);
          }
        } else if (p.styleType === 1) {
          ctx.moveTo(p.x + pipeWidth / 2 - 6, bottomY + 30);
          ctx.lineTo(p.x + pipeWidth / 2 - 6, canvas.height - 10);
          ctx.moveTo(p.x + pipeWidth / 2 + 6, bottomY + 30);
          ctx.lineTo(p.x + pipeWidth / 2 + 6, canvas.height - 10);
        } else {
          for (let y = bottomY + 30; y < canvas.height - 10; y += 20) {
            ctx.moveTo(p.x, y);
            ctx.lineTo(p.x + pipeWidth, y);
          }
        }
        ctx.stroke();

        // Subtle manga impact/action lines radiating static from edges
        ctx.strokeStyle = 'rgba(26, 23, 20, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top tower spikes
        ctx.moveTo(p.x - 3, p.topH - 24);
        ctx.lineTo(p.x - 12, p.topH - 28);
        ctx.moveTo(p.x + pipeWidth + 3, p.topH - 24);
        ctx.lineTo(p.x + pipeWidth + 12, p.topH - 28);
        // Bottom tower spikes
        ctx.moveTo(p.x - 3, bottomY + 24);
        ctx.lineTo(p.x - 12, bottomY + 20);
        ctx.moveTo(p.x + pipeWidth + 3, bottomY + 24);
        ctx.lineTo(p.x + pipeWidth + 12, bottomY + 20);
        ctx.stroke();

        // Draw Collectible ink star in gap
        if (!p.passed) {
          ctx.save();
          ctx.translate(p.x + pipeWidth / 2, p.topH + p.gap / 2);
          ctx.fillStyle = INK_COLOR;
          ctx.beginPath();
          // Draw 4-point manga spark star shape
          ctx.moveTo(0, -6);
          ctx.quadraticCurveTo(0, 0, 6, 0);
          ctx.quadraticCurveTo(0, 0, 0, 6);
          ctx.quadraticCurveTo(0, 0, -6, 0);
          ctx.quadraticCurveTo(0, 0, 0, -6);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      });

      // Draw Bird ink speed-line trail (manga speedlines)
      ctx.save();
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 1.0;
      trail.forEach((tPoint, index) => {
        if (tPoint.alpha <= 0) return;
        ctx.globalAlpha = tPoint.alpha * 0.45;
        
        // Draw trailing horizontal speed stroke lines behind bird position
        const offsetMultiplier = trail.length - index;
        ctx.beginPath();
        ctx.moveTo(tPoint.x - 15 - offsetMultiplier * 1.5, tPoint.y - 2);
        ctx.lineTo(tPoint.x - 5 - offsetMultiplier * 1.5, tPoint.y - 2);
        ctx.moveTo(tPoint.x - 12 - offsetMultiplier * 1.5, tPoint.y + 3);
        ctx.lineTo(tPoint.x - 3 - offsetMultiplier * 1.5, tPoint.y + 3);
        ctx.stroke();
      });
      ctx.restore();

      // Render custom particles (manga ink/action lines & puffs)
      ctx.save();
      ctx.strokeStyle = INK_COLOR;
      ctx.fillStyle = INK_COLOR;
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        ctx.globalAlpha = p.alpha;
        if (p.isLine) {
          // Draw a tiny ink speed-line dash
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
          ctx.stroke();
        } else {
          // Draw tiny ink dot puff
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();

      // Render Bird Character (manga ink style)
      ctx.save();
      ctx.translate(birdX, birdY);

      let angle = velocity * 0.07;
      angle = Math.max(-0.4, Math.min(0.7, angle));
      ctx.rotate(angle);

      // Ink stroke outlines
      ctx.strokeStyle = INK_COLOR;
      ctx.lineWidth = 2.4;
      ctx.fillStyle = '#FFFFFF';

      // Body circle
      ctx.beginPath();
      ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wing frame cycle pose selection
      const wingFrame = Math.floor(timestamp / 70) % 3;
      ctx.beginPath();
      if (wingFrame === 0) {
        // High wing
        ctx.moveTo(-1, -1);
        ctx.quadraticCurveTo(-10, -10, -5, -14);
        ctx.quadraticCurveTo(3, -12, -1, -1);
      } else if (wingFrame === 1) {
        // Mid wing
        ctx.moveTo(-3, 0);
        ctx.quadraticCurveTo(-12, -3, -10, -7);
        ctx.quadraticCurveTo(-1, -4, -3, 0);
      } else {
        // Down wing
        ctx.moveTo(-2, 1);
        ctx.quadraticCurveTo(-8, 8, -4, 12);
        ctx.quadraticCurveTo(2, 6, -2, 1);
      }
      ctx.fill();
      ctx.stroke();

      // Simple sharp determined manga eye
      ctx.fillStyle = INK_COLOR;
      ctx.beginPath();
      // determined eye slice line
      ctx.moveTo(2, -4);
      ctx.lineTo(7, -3);
      ctx.lineTo(5, -1);
      ctx.closePath();
      ctx.fill();

      // Beak (ink style)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(birdRadius - 1, 0);
      ctx.lineTo(birdRadius + 5, 2);
      ctx.lineTo(birdRadius - 1, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Score-pop bounce animation on score HUD
      ctx.save();
      const popElapsed = timestamp - scorePopTime;
      let scoreScale = 1.0;
      if (popElapsed < 250) {
        scoreScale = 1.0 + Math.sin((popElapsed / 250) * Math.PI) * 0.35;
      }

      ctx.font = "bold 22px 'Press Start 2P', monospace";
      ctx.fillStyle = INK_COLOR;
      ctx.textAlign = 'center';

      ctx.translate(canvas.width / 2, 40);
      ctx.scale(scoreScale, scoreScale);
      ctx.fillText(String(scoreRef.current), 0, 0);
      ctx.restore();
    };

    loopRef.current = requestAnimationFrame(loop);
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full block"
        style={{ backgroundColor: BG_COLOR }}
      />

      {/* IDLE overlay (B&W manga reskin) */}
      {gameState === 'IDLE' && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none"
          style={{ backgroundColor: 'rgba(250, 246, 238, 0.96)' }}
        >
          {/* Bobbing idle bird icon */}
          <div
            className="text-4xl mb-4 font-bold border-2 border-current rounded-full p-2 bg-white"
            style={{
              color: INK_COLOR,
              borderColor: INK_COLOR,
              animation: 'bounce-slow 2s ease-in-out infinite'
            }}
          >
            🐦
          </div>
          <h3 className="font-mono text-sm tracking-wider mb-2 uppercase" style={{ color: INK_COLOR }}>
            Flappy Manga
          </h3>
          <p className="font-mono text-[9px] mb-1 tracking-widest uppercase" style={{ color: 'rgba(26,23,20,0.6)' }}>
            PRESS SPACEBAR TO START
          </p>
          <p className="font-mono text-[8px] mb-6 tracking-widest uppercase animate-pulse" style={{ color: 'rgba(26,23,20,0.5)' }}>
            (or TAP / CLICK to flap)
          </p>
          <p className="font-mono text-[9px] mb-6 tracking-widest uppercase" style={{ color: INK_COLOR }}>
            High Score: {highScore}
          </p>
          <button
            onClick={onStart}
            className="clickable px-6 py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:scale-105 border-2"
            style={{
              backgroundColor: '#FFFFFF',
              color: INK_COLOR,
              borderColor: INK_COLOR,
              boxShadow: '0 4px 0 #1A1714',
            }}
          >
            ▶ Start Game
          </button>
        </div>
      )}

      {/* GAME OVER overlay (B&W manga reskin) */}
      {gameState === 'OVER' && (
        <div
          className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none"
          style={{ backgroundColor: 'rgba(250, 246, 238, 0.96)' }}
        >
          {/* Manga-panel dramatic impact splash effect behind the header */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-600 via-transparent to-transparent" />
          
          <h3 className="font-mono text-xl tracking-wider mb-2 uppercase font-black" style={{ color: INK_COLOR }}>
            GAME OVER
          </h3>
          <p className="font-mono text-xs tracking-wider mb-1 uppercase" style={{ color: 'rgba(26,23,20,0.8)' }}>
            Score: {scoreRef.current}
          </p>
          <p className="font-mono text-[9px] tracking-wider mb-6 uppercase" style={{ color: INK_COLOR }}>
            Best Score: {highScore}
          </p>
          <button
            onClick={onStart}
            className="clickable px-6 py-2.5 rounded-full font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer hover:scale-105 border-2"
            style={{
              backgroundColor: '#FFFFFF',
              color: INK_COLOR,
              borderColor: INK_COLOR,
              boxShadow: '0 4px 0 #1A1714',
            }}
          >
            ↺ Retry
          </button>
        </div>
      )}
    </div>
  );
};
