import React, { useEffect, useState, useRef } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface CinematicTextProps {
  text: string;
  visible: boolean;
}

const CinematicText: React.FC<CinematicTextProps> = ({ text, visible }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chars = containerRef.current.querySelectorAll('.cinematic-char');
    if (chars.length === 0) return;

    if (visible) {
      // Reset starting values
      gsap.killTweensOf(chars);
      gsap.set(chars, { opacity: 0, filter: 'blur(10px)', y: 15, scale: 0.9 });
      
      // Animate characters in: staggered fade, de-blur, scale, slide up
      gsap.to(chars, {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        scale: 1,
        stagger: 0.035,
        duration: 0.8,
        ease: 'power3.out',
      });
    } else {
      // Animate characters out: staggered fade out, re-blur, drift up
      gsap.killTweensOf(chars);
      gsap.to(chars, {
        opacity: 0,
        filter: 'blur(8px)',
        y: -15,
        scale: 1.05,
        stagger: 0.015,
        duration: 0.5,
        ease: 'power2.inOut',
      });
    }
  }, [text, visible]);

  // Split text into words, then split words into characters
  const words = text.split(' ');

  return (
    <div ref={containerRef} className="flex flex-wrap justify-center items-center gap-y-2 max-w-xl mx-auto">
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="inline-block whitespace-nowrap mx-2">
          {word.split('').map((char, charIdx) => (
            <span
              key={charIdx}
              className="cinematic-char inline-block text-white font-display text-2xl sm:text-3.5xl font-light tracking-[0.14em] select-text"
              style={{ opacity: 0, filter: 'blur(10px)', display: 'inline-block' }}
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
};

export const IntroCinematic: React.FC = () => {
  const { setView } = useView();
  const { playSound, playTrack } = useAudio();

  const [slideIndex, setSlideIndex] = useState(0);
  const [showHappyBirthday, setShowHappyBirthday] = useState(false);
  const [slideVisible, setSlideVisible] = useState(false);

  const starfieldRef = useRef<HTMLDivElement | null>(null);

  const textSequence = [
    "Every birthday...",
    "...someone receives a gift.",
    "But...",
    "Some gifts...",
    "...cannot fit inside a box.",
    "I wanted to build something...",
    "...that stays with you...",
    "...even after today."
  ];

  // 1. Starfield animation
  useEffect(() => {
    const starfield = starfieldRef.current;
    if (!starfield) return;

    const starCount = 450; // Increased quantity of coming stars
    const stars: HTMLDivElement[] = [];
    const colors = ['#F7F7F7', '#E9C874', '#93C5FD', '#C7D2FE', '#FBCFE8']; // White, Gold, soft blue, indigo, soft pink

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full';
      
      star.style.left = '50%';
      star.style.top = '50%';
      
      const x = (Math.random() - 0.5) * 3500;
      const y = (Math.random() - 0.5) * 3500;
      const z = Math.random() * 2000;
      
      // Randomly assign colors (mostly white/gold/light-blue)
      const colorRand = Math.random();
      let color = colors[0]; // white
      if (colorRand > 0.85) color = colors[1]; // gold
      else if (colorRand > 0.70) color = colors[2]; // soft blue
      else if (colorRand > 0.55) color = colors[3]; // indigo
      
      star.style.backgroundColor = color;
      
      const size = Math.random() * 2.2 + 0.4;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      // Add subtle glow to larger stars or gold/indigo stars
      if (size > 1.8 || color === '#E9C874') {
        star.style.boxShadow = `0 0 8px ${color}, 0 0 12px ${color}`;
      }
      
      star.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
      
      starfield.appendChild(star);
      stars.push(star);

      // Vary duration to make them fly at different speeds
      const duration = Math.random() * 6 + 3;

      gsap.to(star, {
        z: '+=2000',
        duration: duration,
        repeat: -1,
        ease: 'none',
        modifiers: {
          z: (zValue) => {
            let floatZ = parseFloat(zValue);
            if (floatZ > 2000) floatZ -= 2000;
            star.style.transform = `translate3d(${x}px, ${y}px, ${floatZ}px)`;
            
            // Fade in as it starts in the distance (floatZ near 0), fade out as it approaches/passes viewer (floatZ near 2000)
            let opacity = 1;
            if (floatZ < 400) {
              opacity = floatZ / 400; // fade in from distance
            } else if (floatZ > 1600) {
              opacity = (2000 - floatZ) / 400; // fade out near viewer
            }
            star.style.opacity = `${opacity}`;
            return `${floatZ}px`;
          }
        }
      });
    }

    return () => {
      stars.forEach(s => gsap.killTweensOf(s));
      if (starfield) {
        starfield.innerHTML = '';
      }
    };
  }, []);

  // 2. React-controlled Slideshow cycles
  useEffect(() => {
    let active = true;
    let timerId: number;
    let index = 0;

    const run = () => {
      if (!active) return;
      
      if (index < textSequence.length) {
        setSlideVisible(true);

        // Slide stays visible for 2.5s, then fades out
        timerId = window.setTimeout(() => {
          if (!active) return;
          setSlideVisible(false);

          // Delay next slide by 0.7s to allow fade-out animation to finish
          timerId = window.setTimeout(() => {
            if (!active) return;
            index++;
            setSlideIndex(index);
            run();
          }, 700);
        }, 2500);
      } else {
        if (!active) return;
        setShowHappyBirthday(true);
        playSound('reveal');
      }
    };

    // Delay start of slideshow
    timerId = window.setTimeout(run, 500);

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, []);

  const handleStart = () => {
    playSound('click');
    playTrack(1);
    setView('SCROLL');
  };

  const handleSkip = () => {
    playSound('click');
    localStorage.setItem('birthday_intro_completed', 'true');
    setView('HOME');
  };

  return (
    <div className="fixed inset-0 bg-bg z-50 flex items-center justify-center select-none overflow-hidden">
      
      {/* Skip button absolute overlay */}
      <button 
        onClick={handleSkip}
        className="clickable absolute top-8 right-8 z-30 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-gray hover:text-white hover:border-gold hover:bg-gold/10 transition-all duration-300 shadow-md backdrop-blur-md cursor-pointer select-none"
      >
        Skip Intro →
      </button>

      {/* 3D Stars background */}
      <div 
        ref={starfieldRef} 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ perspective: '800px' }}
      />

      {/* Floating Fireflies */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-75">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-2 h-2 rounded-full bg-gold/50 blur-[3px] animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-20 text-center max-w-2xl px-6 w-full flex flex-col items-center">
        {!showHappyBirthday ? (
          <CinematicText 
            text={textSequence[Math.min(slideIndex, textSequence.length - 1)]}
            visible={slideVisible}
          />
        ) : (
          <div className="flex flex-col items-center animate-scale-up">
            <h1 className="text-4xl sm:text-7xl font-display font-bold tracking-wider text-white glow-text-gold mb-6 select-text">
              🎉 Happy Birthday
            </h1>
            <p className="text-gold font-sans font-light tracking-[0.25em] text-sm uppercase mb-12 animate-pulse select-text">
              Let's explore your digital universe
            </p>
            <button 
              onClick={handleStart}
              className="clickable group flex items-center gap-3 px-10 py-4 bg-accent/25 border border-gold hover:border-white rounded-full text-white font-sans text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:bg-gold hover:text-bg hover:shadow-[0_0_30px_rgba(233,200,116,0.6)] active:scale-95 cursor-pointer select-none"
            >
              <span>Begin the Journey</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};