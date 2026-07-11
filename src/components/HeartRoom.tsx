import React, { useEffect, useState, useRef } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface ChapterLetter {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

// Falling Sakura Petals Component
const SakuraPetals: React.FC = () => {
  const petals = [
    // Foreground (blurred, fast, z-index 30)
    { id: 1, size: 18, left: '5%', delay: '0s', duration: '9s', blur: 'blur(2px)', zIndex: 30 },
    { id: 2, size: 22, left: '45%', delay: '3s', duration: '7s', blur: 'blur(3px)', zIndex: 30 },
    { id: 3, size: 20, left: '85%', delay: '1s', duration: '8.5s', blur: 'blur(2.5px)', zIndex: 30 },
    { id: 4, size: 16, left: '25%', delay: '5s', duration: '10s', blur: 'blur(2px)', zIndex: 30 },
    // Background/Midground (crisp, slow, z-index -5)
    { id: 5, size: 8, left: '12%', delay: '2s', duration: '18s', blur: 'none', zIndex: -5 },
    { id: 6, size: 11, left: '30%', delay: '0.5s', duration: '22s', blur: 'none', zIndex: -5 },
    { id: 7, size: 7, left: '50%', delay: '4s', duration: '16s', blur: 'none', zIndex: -5 },
    { id: 8, size: 12, left: '72%', delay: '1.5s', duration: '20s', blur: 'none', zIndex: -5 },
    { id: 9, size: 9, left: '92%', delay: '6s', duration: '24s', blur: 'none', zIndex: -5 },
    { id: 10, size: 10, left: '18%', delay: '8s', duration: '19s', blur: 'none', zIndex: -5 },
    { id: 11, size: 6, left: '38%', delay: '3.5s', duration: '26s', blur: 'none', zIndex: -5 },
    { id: 12, size: 8, left: '60%', delay: '5.5s', duration: '21s', blur: 'none', zIndex: -5 },
    { id: 13, size: 11, left: '80%', delay: '2.5s', duration: '17s', blur: 'none', zIndex: -5 },
    { id: 14, size: 7, left: '95%', delay: '9s', duration: '23s', blur: 'none', zIndex: -5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {petals.map(p => (
        <div
          key={p.id}
          className="sakura-petal"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            filter: p.blur,
            zIndex: p.zIndex,
            top: '-20px',
          }}
        />
      ))}
    </div>
  );
};

// Corner Sakura Branch Silhouette (Purely Atmospheric)
const SakuraBranchSilhouette: React.FC = () => (
  <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none opacity-[0.08] text-[#D05A74] -z-10 overflow-hidden">
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full transform -rotate-12">
      {/* Main branch curve */}
      <path d="M-10,-10 C15,15 25,35 45,45 C65,55 75,75 80,95" strokeLinecap="round" />
      {/* Side twigs */}
      <path d="M15,15 C25,12 35,5 40,-5" strokeLinecap="round" />
      <path d="M25,35 C38,32 50,22 55,10" strokeLinecap="round" />
      <path d="M45,45 C55,50 65,48 70,42" strokeLinecap="round" />
      
      {/* blossoms */}
      <path d="M40,-5 C38,-8 42,-8 40,-5 Z" fill="currentColor" />
      <path d="M15,15 C12,12 18,12 15,15 Z" fill="currentColor" />
      <path d="M55,10 C52,7 58,7 55,10 Z" fill="currentColor" />
      <path d="M70,42 C68,39 72,39 70,42 Z" fill="currentColor" />
    </svg>
  </div>
);

export const HeartRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { playSound } = useAudio();

  const [activeLetterId, setActiveLetterId] = useState<string>('unsaid');
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const typewriterTimerRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const chapters: ChapterLetter[] = [
    {
      id: "unsaid",
      title: "Things I Never Said",
      icon: "💌",
      content: [
        "Sometimes the days pass so quickly that we forget to say the simplest truths.",
        "I want to thank you for simply being you. Your energy and your presence make the world a much brighter place.",
        "You carry a quiet spark inside that inspires people, even when you don't realize it.",
        "This letter is just a small reminder that you are deeply valued, always."
      ]
    },
    {
      id: "truth",
      title: "Truth About Life",
      icon: "🌎",
      content: [
        "Life isn't a race to be won, nor is it a checklist of achievements.",
        "It is a collection of silent mornings, peaceful songs, and the friends we share them with.",
        "Never feel rushed to find all the answers. The journey itself is where the magic is stored.",
        "Just promise me you'll be gentle with yourself on the days when nothing seems to work."
      ]
    },
    {
      id: "weak",
      title: "When You Feel Weak",
      icon: "💪",
      content: [
        "There will be days when the clouds look heavy and your energy runs low.",
        "In those moments, remember that resting is not giving up. It is preparing to soar.",
        "You are much stronger than your doubts. Just take it one breath at a time.",
        "And if the world ever feels too loud, you always have this quiet corner to return to."
      ]
    },
    {
      id: "art",
      title: "Believe In Your Art",
      icon: "🎨",
      content: [
        "Every creation you make carries a piece of your soul in it.",
        "Don't compare your chapter 1 to someone else's chapter 20.",
        "The world needs your unique perspective — the way you see colors, shapes, and stories.",
        "Keep creating. Keep dreaming. Your art matters more than you know."
      ]
    },
    {
      id: "birthday",
      title: "Happy Birthday",
      icon: "🎂",
      content: [
        "Today is your day. A day the universe decided to gift us with you.",
        "I hope this small digital world brought a smile to your face.",
        "You deserve every good thing that comes your way — and so much more.",
        "Happy Birthday, Twin. Here's to another year of being extraordinary. ✦"
      ]
    }
  ];

  const activeLetter = chapters.find(c => c.id === activeLetterId)!;

  useEffect(() => {
    markRoomVisited('heart');
    
    // Entrance animations
    gsap.fromTo('.heart-content', 
      { opacity: 0, scale: 0.96 }, 
      { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }
    );
  }, []);

  // Typewriter effect
  useEffect(() => {
    setTypedLines([]);
    setLineIdx(0);
    setIsComplete(false);

    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
    }

    const content = activeLetter.content;
    let currentLine = 0;
    let currentChar = 0;
    const lines: string[] = [''];

    typewriterTimerRef.current = window.setInterval(() => {
      if (currentLine >= content.length) {
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
        setIsComplete(true);
        return;
      }

      const line = content[currentLine];
      if (currentChar < line.length) {
        lines[currentLine] = line.substring(0, currentChar + 1);
        setTypedLines([...lines]);
        setLineIdx(currentLine);
        currentChar++;

        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      } else {
        currentLine++;
        currentChar = 0;
        if (currentLine < content.length) {
          lines.push('');
        }
      }
    }, 30 + Math.random() * 20);

    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, [activeLetterId]);

  const skipToEnd = () => {
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    setTypedLines([...activeLetter.content]);
    setIsComplete(true);
    playSound('click');
  };

  const handleLetterChange = (id: string) => {
    if (id === activeLetterId) return;
    playSound('click');
    
    const textEl = document.querySelector('.heart-content-body');
    
    if (textEl) {
      const tl = gsap.timeline();
      
      // Tactile slide-out to the left representing removing paper sheet
      tl.to(textEl, {
        opacity: 0,
        x: -24,
        rotation: -1.2,
        filter: 'blur(3px)',
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          setActiveLetterId(id);
        }
      })
      // Sweeping slide-in from the right with a slight opposite tilt
      .fromTo(textEl,
        { 
          opacity: 0, 
          x: 24, 
          rotation: 1.2, 
          filter: 'blur(3px)' 
        },
        { 
          opacity: 1, 
          x: 0, 
          rotation: 0, 
          filter: 'blur(0px)', 
          duration: 0.65, 
          ease: 'power2.out' 
        }
      );
    } else {
      setActiveLetterId(id);
    }
  };

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center py-8 px-4 overflow-hidden"
      style={{ 
        background: 'radial-gradient(circle at 50% 50%, #150E12 0%, #0A0608 100%)',
        color: '#FCE4E6'
      }}
    >
      {/* Falling cherry blossom petals atmosphere */}
      <SakuraPetals />

      {/* Atmospheric corner branch silhouette */}
      <SakuraBranchSilhouette />

      {/* Warm pink vignette glow at the screen edges */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-25"
        style={{
          boxShadow: 'inset 0 0 120px rgba(208, 90, 116, 0.25)',
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(26, 15, 20, 0.4) 100%)'
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full max-w-[70vw] flex items-center justify-between select-none mb-6">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'rgba(252, 228, 230, 0.6)',
            borderColor: 'rgba(255, 183, 197, 0.15)',
            backgroundColor: 'rgba(28, 20, 25, 0.5)',
            backdropFilter: 'blur(8px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFB7C5';
            e.currentTarget.style.borderColor = 'rgba(255, 183, 197, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(252, 228, 230, 0.6)';
            e.currentTarget.style.borderColor = 'rgba(255, 183, 197, 0.15)';
          }}
        >
          ← Home
        </button>

        <h2 
          className="font-serif text-xl tracking-wider select-none flex items-center gap-2 font-bold"
          style={{ 
            color: '#FFB7C5',
            textShadow: '0 0 10px rgba(255, 183, 197, 0.35)'
          }}
        >
          <span className="pulse-sakura text-[#FFB7C5] mr-1">✦</span> The Message
        </h2>

        <div className="flex items-center gap-2">
          {!isComplete && (
            <button
              onClick={skipToEnd}
              className="clickable px-4 py-1.5 rounded-full font-sans text-[10px] tracking-wider uppercase transition-all duration-300 cursor-pointer border"
              style={{ 
                color: '#FFB7C5',
                borderColor: 'rgba(255, 183, 197, 0.25)',
                backgroundColor: 'rgba(255, 183, 197, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 183, 197, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(255, 183, 197, 0.45)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 183, 197, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 183, 197, 0.25)';
              }}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ─── Envelope Tab Navigation ─── */}
      <div className="relative z-10 w-full max-w-[70vw] flex items-end gap-1.5 px-3 mb-[-1px] select-none">
        {chapters.map(ch => {
          const isActive = activeLetterId === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => handleLetterChange(ch.id)}
              className="clickable flex-1 flex items-center justify-center px-4 py-2.5 text-xs font-sans tracking-wide uppercase transition-all duration-300 cursor-pointer rounded-t-xl border-t border-x"
              style={{
                color: isActive ? '#FFB7C5' : 'rgba(252, 228, 230, 0.45)',
                backgroundColor: isActive ? 'rgba(255, 183, 197, 0.08)' : 'rgba(28, 20, 25, 0.65)',
                borderColor: isActive ? 'rgba(255, 183, 197, 0.25)' : 'rgba(255, 183, 197, 0.08)',
                boxShadow: isActive 
                  ? 'inset 0 1px 0 rgba(255,183,197,0.2), 0 -4px 10px rgba(255,183,197,0.04)' 
                  : 'none',
                transform: isActive ? 'translateY(0px)' : 'translateY(2px)',
                borderBottomColor: isActive ? 'transparent' : 'rgba(255, 183, 197, 0.08)',
                zIndex: isActive ? 10 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#FFB7C5';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 183, 197, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 183, 197, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(252, 228, 230, 0.45)';
                  e.currentTarget.style.backgroundColor = 'rgba(28, 20, 25, 0.65)';
                  e.currentTarget.style.borderColor = 'rgba(255, 183, 197, 0.08)';
                }
              }}
            >
              <span className="font-bold text-[10px] tracking-widest">{ch.title}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Letter Content Card ─── */}
      <div 
        className="heart-content relative z-10 w-full max-w-[70vw] min-h-[500px] h-[65vh] flex flex-col"
      >
        {/* Jagged Deckled Paper Background Layer */}
        <div 
          className="absolute inset-0 border"
          style={{
            backgroundColor: 'rgba(28, 20, 25, 0.92)',
            borderColor: 'rgba(255, 183, 197, 0.2)',
            boxShadow: 'inset 0 0 25px rgba(255, 183, 197, 0.12), 0 20px 50px rgba(0, 0, 0, 0.6)',
            filter: 'url(#deckled-edge)',
            borderRadius: '4px',
            zIndex: 0,
          }}
        />

        {/* Paper grain noise overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            mixBlendMode: 'overlay',
            zIndex: 1,
            borderRadius: '4px',
          }}
        />

        {/* Ink-drawn sakura branch flourish in the bottom-right corner */}
        <div className="absolute bottom-6 right-6 w-36 h-36 pointer-events-none opacity-20 text-[#D05A74] z-10">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
            <path d="M100,100 C80,85 70,60 55,50 C40,40 25,35 15,35" strokeLinecap="round" />
            <path d="M70,60 C65,50 68,40 75,35" strokeLinecap="round" />
            <path d="M55,50 C48,42 38,45 32,50" strokeLinecap="round" />
            <circle cx="55" cy="50" r="2" fill="currentColor" />
            <circle cx="75" cy="35" r="1.5" fill="currentColor" />
            <circle cx="32" cy="50" r="1.8" fill="currentColor" />
          </svg>
        </div>

        {/* Actual Scrollable Text Content Container */}
        <div 
          ref={contentRef}
          className="heart-content-body flex-1 relative z-10 p-10 sm:p-16 overflow-y-auto custom-scrollbar flex flex-col"
          style={{ zIndex: 5 }}
        >
          {/* Letter header inside content */}
          <div className="mb-8 pb-4 border-b" style={{ borderColor: 'rgba(255, 183, 197, 0.15)' }}>
            <h3 
              className="font-serif text-2xl font-bold tracking-wide"
              style={{ color: '#FFB7C5' }}
            >
              {activeLetter.title}
            </h3>
          </div>

          {/* Typewriter text with slightly larger font sizes */}
          <div className="space-y-6 select-text">
            {typedLines.map((line, i) => {
              const isCurrentLine = i === lineIdx && !isComplete;
              return (
                <p 
                  key={i} 
                  className={`font-typewriter text-base sm:text-lg md:text-xl leading-[2] tracking-wide
                    ${isCurrentLine ? 'sakura-cursor' : ''}`}
                  style={{ 
                    color: '#FCE4E6',
                    fontFamily: "'Special Elite', cursive",
                    textShadow: '0 0 1px rgba(252, 228, 230, 0.2)'
                  }}
                >
                  {/* Render characters as individual spans for custom reveal drift */}
                  {line.split('').map((char, charIdx) => (
                    <span 
                      key={charIdx} 
                      className="animate-char-reveal"
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </p>
              );
            })}
          </div>

          {/* Completion indicator */}
          {isComplete && (
            <div className="mt-12 pt-6 border-t text-center mt-auto" style={{ borderColor: 'rgba(255, 183, 197, 0.15)' }}>
              <span className="text-2xl text-[#FFB7C5] pulse-sakura">✦</span>
              <p 
                className="font-sans text-[10px] tracking-widest uppercase mt-2.5"
                style={{ color: 'rgba(252, 228, 230, 0.5)' }}
              >
                Letter complete
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SVG Filters for Deckled Edge */}
      <svg className="hidden" style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <filter id="deckled-edge">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};