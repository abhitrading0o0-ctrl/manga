import React, { createContext, useContext, useState, useEffect } from 'react';
import gsap from 'gsap';

export type ViewType = 
  | 'LOADER' 
  | 'INTRO' 
  | 'SCROLL' 
  | 'GIFT' 
  | 'HOME' 
  | 'MANGA' 
  | 'PEACE' 
  | 'HEART' 
  | 'GAMES' 
  | 'CREDITS' 
  | 'STATS'
  | 'SURPRISE';

interface ViewContextType {
  currentView: ViewType;
  previousView: ViewType | null;
  visitedRooms: Record<string, boolean>;
  highScores: { snake: number; flappy: number; artist: number };
  confirmingRestart: boolean;
  setView: (view: ViewType) => void;
  markRoomVisited: (room: string) => void;
  saveHighScore: (game: 'snake' | 'flappy' | 'artist', score: number) => void;
  requestRestart: () => void;
  confirmRestart: () => void;
  cancelRestart: () => void;
  allRoomsVisited: boolean;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentViewState] = useState<ViewType>(() => {
    const isCompleted = localStorage.getItem('birthday_intro_completed');
    return isCompleted === 'true' ? 'HOME' : 'LOADER';
  });
  const [previousView, setPreviousView] = useState<ViewType | null>(null);
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  const [visitedRooms, setVisitedRooms] = useState<Record<string, boolean>>({
    manga: false,
    peace: false,
    heart: false,
    games: false,
    credits: false,
  });

  const [highScores, setHighScores] = useState({
    snake: 0,
    flappy: 0,
    artist: 0
  });

  // Load cache on mount
  useEffect(() => {
    const savedRooms = localStorage.getItem('birthday_rooms_visited');
    if (savedRooms) {
      try {
        setVisitedRooms(JSON.parse(savedRooms));
      } catch (e) {}
    }

    const savedScores = localStorage.getItem('birthday_high_scores');
    if (savedScores) {
      try {
        setHighScores(JSON.parse(savedScores));
      } catch (e) {}
    }
  }, []);

  const setView = (newView: ViewType) => {
    // If user reaches Homepage, save completion progress
    if (newView === 'HOME') {
      localStorage.setItem('birthday_intro_completed', 'true');
    }

    // Determine if we're in the intro flow or in room navigation
    const introViews: ViewType[] = ['LOADER', 'INTRO', 'SCROLL', 'GIFT'];
    const isIntroTransition = introViews.includes(currentView) || introViews.includes(newView);

    if (isIntroTransition) {
      // Use the classic dark fog for intro sequence
      const fog = document.getElementById('morph-fog');
      if (fog) {
        const tl = gsap.timeline();
        tl.to(fog, {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: () => {
            setPreviousView(currentView);
            setCurrentViewState(newView);
            window.scrollTo(0, 0);
          }
        });
        tl.to(fog, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          delay: 0.2
        });
      } else {
        setPreviousView(currentView);
        setCurrentViewState(newView);
      }
    } else {
      // Use the ink-wipe transition for room navigation
      const inkWipe = document.getElementById('ink-wipe');
      if (inkWipe) {
        // Animate ink circle expanding
        gsap.to(inkWipe, {
          clipPath: 'circle(150% at 50% 50%)',
          duration: 0.5,
          ease: 'power3.inOut',
          onComplete: () => {
            setPreviousView(currentView);
            setCurrentViewState(newView);
            window.scrollTo(0, 0);

            // Then contract the ink circle to reveal new page
            gsap.to(inkWipe, {
              clipPath: 'circle(0% at 50% 50%)',
              duration: 0.6,
              ease: 'power3.inOut',
              delay: 0.15
            });
          }
        });
      } else {
        setPreviousView(currentView);
        setCurrentViewState(newView);
      }
    }
  };

  const markRoomVisited = (room: string) => {
    setVisitedRooms(prev => {
      const updated = { ...prev, [room]: true };
      localStorage.setItem('birthday_rooms_visited', JSON.stringify(updated));
      return updated;
    });
  };

  const saveHighScore = (game: 'snake' | 'flappy' | 'artist', score: number) => {
    setHighScores(prev => {
      if (score > prev[game]) {
        const updated = { ...prev, [game]: score };
        localStorage.setItem('birthday_high_scores', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  // Two-step restart: request → confirm
  const requestRestart = () => {
    setConfirmingRestart(true);
  };

  const cancelRestart = () => {
    setConfirmingRestart(false);
  };

  const confirmRestart = () => {
    localStorage.removeItem('birthday_intro_completed');
    const resetRooms = {
      manga: false,
      peace: false,
      heart: false,
      games: false,
      credits: false,
    };
    setVisitedRooms(resetRooms);
    localStorage.setItem('birthday_rooms_visited', JSON.stringify(resetRooms));
    setConfirmingRestart(false);
    setCurrentViewState('LOADER');
  };

  const allRoomsVisited = Object.values(visitedRooms).every(v => v === true);

  return (
    <ViewContext.Provider value={{
      currentView,
      previousView,
      visitedRooms,
      highScores,
      confirmingRestart,
      setView,
      markRoomVisited,
      saveHighScore,
      requestRestart,
      confirmRestart,
      cancelRestart,
      allRoomsVisited
    }}>
      {children}

      {/* Classic dark fog for intro sequences */}
      <div 
        id="morph-fog" 
        className="fixed inset-0 pointer-events-none z-[9999] bg-[#050608] opacity-0"
        style={{
          background: 'radial-gradient(circle, rgba(11, 16, 32, 0.95) 0%, #050608 100%)'
        }}
      />

      {/* Ink wipe overlay for room transitions */}
      <div 
        id="ink-wipe" 
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{
          background: '#2A1F14',
          clipPath: 'circle(0% at 50% 50%)'
        }}
      />
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};