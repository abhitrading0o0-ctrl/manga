import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';

interface MangaPage {
  num: number;
  type: 'cover' | 'story' | 'end' | 'locked';
  image?: string;
  notes?: string;
}

export const MangaRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { playSound } = useAudio();

  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('manga_bookmark');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [showToc, setShowToc] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  
  // Drag/swipe states
  const dragStartX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pages: MangaPage[] = [
    {
      num: 0,
      type: 'cover',
      image: '/manga/Black and Beige Simple Echoes Story Book Cover .jpg'
    },
    {
      num: 1,
      type: 'story',
      image: '/manga/1.jpeg'
    },
    {
      num: 2,
      type: 'story',
      image: '/manga/2.jpeg'
    },
    {
      num: 3,
      type: 'story',
      image: '/manga/3.jpeg'
    },
    {
      num: 4,
      type: 'story',
      image: '/manga/4.jpeg'
    },
    {
      num: 5,
      type: 'story',
      image: '/manga/5.jpeg'
    },
    {
      num: 6,
      type: 'story',
      image: '/manga/6.jpeg'
    },
    {
      num: 7,
      type: 'story',
      image: '/manga/7.jpeg'
    },
    {
      num: 8,
      type: 'story',
      image: '/manga/8.jpeg'
    },
    {
      num: 9,
      type: 'story',
      image: '/manga/9.jpeg'
    },
    {
      num: 10,
      type: 'story',
      image: '/manga/10.jpeg'
    },
    {
      num: 11,
      type: 'story',
      image: '/manga/11.jpeg'
    },
    {
      num: 12,
      type: 'story',
      image: '/manga/13.jpeg'
    },
    {
      num: 13,
      type: 'story',
      image: '/manga/14.jpeg'
    },
    {
      num: 14,
      type: 'story',
      image: '/manga/15.jpeg'
    },
    {
      num: 15,
      type: 'story',
      image: '/manga/16.jpeg'
    },
    {
      num: 16,
      type: 'story',
      image: '/manga/17.jpeg'
    },
    {
      num: 17,
      type: 'story',
      image: '/manga/18.jpeg'
    },
    {
      num: 18,
      type: 'story',
      image: '/manga/19.jpeg'
    },
    {
      num: 19,
      type: 'story',
      image: '/manga/20.jpeg'
    },
    {
      num: 20,
      type: 'story',
      image: '/manga/21.jpeg'
    },
    {
      num: 21,
      type: 'story',
      image: '/manga/22.jpeg'
    },
    {
      num: 22,
      type: 'story',
      image: '/manga/23.jpeg'
    },
    {
      num: 23,
      type: 'story',
      image: '/manga/24.jpeg'
    },
    {
      num: 24,
      type: 'story',
      image: '/manga/25.jpeg'
    },
    {
      num: 25,
      type: 'story',
      image: '/manga/26.jpeg'
    },
    {
      num: 26,
      type: 'story',
      image: '/manga/27.jpeg'
    },
    {
      num: 27,
      type: 'story',
      image: '/manga/28.jpeg'
    },
    {
      num: 28,
      type: 'story',
      image: '/manga/29.jpeg'
    },
    {
      num: 29,
      type: 'story',
      image: '/manga/30.jpeg'
    },
    {
      num: 30,
      type: 'story',
      image: '/manga/31.jpeg'
    },
    {
      num: 31,
      type: 'story',
      image: '/manga/32.jpeg'
    },
    {
      num: 32,
      type: 'story',
      image: '/manga/33.jpeg'
    },
    {
      num: 33,
      type: 'story',
      image: '/manga/34.jpeg'
    },
    {
      num: 34,
      type: 'story',
      image: '/manga/34 (2).jpeg'
    },
    {
      num: 35,
      type: 'story',
      image: '/manga/35.jpeg'
    },
    {
      num: 36,
      type: 'story',
      image: '/manga/35 (2).jpeg'
    },
    {
      num: 37,
      type: 'story',
      image: '/manga/36.jpeg'
    },
    {
      num: 38,
      type: 'story',
      image: '/manga/37.jpeg'
    },
    {
      num: 39,
      type: 'story',
      image: '/manga/38.jpeg'
    },
    {
      num: 40,
      type: 'story',
      image: '/manga/38 (2).jpeg'
    },
    {
      num: 41,
      type: 'story',
      image: '/manga/39.jpeg'
    },
    {
      num: 42,
      type: 'story',
      image: '/manga/40.jpeg'
    },
    {
      num: 43,
      type: 'story',
      image: '/manga/41.jpeg'
    },
    {
      num: 44,
      type: 'story',
      image: '/manga/42.jpeg'
    },
    {
      num: 45,
      type: 'story',
      image: '/manga/43.jpeg'
    },
    {
      num: 46,
      type: 'story',
      image: '/manga/44.jpeg'
    },
    {
      num: 47,
      type: 'story',
      image: '/manga/55.jpeg'
    },
    {
      num: 48,
      type: 'story',
      image: '/manga/56.jpeg'
    },
    {
      num: 49,
      type: 'story',
      image: '/manga/57.jpeg'
    },
    {
      num: 50,
      type: 'story',
      image: '/manga/58.jpeg'
    },
    {
      num: 51,
      type: 'story',
      image: '/manga/59.jpeg'
    },
    {
      num: 52,
      type: 'story',
      image: '/manga/60.jpeg'
    },
    {
      num: 53,
      type: 'story',
      image: '/manga/61.jpeg'
    },
    {
      num: 54,
      type: 'story',
      image: '/manga/62.jpeg'
    },
    {
      num: 55,
      type: 'story',
      image: '/manga/63.jpeg'
    },
    {
      num: 56,
      type: 'story',
      image: '/manga/64.jpeg'
    },
    {
      num: 57,
      type: 'story',
      image: '/manga/65.jpeg'
    },
    {
      num: 58,
      type: 'story',
      image: '/manga/last page.jpeg'
    },
    {
      num: 59,
      type: 'end',
      notes: "End of Part 1 — More chapters coming soon..."
    },
    {
      num: 60,
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

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum < 0 || pageNum >= pages.length) return;
    if (pages[pageNum].type === 'locked') return;

    setCurrentPage(pageNum);
    playSound('pageFlip');
  }, [pages.length, playSound]);

  const nextPage = () => {
    if (currentPage >= pages.length - 1 || pages[currentPage + 1]?.type === 'locked') return;
    setCurrentPage(prev => prev + 1);
    playSound('pageFlip');
  };

  const prevPage = () => {
    if (currentPage === 0) return;
    setCurrentPage(prev => prev - 1);
    playSound('pageFlip');
  };

  // Drag/swipe handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only drag with left click
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    const diff = e.clientX - dragStartX.current;
    
    // Dampen drag boundaries
    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === pages.length - 1 || pages[currentPage + 1]?.type === 'locked';
    
    if ((isFirstPage && diff > 0) || (isLastPage && diff < 0)) {
      setDragOffset(diff * 0.25);
    } else {
      setDragOffset(diff);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging || dragStartX.current === null) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const diff = e.clientX - dragStartX.current;
    const threshold = window.innerWidth < 640 ? 80 : 120;

    const isFirstPage = currentPage === 0;
    const isLastPage = currentPage === pages.length - 1 || pages[currentPage + 1]?.type === 'locked';

    setIsDragging(false);
    dragStartX.current = null;

    if (Math.abs(diff) > threshold) {
      if (diff < 0 && !isLastPage) {
        setCurrentPage(prev => prev + 1);
        playSound('pageFlip');
      } else if (diff > 0 && !isFirstPage) {
        setCurrentPage(prev => prev - 1);
        playSound('pageFlip');
      }
    }
    
    setDragOffset(0);
  };

  const snapBack = (e: React.PointerEvent) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      dragStartX.current = null;
      setDragOffset(0);
    }
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

  const handleDownloadZip = () => {
    playSound('click');
    const link = document.createElement('a');
    link.href = '/manga/twin_zolds_world_part1.zip';
    link.download = 'twin_zolds_world_part1.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPageContentForIndex = (idx: number) => {
    const pageData = pages[idx];
    if (!pageData) return null;

    switch (pageData.type) {
      case 'cover':
        return (
          <div className="w-full h-full relative flex items-center justify-center bg-[#f6f5f0]">
            <div className="paper-grain-overlay" />
            <div className="manga-hand-inked-frame" />

            {pageData.image && (
              <img 
                src={pageData.image} 
                alt="Manga Cover" 
                className="w-[calc(100%-14px)] h-[calc(100%-14px)] object-contain relative z-10"
                draggable={false}
              />
            )}

            <div className="manga-page-corner-tab">
              COVER
            </div>
          </div>
        );

      case 'story':
        return (
          <div className="w-full h-full relative flex items-center justify-center bg-[#f6f5f0]">
            <div className="paper-grain-overlay" />
            <div className="manga-hand-inked-frame" />

            {pageData.image && (
              <img 
                src={pageData.image} 
                alt={`Manga Page ${pageData.num}`} 
                className="w-[calc(100%-14px)] h-[calc(100%-14px)] object-contain relative z-10"
                draggable={false}
              />
            )}

            <div className="manga-page-corner-tab">
              PAGE {pageData.num}
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#f6f5f0] p-8 relative overflow-hidden">
            <div className="paper-grain-overlay" />
            <div className="absolute inset-0 manga-screentone-texture opacity-30 pointer-events-none" />
            <div className="manga-hand-inked-frame" />

            <div className="relative z-10 flex flex-col items-center select-none text-center">
              <div className="text-[12px] font-sans font-black tracking-[0.3em] uppercase text-black/50 mb-2">
                Chapter Cleared
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight uppercase text-black font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)] relative px-6 py-2 border-y-4 border-black inline-block">
                End of Part 1
              </h2>
            </div>
            
            <div className="absolute bottom-8 right-8 z-10 transform rotate-[-3deg] border-2 border-dashed border-black/40 p-3 bg-[#f6f5f0] max-w-[160px] shadow-sm">
              <p className="font-serif text-[10px] italic text-black/60 leading-tight">
                * More chapters coming soon...
              </p>
            </div>
          </div>
        );

      case 'locked':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-[#1a1a1a] relative">
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
    <div className={`min-h-screen relative flex flex-col items-center justify-between overflow-hidden manga-reader-container transition-all duration-300 ${isFullScreen ? 'py-4 px-2' : 'py-8 px-4'}`}
      style={{ color: '#F7F7F7' }}
    >
      {/* Halftone Screentone Texture */}
      <div className="fixed inset-0 manga-screentone-texture manga-screentone-animated pointer-events-none z-0" />
      
      {/* Ambient Speedlines */}
      <div className="fixed inset-0 manga-speedlines-ambient pointer-events-none z-0" />

      {/* Dramatic vignette */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)'
        }}
      />

      {/* Header */}
      <div className="manga-header relative z-10 w-full max-w-4xl flex items-center justify-between select-none mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackToIsland}
            className="clickable flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-white/60 hover:text-white hover:border-white/30 transition-all duration-300 cursor-pointer"
          >
            ← Back
          </button>

          <button 
            onClick={handleDownloadZip}
            className="clickable flex items-center gap-1.5 px-4 py-2 bg-[#D4756B]/20 border border-[#D4756B]/30 rounded-full font-sans text-xs tracking-widest uppercase text-[#D4756B] hover:bg-[#D4756B]/35 hover:text-white transition-all duration-300 cursor-pointer"
            title="Download complete manga chapter as ZIP"
          >
            📥 Download
          </button>
        </div>

        <h2 className="text-[#D4756B] manga-title-bold manga-inked-text text-xl sm:text-2xl font-black tracking-wider drop-shadow-md hidden md:block">
          📖 The Story
        </h2>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="clickable px-4 py-2 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-white/60 hover:text-white hover:border-white/30 transition-all duration-300 cursor-pointer"
          >
            {isFullScreen ? '✕ Normal' : '🔍 Fullscreen'}
          </button>

          <button 
            onClick={() => setShowToc(!showToc)}
            className="clickable px-4 py-2 bg-white/5 border border-white/10 rounded-full font-sans text-xs tracking-widest uppercase text-white/60 hover:text-white hover:border-white/30 transition-all duration-300 cursor-pointer"
          >
            {showToc ? '✕ Close' : '≡ Parts'}
          </button>
        </div>
      </div>

      {/* Table of Contents Side Panel */}
      {showToc && (
        <div className="relative z-20 w-full max-w-md mb-6 bg-[#0f0c0d] border-4 border-double border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="text-center mb-4">
            <h4 className="text-white font-mono text-lg font-black tracking-widest uppercase relative inline-block pb-1 border-b-2 border-[#D4756B]">
              Volume Index
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Part 1 */}
            <button
              onClick={() => { goToPage(0); setShowToc(false); }}
              className="group relative flex flex-col items-center p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#D4756B]/50 transition-all text-center cursor-pointer"
            >
              <div className="w-20 h-28 bg-[#1f1d1e] rounded border border-white/10 overflow-hidden mb-2 relative">
                <img src="/manga/Black and Beige Simple Echoes Story Book Cover .jpg" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-2 right-2 px-1 py-0.5 rounded text-[6px] tracking-wider uppercase font-bold visited-manga-stamp z-20 scale-75">
                  ACTIVE
                </div>
              </div>
              <span className="text-white font-mono text-xs font-bold tracking-wider">PART I: THE STORY</span>
              <span className="text-[#B99C9F] text-[9px] mt-1 font-serif italic">Manga Panels</span>
            </button>

            {/* Part 2 (Locked) */}
            <div
              className="relative flex flex-col items-center p-3 rounded-xl border border-white/5 bg-white/5 opacity-50 text-center cursor-not-allowed"
            >
              <div className="w-20 h-28 bg-[#1a1314] rounded border border-white/5 overflow-hidden mb-2 flex items-center justify-center relative">
                <span className="text-2xl text-white/20">🔒</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-red-500/50 bg-red-950/40 text-red-500 font-mono text-[8px] font-black uppercase flex items-center justify-center tracking-widest transform rotate-12 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                    SEALED
                  </div>
                </div>
              </div>
              <span className="text-white/40 font-mono text-xs font-bold tracking-wider">PART II: LATER</span>
              <span className="text-[#B99C9F]/40 text-[9px] mt-1 font-serif italic">Sealed Archive</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3D Book & Carousel Viewport ─── */}
      <div 
        className={`manga-book relative z-10 w-full transition-all duration-300 manga-book-container overflow-hidden rounded-lg ${isFullScreen ? 'max-w-3xl h-[82vh] max-h-[82vh] aspect-[5/7]' : 'max-w-xl h-[70vh] max-h-[70vh] aspect-[5/7]'}`}
      >
        <div 
          className="flex h-full"
          style={{
            width: `${pages.length * 100}%`,
            transform: `translateX(calc(-${currentPage * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
            touchAction: 'none',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={snapBack}
        >
          {pages.map((page, idx) => {
            // Render only current and adjacent pages to optimize loading and memory use
            const isVisible = Math.abs(idx - currentPage) <= 1;
            return (
              <div 
                key={idx} 
                className="h-full flex-shrink-0 select-none"
                style={{ width: `${100 / pages.length}%` }}
              >
                {isVisible ? renderPageContentForIndex(idx) : null}
              </div>
            );
          })}
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

        <span className="font-mono text-xs text-white/50 tracking-widest font-black">
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

      {/* Swipe hint with hand icon */}
      <div className="relative z-10 mt-4 flex items-center gap-1.5 opacity-35 select-none">
        <span className="text-[10px]">👋</span>
        <p className="font-sans text-[9px] text-white/70 tracking-wider">
          Swipe or drag page to turn • Arrow keys supported
        </p>
      </div>
    </div>
  );
};