import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay?: number;
  isClickSpark?: boolean;
}

export const GlobalParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -1000, y: -1000, active: false };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Populate ambient glowing particles
    const initAmbientParticles = () => {
      const pCount = Math.min(65, Math.floor(window.innerWidth / 20));
      particles = [];
      for (let i = 0; i < pCount; i++) {
        particles.push(createAmbientParticle());
      }
    };

    const createAmbientParticle = (x?: number, y?: number): Particle => {
      const isGold = Math.random() > 0.65;
      return {
        x: x ?? Math.random() * window.innerWidth,
        y: y ?? Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 0.4,
        color: isGold ? '233, 200, 116' : '90, 73, 214', // gold / accent-blue
        alpha: Math.random() * 0.55 + 0.2
      };
    };

    initAmbientParticles();

    // Mouse movement tracker
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    // Click sparkle emitter
    const handleMouseClick = (e: MouseEvent) => {
      const count = 18 + Math.floor(Math.random() * 12);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.8 + 1.2;
        const isGold = Math.random() > 0.4;
        
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2.2 + 0.8,
          color: isGold ? '233, 200, 116' : '247, 247, 247', // gold / white sparkles
          alpha: 1.0,
          decay: Math.random() * 0.025 + 0.015,
          isClickSpark: true
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleMouseClick);

    // Core Particle Tick Update
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Loop over particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Apply mouse interaction for ambient ones
        if (!p.isClickSpark && mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            // Push away gently
            p.x += (dx / dist) * force * 1.5;
            p.y += (dy / dist) * force * 1.5;
          }
        }

        // Handle Click Sparks
        if (p.isClickSpark && p.decay) {
          p.alpha -= p.decay;
          p.radius *= 0.98; // shrink
          if (p.alpha <= 0 || p.radius <= 0.2) {
            particles.splice(i, 1);
            continue;
          }
        } else {
          // Boundary wrapping for ambient stars
          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;

          // Twinkle ambient ones
          p.alpha += (Math.random() - 0.5) * 0.04;
          p.alpha = Math.max(0.1, Math.min(0.8, p.alpha));
        }

        // Draw
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.5);
        grad.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
        grad.addColorStop(0.35, `rgba(${p.color}, ${p.alpha * 0.4})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleMouseClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none w-screen h-screen block bg-transparent"
    />
  );
};