import React, { useEffect } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import { SpaceBackground } from './SpaceBackground';
import { ClosingSequence } from './ClosingSequence';

export const CreditsRoom: React.FC = () => {
  const { setView, markRoomVisited } = useView();
  const { playTrack, setMusicPlaying } = useAudio();

  useEffect(() => {
    markRoomVisited('credits');

    // Autoplay Satie's Gymnopédie No. 1 on mount
    setMusicPlaying(true);
    playTrack(2);
  }, [playTrack, setMusicPlaying]);

  const handleBackToHome = () => {
    setView('HOME');
  };

  const handleGoToStats = () => {
    setView('STATS');
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center overflow-x-hidden deep-space-container custom-scrollbar">
      {/* Immersive space canvas */}
      <SpaceBackground />

      {/* Floating minimal navigation header */}
      <div className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between select-none max-w-3xl mx-auto w-[calc(100%-3rem)]">
        <button
          onClick={handleBackToHome}
          className="space-back-btn flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
        >
          ← Home
        </button>

        <button
          onClick={handleGoToStats}
          className="space-back-btn flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
        >
          Stats →
        </button>
      </div>

      {/* Dedicated Cinematic Closing Sequence */}
      <ClosingSequence />
    </div>
  );
};
export default CreditsRoom;