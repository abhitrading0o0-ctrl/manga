import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface ChapterLetter {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

export const HeartRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { playSound } = useAudio();

  const [activeLetterId, setActiveLetterId] = useState<string>('unsaid');
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
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
    gsap.fromTo('.heart-content', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power3.out' });
  }, []);

  // Typewriter effect
  useEffect(() => {
    // Reset state when switching letters
    setTypedLines([]);
    setLineIdx(0);
    setCharIdx(0);
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
        // Done
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
        setIsComplete(true);
        return;
      }

      const line = content[currentLine];
      if (currentChar < line.length) {
        lines[currentLine] = line.substring(0, currentChar + 1);
        setTypedLines([...lines]);
        setLineIdx(currentLine);
        setCharIdx(currentChar);
        currentChar++;

        // Scroll to bottom
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      } else {
        // Move to next line
        currentLine++;
        currentChar = 0;
        if (currentLine < content.length) {
          lines.push('');
        }
      }
    }, 35 + Math.random() * 20); // Slight timing variation for realism

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
    playSound('click');
    setActiveLetterId(id);
  };

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center py-8 px-4 overflow-hidden paper-texture"
      style={{ backgroundColor: 'var(--room-bg, #FDF8F0)', color: 'var(--room-text, #3D2024)' }}
    >
      {/* Subtle warm overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(196, 154, 60, 0.05) 0%, transparent 70%)'
        }}
      />

      {/* Header */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between select-none mb-6">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'var(--room-text-muted, #8B6B6E)',
            borderColor: 'var(--room-card-border, rgba(107, 45, 62, 0.12))',
          }}
        >
          ← Home
        </button>

        <h2 
          className="font-serif text-lg font-bold tracking-wider"
          style={{ color: 'var(--room-accent, #6B2D3E)' }}
        >
          ♡ The Message
        </h2>

        <div className="flex items-center gap-2">
          {!isComplete && (
            <button
              onClick={skipToEnd}
              className="clickable px-3 py-1.5 rounded-full font-sans text-[10px] tracking-wider uppercase transition-all cursor-pointer border"
              style={{ 
                color: 'var(--room-text-muted, #8B6B6E)',
                borderColor: 'var(--room-card-border, rgba(107, 45, 62, 0.12))',
              }}
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* ─── Envelope Tab Navigation ─── */}
      <div className="relative z-10 w-full max-w-2xl flex items-end gap-1 px-2 mb-0">
        {chapters.map(ch => (
          <button
            key={ch.id}
            onClick={() => handleLetterChange(ch.id)}
            className={`envelope-tab ${activeLetterId === ch.id ? 'active' : ''}`}
          >
            <span className="mr-1.5">{ch.icon}</span>
            <span className="hidden sm:inline">{ch.title}</span>
          </button>
        ))}
      </div>

      {/* ─── Letter Content ─── */}
      <div 
        ref={contentRef}
        className="heart-content relative z-10 w-full max-w-2xl rounded-b-xl rounded-tr-xl p-8 sm:p-12 min-h-[400px] max-h-[60vh] overflow-y-auto custom-scrollbar border"
        style={{
          backgroundColor: 'var(--room-card-bg, rgba(253, 248, 240, 0.9))',
          borderColor: 'var(--room-card-border, rgba(107, 45, 62, 0.12))',
          boxShadow: '0 10px 40px rgba(42, 31, 20, 0.08)'
        }}
      >
        {/* Letter header */}
        <div className="mb-8 pb-4 border-b" style={{ borderColor: 'var(--room-card-border)' }}>
          <h3 
            className="font-serif text-xl font-bold tracking-wide mb-1"
            style={{ color: 'var(--room-accent, #6B2D3E)' }}
          >
            {activeLetter.icon} {activeLetter.title}
          </h3>
          <p 
            className="font-sans text-[10px] tracking-widest uppercase"
            style={{ color: 'var(--room-text-muted, #8B6B6E)' }}
          >
            A letter for you
          </p>
        </div>

        {/* Typewriter text */}
        <div className="space-y-4">
          {typedLines.map((line, i) => (
            <p 
              key={i} 
              className={`font-typewriter text-sm sm:text-base leading-[1.8] tracking-wide
                ${i === lineIdx && !isComplete ? 'typewriter-cursor' : ''}`}
              style={{ 
                color: 'var(--room-text, #3D2024)',
                fontFamily: "'Special Elite', cursive"
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Completion indicator */}
        {isComplete && (
          <div className="mt-8 pt-4 border-t text-center" style={{ borderColor: 'var(--room-card-border)' }}>
            <span className="text-2xl">✦</span>
            <p 
              className="font-sans text-[10px] tracking-widest uppercase mt-2"
              style={{ color: 'var(--room-text-muted, #8B6B6E)' }}
            >
              Letter complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
};