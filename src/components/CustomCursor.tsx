import React, { useEffect, useState, useRef } from 'react';
import { useView } from '../context/ViewContext';
import gsap from 'gsap';

export const CustomCursor: React.FC = () => {
  const { currentView } = useView();

  const [isVisible, setIsVisible] = useState(false);
  
  const cursorDotRef = useRef<HTMLDivElement | null>(null);

  const charIdxRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Detect mobile touch devices to hide custom cursor
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    setIsVisible(true);

    const mouse = { x: 0, y: 0 };
    const posDot = { x: 0, y: 0 };

    const spawnLetter = (x: number, y: number) => {
      const text = "Happy Birthday";
      const char = text[charIdxRef.current];
      charIdxRef.current = (charIdxRef.current + 1) % text.length;

      if (char === ' ') return; // skip spaces

      const p = document.createElement('span');
      p.innerText = char;
      p.className = "fixed pointer-events-none text-gold font-display font-bold text-[13px] select-none z-[9995] glow-text-gold";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.transform = `translate(-50%, -50%) rotate(${(Math.random() - 0.5) * 35}deg)`;

      document.body.appendChild(p);

      gsap.to(p, {
        y: '-=70',
        x: `+=${(Math.random() - 0.5) * 55}`,
        opacity: 0,
        scale: 1.9,
        duration: 1.4,
        ease: 'power2.out',
        onComplete: () => {
          p.remove();
        }
      });
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Distance checking to limit text emitter spawn density
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 16) {
        spawnLetter(e.clientX, e.clientY);
        lastPosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const tick = () => {
      posDot.x += (mouse.x - posDot.x) * 0.22;
      posDot.y += (mouse.y - posDot.y) * 0.22;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${posDot.x - 3}px, ${posDot.y - 3}px, 0)`;
      }

      requestAnimationFrame(tick);
    };

    const rafId = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [currentView]);

  if (!isVisible) return null;

  return (
    <>
      {/* Central glow dot */}
      <div 
        ref={cursorDotRef}
        className={`fixed top-0 left-0 w-[6px] h-[6px] rounded-full bg-gold pointer-events-none z-[9999] transition-transform duration-100 ease-out`}
        style={{ transform: 'translate3d(-10px, -10px, 0)' }}
      />
    </>
  );
};