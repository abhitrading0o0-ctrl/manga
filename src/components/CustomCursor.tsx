import React, { useEffect, useState, useRef } from 'react';
import { useView } from '../context/ViewContext';
import gsap from 'gsap';

export const CustomCursor: React.FC = () => {
  const { currentView } = useView();

  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
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

    // Right-click and context button verification guards (only trigger left click)
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) setIsClicked(true);
    };
    
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) setIsClicked(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Dynamic hover listeners for links and buttons
    const addHoverListeners = () => {
      const interactives = document.querySelectorAll('button, a, [role="button"], input, select, textarea, .clickable');
      interactives.forEach(el => {
        el.addEventListener('mouseenter', () => setIsHovered(true));
        el.addEventListener('mouseleave', () => setIsHovered(false));
      });
    };

    // Periodically query DOM to attach hovers on newly rendered components
    const interval = setInterval(addHoverListeners, 1000);

    // Smooth Glide Loop using RequestAnimationFrame
    const tick = () => {
      // Lerp calculations (0.2 factor for dot, 0.1 for ring delay)
      posDot.x += (mouse.x - posDot.x) * 0.22;
      posDot.y += (mouse.y - posDot.y) * 0.22;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${posDot.x - 3}px, ${posDot.y - 3}px, 0)`;
      }

      requestAnimationFrame(tick);
    };
    
    const rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      clearInterval(interval);
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