import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  phase: number;
  twinkleSpeed: number;
  depth: number; // 0 (far/slow) to 2 (near/fast)
}

interface Nebula {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  baseRadius: number;
  colorStart: string;
  colorEnd: string;
  speed: number;
  angle: number;
}

export const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep track of parallax displacement
  const mousePos = useRef({ x: 0, y: 0 });
  const lerpMousePos = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let stars: Star[] = [];
    let nebulas: Nebula[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeStars();
    };

    const initializeStars = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      // Dense star field
      const starCount = Math.floor((W * H) / 9000);
      stars = Array.from({ length: starCount }, () => {
        const depth = Math.floor(Math.random() * 3); // 0, 1, or 2
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.2 + 0.4 + (depth * 0.4), // near stars are larger
          baseAlpha: Math.random() * 0.7 + 0.3,
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.01 + Math.random() * 0.02,
          depth,
        };
      });
    };

    // Nebula setup: 3 soft blooms in gold/rose, cool violet, and deep indigo
    nebulas = [
      {
        x: window.innerWidth * 0.3,
        y: window.innerHeight * 0.3,
        targetX: window.innerWidth * 0.3,
        targetY: window.innerHeight * 0.3,
        baseRadius: Math.max(window.innerWidth, window.innerHeight) * 0.38,
        colorStart: 'rgba(212, 117, 107, 0.07)', // Rose
        colorEnd: 'rgba(212, 117, 107, 0)',
        speed: 0.0006,
        angle: Math.random() * Math.PI * 2,
      },
      {
        x: window.innerWidth * 0.7,
        y: window.innerHeight * 0.6,
        targetX: window.innerWidth * 0.7,
        targetY: window.innerHeight * 0.6,
        baseRadius: Math.max(window.innerWidth, window.innerHeight) * 0.42,
        colorStart: 'rgba(233, 200, 116, 0.06)', // warm gold
        colorEnd: 'rgba(233, 200, 116, 0)',
        speed: 0.0004,
        angle: Math.random() * Math.PI * 2,
      },
      {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.8,
        targetX: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.8,
        baseRadius: Math.max(window.innerWidth, window.innerHeight) * 0.45,
        colorStart: 'rgba(139, 123, 199, 0.07)', // Violet
        colorEnd: 'rgba(139, 123, 199, 0)',
        speed: 0.0005,
        angle: Math.random() * Math.PI * 2,
      },
    ];

    window.addEventListener('resize', resize);
    resize();

    // Mouse move tracking
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -0.5 to 0.5
      mousePos.current.x = (e.clientX / window.innerWidth) - 0.5;
      mousePos.current.y = (e.clientY / window.innerHeight) - 0.5;
    };

    // Scroll tracking
    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Animation Loop
    const tick = () => {
      // Smooth mouse lerping
      lerpMousePos.current.x += (mousePos.current.x - lerpMousePos.current.x) * 0.08;
      lerpMousePos.current.y += (mousePos.current.y - lerpMousePos.current.y) * 0.08;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // 1. Draw Nebulas (slow drift)
      nebulas.forEach((n) => {
        n.angle += n.speed;
        // Float around target point
        const offsetX = Math.cos(n.angle) * 45;
        const offsetY = Math.sin(n.angle * 1.3) * 45;
        const currentX = n.targetX + offsetX;
        const currentY = n.targetY + offsetY;

        // Apply scroll offset to nebulas for mild parallax
        const finalY = currentY - scrollY.current * 0.15;

        const grad = ctx.createRadialGradient(currentX, finalY, 0, currentX, finalY, n.baseRadius);
        grad.addColorStop(0, n.colorStart);
        grad.addColorStop(1, n.colorEnd);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });

      // 2. Draw Stars (twinkling and parallax)
      stars.forEach((s) => {
        // Individual twinkle update
        s.phase += s.twinkleSpeed;
        const alphaFactor = 0.5 + Math.sin(s.phase) * 0.5;
        const alpha = s.baseAlpha * (0.3 + alphaFactor * 0.7);

        // Parallax offset calculations
        // Deeper stars shift less, nearer stars shift more
        const depthFactor = s.depth === 0 ? 0.02 : s.depth === 1 ? 0.05 : 0.12;

        const pX = lerpMousePos.current.x * W * depthFactor * 0.8;
        const pY = lerpMousePos.current.y * H * depthFactor * 0.8;

        // Scroll offset
        const sY = -scrollY.current * depthFactor;

        // Final star coordinates with wrapping bounds
        let finalX = (s.x + pX) % W;
        let finalY = (s.y + pY + sY) % H;

        if (finalX < 0) finalX += W;
        if (finalY < 0) finalY += H;

        ctx.beginPath();
        ctx.arc(finalX, finalY, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 240, 255, ${alpha})`;

        // Give nearest layer a small bloom glow
        if (s.depth === 2 && s.r > 1.4) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(233, 200, 116, 0.8)';
        }

        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      rafId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none block w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};
