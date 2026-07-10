import React, { useEffect, useState } from 'react';
import { useView } from '../context/ViewContext';
import { useAudio } from '../context/AudioContext';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

interface RoomCard {
  id: string;
  label: string;
  icon: string;
  desc: string;
  color: string;
}

export const CreditsRoom: React.FC = () => {
  const { setView, markRoomVisited, visitedRooms, allRoomsVisited, highScores } = useView();
  const { playSound } = useAudio();
  const [showCelebration, setShowCelebration] = useState(false);

  const rooms: RoomCard[] = [
    { id: 'manga', label: 'Manga', icon: '📖', desc: 'The Story', color: '#5C4833' },
    { id: 'peace', label: 'Peace Room', icon: '🌿', desc: 'Anxiety Killer', color: '#8B7BC7' },
    { id: 'heart', label: 'Heart Letters', icon: '♡', desc: 'The Message', color: '#D4756B' },
    { id: 'games', label: 'Retro Arcade', icon: '🕹', desc: 'Arcade Games', color: '#E88FA6' },
    { id: 'credits', label: 'Credits', icon: '✦', desc: 'The Collection', color: '#C49A3C' },
  ];

  useEffect(() => {
    markRoomVisited('credits');

    // Entrance stagger
    gsap.fromTo('.credit-card', 
      { opacity: 0, y: 30, scale: 0.95 }, 
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );
    gsap.fromTo('.credit-section',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.7 }
    );
  }, []);

  // Celebration when all rooms visited
  useEffect(() => {
    if (allRoomsVisited && !showCelebration) {
      setShowCelebration(true);
      const colors = ['#D4756B', '#C49A3C', '#8B7BC7', '#E88FA6', '#5C4833'];
      const duration = 2500;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60 + Math.random() * 60,
          spread: 55,
          origin: { x: Math.random(), y: 0.6 },
          colors,
          shapes: ['circle'],
          scalar: 0.7,
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [allRoomsVisited, showCelebration]);

  const handleBackToIsland = () => {
    playSound('click');
    setView('HOME');
  };

  const visitedCount = Object.values(visitedRooms).filter(v => v).length;

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center py-10 px-6 overflow-hidden paper-texture custom-scrollbar"
      style={{ backgroundColor: 'var(--room-bg, #FAF5EE)', color: 'var(--room-text, #2A1F14)' }}
    >
      {/* Header */}
      <div className="relative z-10 w-full max-w-3xl flex items-center justify-between select-none mb-8">
        <button 
          onClick={handleBackToIsland}
          className="clickable flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer border"
          style={{ 
            color: 'var(--room-text-muted, #8B7355)',
            borderColor: 'var(--room-card-border, rgba(42, 31, 20, 0.1))',
          }}
        >
          ← Home
        </button>

        <h2 
          className="font-serif text-lg font-bold tracking-wider"
          style={{ color: 'var(--room-gold, #C49A3C)' }}
        >
          ✦ The Collection
        </h2>

        <div className="w-[80px]" />
      </div>

      {/* Room Recap Grid */}
      <div className="relative z-10 w-full max-w-3xl mb-10">
        <h3 
          className="font-sans text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: 'var(--room-text-muted, #8B7355)' }}
        >
          Room Progress — {visitedCount}/5 Explored
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {rooms.map(room => {
            const isVisited = visitedRooms[room.id];
            return (
              <div 
                key={room.id}
                className="credit-card rounded-xl p-4 flex flex-col items-center text-center transition-all duration-300 border"
                style={{
                  backgroundColor: isVisited ? `${room.color}08` : 'var(--room-card-bg)',
                  borderColor: isVisited ? `${room.color}30` : 'var(--room-card-border)',
                  opacity: isVisited ? 1 : 0.5,
                }}
              >
                <span className="text-2xl mb-2">{room.icon}</span>
                <h4 
                  className="font-sans text-xs font-bold tracking-wide mb-1"
                  style={{ color: isVisited ? room.color : 'var(--room-text-muted)' }}
                >
                  {room.label}
                </h4>
                <span 
                  className="text-[9px] tracking-wider uppercase"
                  style={{ color: 'var(--room-text-muted)' }}
                >
                  {isVisited ? '✓ Complete' : 'Not visited'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* High Scores */}
      <div className="credit-section relative z-10 w-full max-w-3xl mb-8">
        <h3 
          className="font-sans text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: 'var(--room-text-muted, #8B7355)' }}
        >
          Arcade High Scores
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '🐍 Snake', score: highScores.snake },
            { label: '🐦 Flappy', score: highScores.flappy },
            { label: '🎨 Tracer', score: highScores.artist },
          ].map(g => (
            <div 
              key={g.label}
              className="rounded-xl p-4 text-center border"
              style={{
                backgroundColor: 'var(--room-card-bg)',
                borderColor: 'var(--room-card-border)',
              }}
            >
              <span className="text-lg block mb-1">{g.label.split(' ')[0]}</span>
              <h4 className="font-mono text-lg font-bold" style={{ color: 'var(--room-gold)' }}>
                {g.score}
              </h4>
              <span className="font-sans text-[9px] tracking-wider uppercase" style={{ color: 'var(--room-text-muted)' }}>
                {g.label.split(' ')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Credits */}
      <div className="credit-section relative z-10 w-full max-w-3xl mb-8">
        <h3 
          className="font-sans text-xs font-bold tracking-widest uppercase mb-4"
          style={{ color: 'var(--room-text-muted, #8B7355)' }}
        >
          Built With
        </h3>
        <div 
          className="rounded-xl p-6 border grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{
            backgroundColor: 'var(--room-card-bg)',
            borderColor: 'var(--room-card-border)',
          }}
        >
          {[
            { title: '🎨 Design', desc: 'Manga-ink aesthetic, paper textures, organic SVG borders' },
            { title: '⚛️ Framework', desc: 'React 19 + TypeScript + Vite' },
            { title: '✨ Animation', desc: 'GSAP 3 for transitions and interactions' },
            { title: '🔊 Audio', desc: 'Howler.js for music & Web Audio API synth fallback' },
            { title: '🎮 Games', desc: 'HTML5 Canvas with requestAnimationFrame' },
            { title: '💅 Styling', desc: 'Tailwind CSS 4 with CSS variable theming' },
          ].map(item => (
            <div key={item.title} className="flex flex-col gap-1">
              <h4 
                className="font-sans text-xs font-bold tracking-wider"
                style={{ color: 'var(--room-gold)' }}
              >
                {item.title}
              </h4>
              <p 
                className="font-sans text-xs font-light leading-relaxed"
                style={{ color: 'var(--room-text-muted)' }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* All Complete Celebration */}
      {allRoomsVisited && (
        <div className="credit-section relative z-10 w-full max-w-3xl text-center py-8">
          <span className="text-4xl block mb-4">🎉</span>
          <h3 
            className="font-serif text-xl font-bold tracking-wider mb-2"
            style={{ color: 'var(--room-gold)' }}
          >
            All Rooms Explored!
          </h3>
          <p 
            className="font-sans text-sm font-light leading-relaxed max-w-sm mx-auto"
            style={{ color: 'var(--room-text-muted)' }}
          >
            You've explored every corner of Twin Zold's World. Thank you for taking this journey.
            This was made with love, code, and a whole lot of heart. ✦
          </p>
        </div>
      )}
    </div>
  );
};