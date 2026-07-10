import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '../context/AudioContext';
import confetti from 'canvas-confetti';

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

interface Firework {
  x: number;
  y: number;
  tx: number; // target x
  ty: number; // target y
  vx: number;
  vy: number;
  color: string;
  exploded: boolean;
  particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; decay: number }[];
}

export const FinalSurprise: React.FC = () => {
  const { playSound } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // 1. Play Climax Chime Melody
    setTimeout(() => {
      playSound('reveal');
    }, 500);

    // 2. Launch Confetti Rain
    const runConfettiBurst = () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E9C874', '#5A49D6', '#aa3bff', '#ffffff']
      });
    };
    runConfettiBurst();
    const confettiTimer = setInterval(runConfettiBurst, 3500);

    // 3. Canvas Firework & Lantern Loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lanterns: Lantern[] = [];
    let fireworks: Firework[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Create 15 lanterns initial
    for (let i = 0; i < 15; i++) {
      lanterns.push(createLantern(Math.random() * window.innerHeight));
    }

    function createLantern(yOverride?: number): Lantern {
      return {
        x: Math.random() * window.innerWidth,
        y: yOverride ?? window.innerHeight + 50,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.3),
        width: Math.random() * 15 + 10,
        height: Math.random() * 22 + 14,
        alpha: Math.random() * 0.5 + 0.4,
        rotation: (Math.random() - 0.5) * 0.1,
        rotSpeed: (Math.random() - 0.5) * 0.005
      };
    }

    const fireworkColors = ['233, 200, 116', '90, 73, 214', '167, 139, 250', '244, 63, 94', '16, 185, 129'];

    const triggerFirework = () => {
      if (fireworks.length > 5) return;
      const tx = Math.random() * canvas.width;
      const ty = Math.random() * (canvas.height * 0.4) + 60;
      fireworks.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        tx,
        ty,
        vx: 0,
        vy: -7, // lift speed
        color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
        exploded: false,
        particles: []
      });
      playSound('shake');
    };

    const fireworkTriggerTimer = setInterval(triggerFirework, 2200);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw & Update Lanterns
      lanterns.forEach((l, idx) => {
        l.y += l.vy;
        l.x += l.vx;
        l.rotation += l.rotSpeed;
        
        // boundary wrap
        if (l.y < -50) {
          lanterns[idx] = createLantern();
        }

        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.rotation);

        // draw glowing body
        const grad = ctx.createLinearGradient(0, 0, 0, l.height);
        grad.addColorStop(0, `rgba(233, 200, 116, ${l.alpha})`); // Gold glow
        grad.addColorStop(1, `rgba(249, 115, 22, ${l.alpha * 0.7})`); // Orange bottom
        
        ctx.fillStyle = grad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.7)';
        ctx.fillRect(-l.width / 2, -l.height / 2, l.width, l.height);
        ctx.shadowBlur = 0; // reset

        // Flame inner glow
        ctx.fillStyle = `rgba(255, 255, 255, ${l.alpha})`;
        ctx.beginPath();
        ctx.arc(0, l.height / 2.5, l.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Draw & Update Fireworks
      fireworks.forEach((fw, idx) => {
        if (!fw.exploded) {
          // Travel up
          fw.y += fw.vy;
          
          // Draw rocket particle trail
          ctx.fillStyle = `rgba(${fw.color}, 0.8)`;
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 3, 0, Math.PI * 2);
          ctx.fill();

          // Explode check
          if (fw.y <= fw.ty) {
            fw.exploded = true;
            playSound('open');
            // Spawn explosion particles
            const count = 35 + Math.floor(Math.random() * 20);
            for (let i = 0; i < count; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 4.5 + 1.5;
              fw.particles.push({
                x: fw.x,
                y: fw.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: Math.random() * 2.2 + 0.8,
                alpha: 1.0,
                decay: Math.random() * 0.02 + 0.015
              });
            }
          }
        } else {
          // Draw explosion particles
          for (let k = fw.particles.length - 1; k >= 0; k--) {
            const p = fw.particles[k];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.04; // gravity drag
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
              fw.particles.splice(k, 1);
              continue;
            }

            ctx.beginPath();
            ctx.fillStyle = `rgba(${fw.color}, ${p.alpha})`;
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // Remove complete explosions
          if (fw.particles.length === 0) {
            fireworks.splice(idx, 1);
          }
        }
      });

      rafId = requestAnimationFrame(tick);
    };

    tick();

    // Show final trigger button after short delay
    setTimeout(() => {
      setShowButton(true);
    }, 4500);

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(confettiTimer);
      clearInterval(fireworkTriggerTimer);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleLastSurprise = () => {
    playSound('click');
    // Open a special mock final window or alert, which can be linked to anything!
    alert("🎁 One Last Surprise:\n\nThis button can be customized to play a secret recording, trigger a photo album, or redirect to a customized video URL!");
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-[#050608] z-50 flex items-center justify-center select-none overflow-hidden"
    >
      {/* Sky Canvas renderer */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none block w-full h-full bg-transparent" />

      {/* Climax message letter */}
      <div className="relative z-10 text-center max-w-xl px-6 w-full flex flex-col items-center select-text">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border-white/10 shadow-2xl relative animate-scale-up">
          
          <span className="text-gold text-4xl mb-4 block animate-bounce select-none">✨</span>
          
          <h2 className="text-white font-display text-2xl sm:text-3xl font-bold tracking-widest mb-6 glow-text-gold">
            A Wish on the Stars
          </h2>

          <div className="font-handwritten text-xl sm:text-2xl text-gold/95 leading-relaxed mb-10 text-left select-text">
            <p className="mb-4">The stars aligned today to write this story for you...</p>
            <p className="mb-4">Though the scroll may stop and the pages may turn, the care and appreciation built into every pixel of this universe will stay with you long after today.</p>
            <p>Happy Birthday. May your year ahead be as magical as the night sky. 🌸</p>
          </div>

          {showButton && (
            <button
              onClick={handleLastSurprise}
              className="clickable animate-fade-in px-10 py-4 bg-gradient-to-r from-accent to-gold text-bg font-sans font-bold text-xs tracking-[0.25em] uppercase rounded-full shadow-[0_0_20px_rgba(233,200,116,0.55)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              🎁 One Last Surprise
            </button>
          )}

        </div>
      </div>
    </div>
  );
};