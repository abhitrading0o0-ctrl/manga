import React from 'react';
import { ViewProvider, useView } from './context/ViewContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { Loader } from './components/Loader';
import { IntroCinematic } from './components/IntroCinematic';
import { ScrollStory } from './components/ScrollStory';
import { GiftOpening } from './components/GiftOpening';
import { Homepage } from './components/Homepage';
import { MangaRoom } from './components/MangaRoom';
import { PeaceRoom } from './components/PeaceRoom';
import { HeartRoom } from './components/HeartRoom';
import { GamesRoom } from './components/GamesRoom';
import { CreditsRoom } from './components/CreditsRoom';
import { StatsRoom } from './components/StatsRoom';
import { FinalSurprise } from './components/FinalSurprise';
import { GlobalParticles } from './components/GlobalParticles';
import { CustomCursor } from './components/CustomCursor';
import { AudioController } from './components/AudioController';

// Map views to room data-attribute names for CSS variable scoping
const VIEW_ROOM_MAP: Record<string, string | null> = {
  LOADER: null,
  INTRO: null,
  SCROLL: null,
  GIFT: null,
  HOME: 'home',
  MANGA: 'manga',
  PEACE: 'peace',
  HEART: 'heart',
  GAMES: 'games',
  CREDITS: 'credits',
  STATS: 'credits',
  SURPRISE: 'home',
};

const AppRouter: React.FC = () => {
  const { currentView } = useView();
  const { playTrack, isMusicPlaying } = useAudio();
  const prevViewRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isMusicPlaying) return;
    
    // Only switch tracks automatically if the view has actually changed
    if (prevViewRef.current !== currentView) {
      if (currentView === 'PEACE') {
        // Bypass auto-switching for Peace Room soundscapes
        prevViewRef.current = currentView;
        return;
      }
      if (currentView === 'LOADER' || currentView === 'INTRO') {
        playTrack(0); // Track 0 - Beethoven: Moonlight Sonata (Mysterious & Cinematic Intro)
      } else if (currentView === 'SCROLL') {
        playTrack(1); // Track 1 - Debussy: Clair de Lune (Bright & Emotional Scroll Journey)
      } else if (currentView === 'GAMES' || currentView === 'HEART') {
        playTrack(3); // Track 3 - Bach: Cello Suite No. 1 (Warm & Engaging Cello for interactive rooms)
      } else {
        playTrack(2); // Track 2 - Satie: Gymnopédie No. 1 (Spacious & Cosmic Piano for the Main Universe)
      }
      prevViewRef.current = currentView;
    }
  }, [currentView, isMusicPlaying, playTrack]);

  const renderActiveView = () => {
    switch (currentView) {
      case 'LOADER':
        return <Loader />;
      case 'INTRO':
        return <IntroCinematic />;
      case 'SCROLL':
        return <ScrollStory />;
      case 'GIFT':
        return <GiftOpening />;
      case 'HOME':
        return <Homepage />;
      case 'MANGA':
        return <MangaRoom />;
      case 'PEACE':
        return <PeaceRoom />;
      case 'HEART':
        return <HeartRoom />;
      case 'GAMES':
        return <GamesRoom />;
      case 'CREDITS':
        return <CreditsRoom />;
      case 'STATS':
        return <StatsRoom />;
      case 'SURPRISE':
        return <FinalSurprise />;
      default:
        return <Loader />;
    }
  };

  const roomName = VIEW_ROOM_MAP[currentView] || undefined;

  return (
    <>
      {/* Persistant cosmic backdrop under layout */}
      <GlobalParticles />

      {/* Smooth mouse tracking cursor glow ring */}
      <CustomCursor />

      {/* Primary SPA content view layer — wrapped with data-room for CSS scoping */}
      <main 
        className="relative z-10 w-full min-h-screen"
        data-room={roomName}
      >
        {renderActiveView()}
      </main>

      {/* Floating sound controllers */}
      <AudioController />
    </>
  );
};

function App() {
  return (
    <AudioProvider>
      <ViewProvider>
        <AppRouter />
      </ViewProvider>
    </AudioProvider>
  );
}

export default App;
