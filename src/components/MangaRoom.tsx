import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface MangaPage {
  num: number;
  type: 'cover' | 'story' | 'end' | 'locked';
  image?: string;
  panels?: {
    text: string;
    speaker?: string;
    style: string;
  }[];
  notes?: string;
}

export const MangaRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { playSound } = useAudio();

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('manga_bookmark');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [flippingPage, setFlippingPage] = useState<number | null>(null);
  const [showToc, setShowToc] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);

  const pages: MangaPage[] = [
    {
      num: 0,
      type: 'cover',
      image: '/assets/manga-cover.jpg'
    },
    {
      num: 1,
      type: 'story',
      panels: [
        {
          text: "In the silent depths of the digital cosmos, a star began to burn in a unique color...",
          style: "col-span-2 row-span-1"
        },
        {
          text: "Wait, is this... a site built just for me?",
          speaker: "Her",
          style: "col-span-1 row-span-1"
        },
        {
          text: "Every pixel, every sound, every line of code was crafted to make you smile today.",
          speaker: "Creator",
          style: "col-span-1 row-span-1"
        }
      ]
    },
    {
      num: 2,
      type: 'story',
      panels: [
        {
          text: "The twin star shone brighter every day, carving its own path across the sky.",
          style: "col-span-2 row-span-1"
        },
        {
          text: "You never needed anyone's permission to be extraordinary.",
          speaker: "Narrator",
          style: "col-span-2 row-span-1"
        }
      ]
    },
    {
      num: 3,
      type: 'story',
      panels: [
        {
          text: "And in the darkest hour, when the world seemed too heavy...",
          style: "col-span-1 row-span-2"
        },
        {
          text: "She remembered: every constellation was once scattered dust.",
          speaker: "Her",
          style: "col-span-1 row-span-1"
        },
        {
          text: "The universe doesn't rush, and neither should you.",
          speaker: "Creator",
          style: "col-span-1 row-span-1"
        }
      ]
    },
    {
      num: 4,
      type: 'story',
      panels: [
        {
          text: "This chapter doesn't end here. Your story is still being written, one beautiful day at a time.",
          style: "col-span-2 row-span-1"
        },
        {
          text: "Happy Birthday, Twin. The best is yet to come. ✦",
          speaker: "Creator",
          style: "col-span-2 row-span-1"
        }
      ]
    },
    {
      num: 5,
      type: 'end',
      notes: "End of Part 1 — More chapters coming soon..."
    },
    {
      num: 6,
      type: 'locked'
    }
  ];

  useEffect(() => {
    markRoomVisited('manga');
  }, []);

  // Save bookmark whenever page changes
  useEffect(() => {
    localStorage.setItem('manga_bookmark', currentPage.toString());
  }, [currentPage]);

  // Entrance animation
  useEffect(() => {
    gsap.fromTo('.manga-header', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    gsap.fromTo('.manga-book', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' });
  }, []);

  // Panel stagger reveal on page change
  useEffect(() => {
    gsap.fromTo('.manga-panel', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, delay: 0.3, ease: 'power3.out' }
    );
  }, [currentPage]);

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum < 0 || pageNum >= pages.length) return;
    if (pages[pageNum].type === 'locked') return;

    setFlippingPage(currentPage);
    playSound('pageFlip');

    setTimeout(() => {
      setCurrentPage(pageNum);
      setFlippingPage(null);
    }, 400);
  }, [currentPage, pages.length, playSound]);

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Drag/swipe handling
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 60) {
      if (diff < 0) nextPage();
      else prevPage();
    }
    dragStartX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage]);

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const currentPageData = pages[currentPage];

  const renderPageContent = () => {
    if (!currentPageData) return null;

    switch (currentPageData.type) {
      case 'cover':
        return (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg">
            {currentPageData.image ? (
              <img 
                src={currentPageData.image} 
                alt="Manga Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <span className="text-6xl">📖</span>
                <h3 className="text-2xl font-bold text-white font-display tracking-wider">The Story</h3>
                <p className="text-gray text-sm">A manga crafted for you</p>
              </div>
            )}
          </div>
        );

      case 'story':
        return (
          <div className="w-full h-full p-6 sm:p-8 grid grid-cols-2 grid-rows-2 gap-3 bg-[#f7f7f7]">
            {currentPageData.panels?.map((panel, i) => (
              <div 
                key={i} 
                className={`manga-panel ${panel.style} border border-black/10 rounded-md p-4 flex flex-col justify-center relative overflow-hidden`}
                style={{ backgroundColor: '#fefefe' }}
              >
                {panel.speaker && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2 font-sans">
                    {panel.speaker}
                  </span>
                )}
                <p className="text-sm sm:text-base leading-relaxed text-black/80 font-sans font-light">
                  {panel.text}
                </p>
                {/* Screentone dots in corner */}
                <div className="absolute bottom-0 right-0 w-16 h-16 opacity-5 screentone-bg" />
              </div>
            ))}
          </div>
        );

      case 'end':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#f7f7f7] p-8">
            <span className="text-5xl">✦</span>
            <h3 className="text-xl font-bold text-black/80 font-serif tracking-wider text-center">
              End of Part 1
            </h3>
            <p className="text-sm text-black/50 font-sans font-light text-center max-w-xs">
              {currentPageData.notes || "More chapters coming soon..."}
            </p>
            <div className="w-16 h-[1px] bg-black/10" />
          </div>
        );

      case 'locked':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#1a1a1a] relative">
            {/* Wax seal overlay */}
            <div className="w-32 h-32 wax-seal-overlay flex items-center justify-center">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-lg font-bold text-white/60 font-serif tracking-wider">
              Sealed Chapter
            </h3>
            <p className="text-xs text-white/30 font-sans font-light text-center max-w-xs">
              This part will be unlocked in a future update...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center py-8 px-4 overflow-hidden screentone-bg screentone-animated"
      style={{ backgroundColor: '#111111', color: '#F7F7F7' }}
    >
      {/* Dramatic vignette */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Header */}
      <div className="manga-header relative z-10 w-full max-w-4xl flex items-center justify-between select-none mb-6">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-white/60 hover:text-white hover:border-white/30 transition-all duration-300 cursor-pointer"
        >
          ← Back
        </button>

        <h2 className="text-white font-serif text-lg font-bold tracking-widest">
          📖 The Story
        </h2>

        {/* Table of contents toggle */}
        <button 
          onClick={() => setShowToc(!showToc)}
          className="clickable px-4 py-2 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-white/60 hover:text-white hover:border-white/30 transition-all duration-300 cursor-pointer"
        >
          {showToc ? '✕ Close' : '≡ Parts'}
        </button>
      </div>

      {/* Table of Contents Side Panel */}
      {showToc && (
        <div className="relative z-20 w-full max-w-xs mb-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4">
          <h4 className="text-white/80 font-serif text-sm font-bold mb-3 tracking-wider">Chapters</h4>
          {pages.map((page, i) => (
            <button
              key={i}
              onClick={() => { goToPage(i); setShowToc(false); }}
              disabled={page.type === 'locked'}
              className={`clickable w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all cursor-pointer mb-1
                ${currentPage === i ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                ${page.type === 'locked' ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              {page.type === 'cover' ? '📖 Cover' : 
               page.type === 'end' ? '✦ End of Part 1' :
               page.type === 'locked' ? '🔒 Sealed' :
               `Page ${page.num}`}
              {currentPage === i && ' ←'}
            </button>
          ))}
        </div>
      )}

      {/* ─── 3D Book ─── */}
      <div 
        ref={bookRef}
        className="manga-book relative z-10 w-full max-w-2xl aspect-[3/4] max-h-[70vh] manga-book-container"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div 
          className={`w-full h-full relative rounded-lg overflow-hidden transition-transform duration-500
            ${flippingPage !== null ? 'manga-page flipped' : ''}`}
          style={{
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.3)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Current page content */}
          {renderPageContent()}

          {/* Page edge shadows */}
          <div className="absolute inset-y-0 left-0 w-8 pointer-events-none page-shadow-left opacity-40" />
          <div className="absolute inset-y-0 right-0 w-8 pointer-events-none page-shadow-right opacity-40" />
        </div>
      </div>

      {/* ─── Navigation Controls ─── */}
      <div className="relative z-10 flex items-center gap-6 mt-6 select-none">
        <button 
          onClick={prevPage}
          disabled={currentPage === 0}
          className="clickable w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ‹
        </button>

        <span className="font-sans text-xs text-white/40 tracking-widest">
          {currentPage + 1} / {pages.length}
        </span>

        <button 
          onClick={nextPage}
          disabled={currentPage >= pages.length - 1 || pages[currentPage + 1]?.type === 'locked'}
          className="clickable w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* Swipe hint */}
      <p className="relative z-10 mt-4 font-sans text-[10px] text-white/20 tracking-widest uppercase select-none">
        Swipe or drag to turn pages • Arrow keys supported
      </p>
    </div>
  );
};