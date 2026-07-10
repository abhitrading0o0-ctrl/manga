import React, { useState } from 'react';
import { useAudio } from '../context/AudioContext';
import { useView } from '../context/ViewContext';

export const AudioController: React.FC = () => {
  const { 
    isMusicPlaying, 
    volume, 
    currentTrackIndex, 
    toggleMusic, 
    setVolume, 
    nextTrack, 
    prevTrack, 
    playSound,
    tracks
  } = useAudio();

  const { currentView } = useView();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.2);

  // Hide player on the loader view before consent is given
  if (currentView === 'LOADER') return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (vol > 0) {
      setPrevVolume(vol);
    }
  };

  const handleMuteToggle = () => {
    playSound('click');
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 0.2);
    }
  };

  const handleControlClick = (action: () => void) => {
    playSound('click');
    action();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9990] flex items-center gap-3 bg-secondary/85 backdrop-blur-md border border-white/8 rounded-full px-4 py-2.5 shadow-2xl select-none">
      
      {/* Visual audio waves indicator */}
      {isMusicPlaying && (
        <div className="flex gap-[3px] items-center h-4 px-2">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="w-[2px] bg-gold rounded-full animate-bounce"
              style={{
                height: `${Math.random() * 12 + 4}px`,
                animationDuration: `${Math.random() * 0.4 + 0.5}s`,
                animationDelay: `${i * 0.15}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Track Title Info */}
      <div className="flex flex-col text-left max-w-[120px] sm:max-w-[150px] overflow-hidden">
        <span className="text-[9px] text-gray uppercase tracking-widest font-sans font-light select-none">
          Now Playing
        </span>
        <span className="text-[10px] text-white font-medium truncate tracking-wide font-sans">
          {tracks[currentTrackIndex]?.title}
        </span>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 border-l border-white/5 pl-3">
        {/* Prev */}
        <button 
          onClick={() => handleControlClick(prevTrack)}
          className="clickable w-7 h-7 rounded-full flex items-center justify-center text-gray hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          title="Previous Track"
        >
          ⏮
        </button>

        {/* Play/Pause */}
        <button 
          onClick={toggleMusic}
          className="clickable w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-md active:scale-95 transition-all hover:bg-gold hover:text-bg hover:shadow-[0_0_12px_rgba(233,200,116,0.35)] cursor-pointer"
          title={isMusicPlaying ? "Pause Music" : "Play Music"}
        >
          {isMusicPlaying ? "⏸" : "▶"}
        </button>

        {/* Next */}
        <button 
          onClick={() => handleControlClick(nextTrack)}
          className="clickable w-7 h-7 rounded-full flex items-center justify-center text-gray hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          title="Next Track"
        >
          ⏭
        </button>

        {/* Volume adjust button */}
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          <button 
            onClick={handleMuteToggle}
            className="clickable w-7 h-7 rounded-full flex items-center justify-center text-gray hover:text-white hover:bg-white/5 active:scale-90 transition-all cursor-pointer"
            title={volume > 0 ? "Mute Music" : "Unmute Music"}
          >
            {volume > 0 ? "🔊" : "🔇"}
          </button>

          {/* Sliding volume tooltip bar (wrapped in a pb-3 bridge container to fix mouse hover gap) */}
          <div 
            className={`absolute bottom-full right-0 pb-3 transition-all duration-300 transform origin-bottom z-[9995]
              ${showVolumeSlider ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'}`}
          >
            <div className="bg-secondary border border-white/8 rounded-xl p-3 shadow-xl flex items-center">
              <input 
                type="range" 
                min="0" 
                max="0.8" 
                step="0.05" 
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                style={{ writingMode: 'horizontal-tb' }}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};