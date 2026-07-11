import React, { useEffect, useRef, useState, useCallback } from 'react';

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildNoisePath(
  canvasW: number,
  canvasH: number,
  _totalSteps: number,
  lineSpeed: number,
  curviness: number,
  seed: number
): { x: number; y: number }[] {
  const rand = seededRandom(seed);
  const path: { x: number; y: number }[] = [];

  const isVertical = rand() > 0.5;
  const numLanes = Math.floor(rand() * 3) + 2; // 2, 3, or 4 lanes

  if (!isVertical) {
    // ── Horizontal S-curve ──
    const leftMargin = canvasW * 0.12;
    const rightMargin = canvasW * 0.88;


    const lanesY: number[] = [];
    if (numLanes === 2) {
      lanesY.push(canvasH * 0.28, canvasH * 0.72);
    } else if (numLanes === 3) {
      lanesY.push(canvasH * 0.22, canvasH * 0.50, canvasH * 0.78);
    } else {
      lanesY.push(canvasH * 0.16, canvasH * 0.38, canvasH * 0.62, canvasH * 0.84);
    }

    let y = lanesY[0];
    for (let laneIdx = 0; laneIdx < numLanes; laneIdx++) {
      const targetY = lanesY[laneIdx];
      const goingRight = laneIdx % 2 === 0;

      // 1. Generate Lane
      let vy = 0;
      if (goingRight) {
        let curX = leftMargin;
        while (curX < rightMargin) {
          path.push({ x: curX, y });
          curX += lineSpeed;
          vy += (rand() - 0.5) * curviness * 6;
          vy = Math.max(-lineSpeed * 0.75, Math.min(lineSpeed * 0.75, vy));
          vy += (targetY - y) * 0.025;
          y += vy;
        }
      } else {
        let curX = rightMargin;
        while (curX > leftMargin) {
          path.push({ x: curX, y });
          curX -= lineSpeed;
          vy += (rand() - 0.5) * curviness * 6;
          vy = Math.max(-lineSpeed * 0.75, Math.min(lineSpeed * 0.75, vy));
          vy += (targetY - y) * 0.025;
          y += vy;
        }
      }

      // 2. Generate Connector Turn (if not last lane)
      if (laneIdx < numLanes - 1) {
        const nextY = lanesY[laneIdx + 1];
        const radius = (nextY - targetY) / 2;
        const centerY = (targetY + nextY) / 2;
        const dTheta = lineSpeed / radius;

        if (goingRight) {
          // Turn right edge down (bulge inwards/leftwards)
          for (let theta = -Math.PI / 2 + dTheta; theta < Math.PI / 2; theta += dTheta) {
            const cx = rightMargin - radius * Math.cos(theta);
            const cy = centerY + radius * Math.sin(theta);
            path.push({ x: cx, y: cy });
          }
        } else {
          // Turn left edge down (bulge inwards/rightwards)
          for (let theta = -Math.PI / 2 + dTheta; theta < Math.PI / 2; theta += dTheta) {
            const cx = leftMargin + radius * Math.cos(theta);
            const cy = centerY + radius * Math.sin(theta);
            path.push({ x: cx, y: cy });
          }
        }
        y = nextY;
      }
    }
  } else {
    // ── Vertical S-curve ──
    const topMargin = canvasH * 0.12;
    const bottomMargin = canvasH * 0.88;


    const lanesX: number[] = [];
    if (numLanes === 2) {
      lanesX.push(canvasW * 0.28, canvasW * 0.72);
    } else if (numLanes === 3) {
      lanesX.push(canvasW * 0.22, canvasW * 0.50, canvasW * 0.78);
    } else {
      lanesX.push(canvasW * 0.16, canvasW * 0.38, canvasW * 0.62, canvasW * 0.84);
    }

    let x = lanesX[0];
    for (let laneIdx = 0; laneIdx < numLanes; laneIdx++) {
      const targetX = lanesX[laneIdx];
      const goingDown = laneIdx % 2 === 0;

      // 1. Generate Lane
      let vx = 0;
      if (goingDown) {
        let curY = topMargin;
        while (curY < bottomMargin) {
          path.push({ x, y: curY });
          curY += lineSpeed;
          vx += (rand() - 0.5) * curviness * 6;
          vx = Math.max(-lineSpeed * 0.75, Math.min(lineSpeed * 0.75, vx));
          vx += (targetX - x) * 0.025;
          x += vx;
        }
      } else {
        let curY = bottomMargin;
        while (curY > topMargin) {
          path.push({ x, y: curY });
          curY -= lineSpeed;
          vx += (rand() - 0.5) * curviness * 6;
          vx = Math.max(-lineSpeed * 0.75, Math.min(lineSpeed * 0.75, vx));
          vx += (targetX - x) * 0.025;
          x += vx;
        }
      }

      // 2. Generate Connector Turn (if not last lane)
      if (laneIdx < numLanes - 1) {
        const nextX = lanesX[laneIdx + 1];
        const radius = (nextX - targetX) / 2;
        const centerX = (targetX + nextX) / 2;
        const dTheta = lineSpeed / radius;

        if (goingDown) {
          // Turn bottom edge right (bulge inwards/upwards)
          for (let theta = -Math.PI / 2 + dTheta; theta < Math.PI / 2; theta += dTheta) {
            const cx = centerX + radius * Math.sin(theta);
            const cy = bottomMargin - radius * Math.cos(theta);
            path.push({ x: cx, y: cy });
          }
        } else {
          // Turn top edge right (bulge inwards/downwards)
          for (let theta = -Math.PI / 2 + dTheta; theta < Math.PI / 2; theta += dTheta) {
            const cx = centerX + radius * Math.sin(theta);
            const cy = topMargin + radius * Math.cos(theta);
            path.push({ x: cx, y: cy });
          }
        }
        x = nextX;
      }
    }
  }

  return path;
}

interface LevelDef {
  number: number;
  name: string;
  description: string;
  lineSpeed: number;
  curviness: number;
  durationSec: number;
  guideColor: string;
  guideGlow: string;
}

const LEVEL_DEFS: LevelDef[] = [
  { number: 1, name: 'Lazy River', description: 'Slow gentle curves — pure control building', lineSpeed: 0.7, curviness: 0.06, durationSec: 28, guideColor: '#4ADE80', guideGlow: 'rgba(74,222,128,0.45)' },
  { number: 2, name: 'Rolling Hills', description: 'Moderate speed with wider sweeping turns', lineSpeed: 1.0, curviness: 0.10, durationSec: 32, guideColor: '#FBBF24', guideGlow: 'rgba(251,191,36,0.45)' },
  { number: 3, name: 'Winding Road', description: 'Faster pace — tighter curves, sharp turns', lineSpeed: 1.3, curviness: 0.16, durationSec: 35, guideColor: '#F472B6', guideGlow: 'rgba(244,114,182,0.45)' },
  { number: 4, name: 'Storm Line', description: 'Max speed — unpredictable direction changes', lineSpeed: 1.6, curviness: 0.22, durationSec: 40, guideColor: '#A78BFA', guideGlow: 'rgba(167,139,250,0.45)' },
];

type ToolType = 'pencil' | 'ink' | 'marker' | 'watercolor';
interface ToolStyle { id: ToolType; name: string; lineWidth: number; alpha: number; blur: number; }
const TOOLS: ToolStyle[] = [
  { id: 'pencil', name: 'Pencil', lineWidth: 2, alpha: 0.9, blur: 0 },
  { id: 'ink', name: 'Ink Pen', lineWidth: 3, alpha: 1.0, blur: 0 },
  { id: 'marker', name: 'Marker', lineWidth: 7, alpha: 0.6, blur: 0 },
  { id: 'watercolor', name: 'Watercolor', lineWidth: 11, alpha: 0.35, blur: 6 },
];

function getFeedbackText(grade: string, avgAcc: number): string {
  if (grade === 'S') return "Flawless line control. A true artist's hand — keep this precision!";
  if (grade === 'A') return 'Excellent control! Your curves are smooth — push for tighter corner accuracy.';
  if (grade === 'B') return avgAcc > 76 ? 'Good tracking — anticipate direction changes earlier.' : 'Solid effort! Follow the tip, not the trail behind it.';
  if (grade === 'C') return 'Keep practicing — line confidence builds with repetition. You are improving!';
  return "Don't give up — every stroke teaches your hand something new.";
}

function getGrade(acc: number): string {
  if (acc >= 93) return 'S';
  if (acc >= 82) return 'A';
  if (acc >= 65) return 'B';
  if (acc >= 45) return 'C';
  return 'F';
}

interface TracerGameProps {
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
  gameState: 'IDLE' | 'PLAYING' | 'OVER';
  onStart: () => void;
  highScore: number;
}

export const TracerGame: React.FC<TracerGameProps> = ({ onGameOver, onScoreChange, gameState, onStart, highScore }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<number | null>(null);
  const gameRunningRef = useRef(false);
  const scoreRef = useRef(0);
  const gradeRef = useRef('');
  const feedbackRef = useRef('');
  const liveAccRef = useRef(0);

  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedTool, setSelectedTool] = useState<ToolType>(() =>
    (localStorage.getItem('tracer_tool') as ToolType) || 'ink'
  );
  const [scoreHistory, setScoreHistory] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('tracer_score_history') || '[]'); }
    catch { return []; }
  });
  const [showPathPreview, setShowPathPreview] = useState<boolean>(() => {
    return localStorage.getItem('tracer_show_path_preview') === 'true';
  });

  const stopLoop = useCallback(() => {
    if (loopRef.current) { cancelAnimationFrame(loopRef.current); loopRef.current = null; }
    gameRunningRef.current = false;
  }, []);

  useEffect(() => {
    if (gameState === 'PLAYING') initGame();
    else stopLoop();
    return () => stopLoop();
  }, [gameState]);

  useEffect(() => { localStorage.setItem('tracer_tool', selectedTool); }, [selectedTool]);
  useEffect(() => { localStorage.setItem('tracer_show_path_preview', String(showPathPreview)); }, [showPathPreview]);

  const saveScore = (score: number) => {
    const newHistory = [...scoreHistory, score].slice(-10);
    setScoreHistory(newHistory);
    localStorage.setItem('tracer_score_history', JSON.stringify(newHistory));
  };

  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopLoop();
    scoreRef.current = 0;
    gradeRef.current = '';
    feedbackRef.current = '';
    liveAccRef.current = 0;
    onScoreChange(0);
    gameRunningRef.current = true;

    const levelDef = LEVEL_DEFS[selectedLevel];
    const tool = TOOLS.find(t => t.id === selectedTool) || TOOLS[1];
    const totalSteps = Math.round(60 * levelDef.durationSec);
    const seed = Math.floor(Math.random() * 999983);
    const fullPath = buildNoisePath(canvas.width, canvas.height, totalSteps, levelDef.lineSpeed, levelDef.curviness, seed);

    const stars: { x: number; y: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 55; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.8 + 0.3, alpha: Math.random() * 0.55 + 0.15 });
    }

    let playerX = fullPath[0].x;
    let playerY = fullPath[0].y;
    let hasMovedMouse = false;
    let isMouseDown = false;
    let startNewStroke = true;
    const playerPath: { x: number; y: number; acc: number; isNewStroke?: boolean }[] = [];
    const MAX_PLAYER_TRAIL = 600;
    let totalFrameAcc = 0;
    let totalFrames = 0;
    const THRESHOLD = 24;
    let frame = 0;
    let maxTraceIndex = 0;

    const getPos = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e) {
        const t = e.touches[0];
        return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
      }
      return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
    };

    const onMouseMove = (e: MouseEvent) => {
      const p = getPos(e);
      playerX = p.x * (canvas.width / canvas.getBoundingClientRect().width);
      playerY = p.y * (canvas.height / canvas.getBoundingClientRect().height);
      hasMovedMouse = true;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // left click only
        isMouseDown = true;
        startNewStroke = true;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      playerX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      playerY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
      hasMovedMouse = true;
    };

    const onTouchStart = (e: TouchEvent) => {
      isMouseDown = true;
      startNewStroke = true;
      const rect = canvas.getBoundingClientRect();
      playerX = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
      playerY = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
      hasMovedMouse = true;
    };

    const onTouchEnd = () => {
      isMouseDown = false;
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    const cleanup = () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };

    const loop = (timestamp: number) => {
      if (!gameRunningRef.current) { cleanup(); return; }
      loopRef.current = requestAnimationFrame(loop);

      const guidePoint = fullPath[Math.min(frame, fullPath.length - 1)];
      const guideX = guidePoint.x;
      const guideY = guidePoint.y;

      if (isMouseDown) {
        // Find closest point on the drawn guide line so far
        const drawnUpTo = Math.min(frame, fullPath.length - 1);
        let minDistSq = Infinity;
        let closestIdx = 0;
        for (let i = 0; i <= drawnUpTo; i++) {
          const dx = playerX - fullPath[i].x;
          const dy = playerY - fullPath[i].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            closestIdx = i;
          }
        }
        const dist = Math.sqrt(minDistSq);
        const frameAcc = Math.max(0, Math.min(1, 1 - dist / THRESHOLD));
        
        // If close to the line, update player trace progress index
        if (dist < THRESHOLD) {
          maxTraceIndex = Math.max(maxTraceIndex, closestIdx);
        }

        totalFrameAcc += frameAcc;
        totalFrames++;
        playerPath.push({ x: playerX, y: playerY, acc: frameAcc, isNewStroke: startNewStroke });
        startNewStroke = false;
        if (playerPath.length > MAX_PLAYER_TRAIL) playerPath.shift();
        const liveAcc = Math.round((totalFrameAcc / totalFrames) * 100);
        liveAccRef.current = liveAcc;
        scoreRef.current = liveAcc;
        onScoreChange(liveAcc);
      }

      // Level completes only when the player's trace reaches the final point
      const reachedEnd = maxTraceIndex >= fullPath.length - 8 &&
                         Math.sqrt(Math.pow(playerX - fullPath[fullPath.length - 1].x, 2) +
                                   Math.pow(playerY - fullPath[fullPath.length - 1].y, 2)) < THRESHOLD;

      if (reachedEnd) {
        gameRunningRef.current = false;
        cleanup();
        const finalAcc = totalFrames > 0 ? Math.round((totalFrameAcc / totalFrames) * 100) : 0;
        scoreRef.current = finalAcc;
        gradeRef.current = getGrade(finalAcc);
        feedbackRef.current = getFeedbackText(gradeRef.current, finalAcc);
        saveScore(finalAcc);
        onGameOver(finalAcc);
        return;
      }

      frame++;

      // Clear
      ctx.fillStyle = '#0A0E1A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      stars.forEach(star => {
        ctx.save();
        ctx.globalAlpha = star.alpha * (0.75 + Math.sin(timestamp * 0.001 + star.x) * 0.25);
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      const drawnUpTo = Math.min(frame, fullPath.length - 1);

      // Ghost full path (faint)
      if (showPathPreview && fullPath.length > 1) {
        ctx.save();
        ctx.globalAlpha = 0.09;
        ctx.strokeStyle = levelDef.guideColor;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(fullPath[0].x, fullPath[0].y);
        for (let i = 1; i < fullPath.length; i++) ctx.lineTo(fullPath[i].x, fullPath[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // Guide line drawn so far — glow
      if (drawnUpTo > 0) {
        ctx.save();
        ctx.globalAlpha = 0.20;
        ctx.strokeStyle = levelDef.guideColor;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(fullPath[0].x, fullPath[0].y);
        for (let i = 1; i <= drawnUpTo; i++) ctx.lineTo(fullPath[i].x, fullPath[i].y);
        ctx.stroke();
        ctx.restore();

        // Crisp core
        ctx.save();
        ctx.strokeStyle = levelDef.guideColor;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = levelDef.guideGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(fullPath[0].x, fullPath[0].y);
        for (let i = 1; i <= drawnUpTo; i++) ctx.lineTo(fullPath[i].x, fullPath[i].y);
        ctx.stroke();
        ctx.restore();
      }

      // Tip dot
      if (frame < fullPath.length) {
        const pulse = 0.7 + Math.sin(timestamp * 0.006) * 0.3;
        ctx.save();
        ctx.globalAlpha = 0.28 * pulse;
        ctx.strokeStyle = levelDef.guideColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = levelDef.guideColor;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(guideX, guideY, 14 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = levelDef.guideColor;
        ctx.shadowColor = levelDef.guideGlow;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(guideX, guideY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(guideX, guideY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Player trail
      if (playerPath.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = tool.lineWidth;
        ctx.globalAlpha = tool.alpha;
        if (tool.blur > 0) ctx.shadowBlur = tool.blur;
        for (let i = 1; i < playerPath.length; i++) {
          if (playerPath[i].isNewStroke) continue;
          const acc = playerPath[i].acc;
          let r: number, g: number, b: number;
          if (acc >= 0.65) {
            const t = (acc - 0.65) / 0.35;
            r = Math.round(74 + t * (251 - 74));
            g = Math.round(222 - t * (222 - 191));
            b = Math.round(t * 36);
          } else if (acc >= 0.30) {
            const t = (acc - 0.30) / 0.35;
            r = 239; g = Math.round(68 + t * (191 - 68)); b = Math.round(36 * t);
          } else {
            r = 239; g = Math.round(68 * (acc / 0.30)); b = 68;
          }
          if (tool.blur > 0) ctx.shadowColor = `rgb(${r},${g},${b})`;
          ctx.strokeStyle = `rgb(${r},${g},${b})`;
          ctx.beginPath();
          ctx.moveTo(playerPath[i - 1].x, playerPath[i - 1].y);
          ctx.lineTo(playerPath[i].x, playerPath[i].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Player cursor crosshair
      if (hasMovedMouse) {
        const liveAcc = liveAccRef.current;
        const cursorColor = liveAcc >= 65 ? '#4ADE80' : liveAcc >= 40 ? '#FBBF24' : '#EF4444';
        ctx.save();
        ctx.strokeStyle = cursorColor;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(playerX - 10, playerY); ctx.lineTo(playerX + 10, playerY);
        ctx.moveTo(playerX, playerY - 10); ctx.lineTo(playerX, playerY + 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = cursorColor;
        ctx.shadowColor = cursorColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Prompt if not moved yet
      if (!isMouseDown && frame < fullPath.length) {
        ctx.save();
        ctx.font = "bold 9px 'Courier New', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = levelDef.guideColor;
        ctx.globalAlpha = 0.7 + Math.sin(timestamp * 0.004) * 0.3;
        ctx.shadowColor = levelDef.guideGlow;
        ctx.shadowBlur = 8;
        ctx.fillText('CLICK & DRAG TO TRACE THE LINE', canvas.width / 2, canvas.height * 0.88);
        ctx.restore();
      }

      // Progress bar (based on player's S-curve trace progress index)
      const progress = maxTraceIndex / (fullPath.length - 1);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, canvas.height - 3, canvas.width, 3);
      ctx.fillStyle = levelDef.guideColor;
      ctx.shadowColor = levelDef.guideGlow;
      ctx.shadowBlur = 4;
      ctx.fillRect(0, canvas.height - 3, canvas.width * progress, 3);
      ctx.restore();

      // Accuracy HUD
      if (totalFrames > 0) {
        const liveAcc = liveAccRef.current;
        const hudColor = liveAcc >= 65 ? '#4ADE80' : liveAcc >= 40 ? '#FBBF24' : '#EF4444';
        ctx.save();
        ctx.font = "bold 12px 'Courier New', monospace";
        ctx.textAlign = 'right';
        ctx.fillStyle = hudColor;
        ctx.shadowColor = hudColor;
        ctx.shadowBlur = 8;
        ctx.fillText(liveAcc + '%', canvas.width - 10, 20);
        ctx.restore();
      }

      // Level label
      ctx.save();
      ctx.font = "9px 'Courier New', monospace";
      ctx.textAlign = 'left';
      ctx.fillStyle = levelDef.guideColor;
      ctx.globalAlpha = 0.6;
      ctx.fillText('LVL ' + levelDef.number + ': ' + levelDef.name.toUpperCase(), 10, 20);
      ctx.restore();
    };

    loopRef.current = requestAnimationFrame(loop);
  };

  const levelDef = LEVEL_DEFS[selectedLevel];
  const currentTool = TOOLS.find(t => t.id === selectedTool) || TOOLS[1];

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full block"
        style={{ backgroundColor: '#0A0E1A', cursor: gameState === 'PLAYING' ? 'none' : 'default' }}
      />

      {/* IDLE overlay */}
      {gameState === 'IDLE' && (
        <div 
          className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-5 select-none animate-fade-in" 
          style={{ backgroundColor: 'rgba(10, 14, 26, 0.94)', backdropFilter: 'blur(8px)' }}
        >
          <div className="w-full max-w-[420px] p-6 bg-[#0f1322]/90 border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center">
            {/* Header Icon */}
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3.5 bg-white/5 border border-white/10 transition-all duration-300"
              style={{ 
                boxShadow: `0 0 20px ${levelDef.guideColor}15`,
                borderColor: `${levelDef.guideColor}30`
              }}
            >
              ✍️
            </div>

            {/* Game Name */}
            <h3 
              className="font-mono text-sm tracking-[0.25em] font-bold mb-1 uppercase" 
              style={{ color: levelDef.guideColor, textShadow: `0 0 10px ${levelDef.guideColor}60` }}
            >
              Tracer
            </h3>
            
            {/* Short Tagline */}
            <p className="font-mono text-[8px] mb-5 tracking-widest uppercase text-white/40">
              Follow the moving dot · Build line precision
            </p>

            {/* Level Selector 2x2 Grid */}
            <div className="w-full grid grid-cols-2 gap-2 mb-4">
              {LEVEL_DEFS.map((lv, i) => {
                const isSelected = selectedLevel === i;
                return (
                  <button 
                    key={lv.number} 
                    onClick={() => setSelectedLevel(i)}
                    className="clickable p-3 rounded-xl border font-mono text-[8px] tracking-wide text-left transition-all duration-200 cursor-pointer w-full flex flex-col justify-between"
                    style={{ 
                      borderColor: isSelected ? lv.guideColor : 'rgba(255,255,255,0.06)', 
                      backgroundColor: isSelected ? `${lv.guideColor}12` : 'rgba(255,255,255,0.02)', 
                      color: isSelected ? lv.guideColor : 'rgba(255,255,255,0.4)', 
                      boxShadow: isSelected ? `0 0 12px ${lv.guideGlow}30` : 'none',
                      minHeight: '52px'
                    }}
                  >
                    <span className="font-bold uppercase tracking-wider block mb-0.5">Lvl {lv.number}: {lv.name}</span>
                    <span className="text-[6.5px] lowercase text-white/35 leading-tight block truncate w-full">{lv.description.replace(' — ', ' ')}</span>
                  </button>
                );
              })}
            </div>

            {/* Brush Tool Selector */}
            <div className="w-full flex justify-between p-1 bg-white/5 border border-white/5 rounded-xl gap-1 mb-4">
              {TOOLS.map(t => {
                const isSelected = selectedTool === t.id;
                return (
                  <button 
                    key={t.id} 
                    onClick={() => setSelectedTool(t.id)}
                    className="clickable flex-1 py-2 rounded-lg font-mono text-[8px] tracking-wider uppercase border transition-all duration-200 cursor-pointer"
                    style={{ 
                      borderColor: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent', 
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'transparent', 
                      color: isSelected ? '#FFF' : 'rgba(255,255,255,0.4)',
                      boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    {t.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Option and Score Stats Grid */}
            <div className="w-full grid grid-cols-2 gap-2 mb-5">
              {/* Preview Toggle */}
              <button 
                onClick={() => setShowPathPreview(!showPathPreview)}
                className="clickable py-2 px-3 rounded-xl font-mono text-[8.5px] tracking-wider uppercase border transition-all duration-200 cursor-pointer flex items-center justify-between"
                style={{
                  borderColor: showPathPreview ? levelDef.guideColor : 'rgba(255,255,255,0.06)',
                  backgroundColor: showPathPreview ? `${levelDef.guideColor}0c` : 'rgba(255,255,255,0.02)',
                  color: showPathPreview ? levelDef.guideColor : 'rgba(255,255,255,0.4)',
                }}
              >
                <span>Guide Path:</span>
                <span className="font-bold">{showPathPreview ? 'ON' : 'OFF'}</span>
              </button>

              {/* Best Score Badge */}
              <div className="py-2 px-3 rounded-xl bg-white/2 border border-white/6 font-mono text-[8.5px] tracking-wider flex items-center justify-between text-white/40">
                <span className="uppercase text-left">Best Score:</span>
                <span className="font-bold text-right" style={{ color: levelDef.guideColor, textShadow: `0 0 8px ${levelDef.guideColor}40` }}>{highScore}%</span>
              </div>

              {/* Score History Span (Full Width) */}
              {scoreHistory.length > 0 && (
                <div className="col-span-2 py-2 px-3.5 rounded-xl bg-white/2 border border-white/6 font-mono text-[8px] tracking-wider flex items-center justify-between text-white/40">
                  <span className="uppercase">Recent Runs:</span>
                  <div className="flex gap-2">
                    {scoreHistory.slice(-5).map((s, i) => (
                      <span key={i} className="font-bold" style={{ color: s >= 82 ? '#4ADE80' : s >= 65 ? '#FBBF24' : '#F472B6' }}>{s}%</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action CTA Button */}
            <button 
              onClick={onStart} 
              className="clickable w-full py-3 text-bg font-mono font-bold text-[9.5px] tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: levelDef.guideColor, 
                boxShadow: `0 0 20px ${levelDef.guideColor}40`,
                textShadow: 'none'
              }}
            >
              Begin Round
            </button>
          </div>
        </div>
      )}

      {/* PLAYING HUD Overlay */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-2 left-3 z-30 font-mono text-[7px] tracking-widest uppercase select-none pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span>{currentTool.name}</span><span className="mx-1">·</span><span>Night Sky</span>
        </div>
      )}

      {/* GAME OVER overlay */}
      {gameState === 'OVER' && (
        <div 
          className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center p-6 select-none animate-fade-in" 
          style={{ backgroundColor: 'rgba(10, 14, 26, 0.94)', backdropFilter: 'blur(8px)' }}
        >
          <div className="w-full max-w-[340px] p-6 bg-[#0f1322]/90 border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col items-center">
            {/* Grade Circular Badge */}
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center font-mono font-bold text-2xl mb-4 bg-white/2 border"
              style={{
                color: gradeRef.current === 'S' ? '#FBBF24' : gradeRef.current === 'A' ? '#4ADE80' : gradeRef.current === 'B' ? '#60A5FA' : gradeRef.current === 'C' ? '#F472B6' : '#6B7280',
                borderColor: gradeRef.current === 'S' ? '#FBBF2444' : gradeRef.current === 'A' ? '#4ADE8044' : gradeRef.current === 'B' ? '#60A5FA44' : gradeRef.current === 'C' ? '#F472B644' : 'rgba(255,255,255,0.08)',
                boxShadow: '0 0 20px ' + (gradeRef.current === 'S' ? 'rgba(251,191,36,0.15)' : gradeRef.current === 'A' ? 'rgba(74,222,128,0.15)' : gradeRef.current === 'B' ? 'rgba(96,165,250,0.15)' : 'rgba(244,114,182,0.1)'),
              }}
            >
              {gradeRef.current}
            </div>

            {/* Score */}
            <h3 className="font-mono text-sm tracking-wider font-bold mb-1 uppercase text-white">
              {scoreRef.current}% Accuracy
            </h3>
            
            {/* Feedback message */}
            <p className="font-mono text-[8px] mb-5 leading-normal text-white/50 px-2 max-w-xs">
              {feedbackRef.current}
            </p>

            {/* Quick Stats Grid */}
            <div className="w-full grid grid-cols-2 gap-2 mb-5">
              <div className="py-2 px-3 rounded-xl bg-white/2 border border-white/6 font-mono text-[8px] tracking-wider flex items-center justify-between text-white/40">
                <span className="uppercase text-left">Level Best:</span>
                <span className="font-bold text-right" style={{ color: levelDef.guideColor, textShadow: `0 0 8px ${levelDef.guideColor}40` }}>{highScore}%</span>
              </div>
              <div className="py-2 px-3 rounded-xl bg-white/2 border border-white/6 font-mono text-[8px] tracking-wider flex items-center justify-between text-white/40">
                <span className="uppercase text-left">Grade:</span>
                <span className="font-bold text-right" style={{ color: '#FBBF24' }}>{gradeRef.current}</span>
              </div>

              {scoreHistory.length > 0 && (
                <div className="col-span-2 py-2 px-3.5 rounded-xl bg-white/2 border border-white/6 font-mono text-[8px] tracking-wider flex items-center justify-between text-white/40">
                  <span className="uppercase">Recent runs:</span>
                  <div className="flex gap-2">
                    {scoreHistory.slice(-5).map((s, i) => (
                      <span key={i} className="font-bold" style={{ color: s >= 82 ? '#4ADE80' : s >= 65 ? '#FBBF24' : '#F472B6' }}>{s}%</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action CTA Button */}
            <button 
              onClick={onStart} 
              className="clickable w-full py-3 text-bg font-mono font-bold text-[9.5px] tracking-[0.2em] uppercase rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
              style={{ 
                backgroundColor: levelDef.guideColor, 
                boxShadow: `0 0 20px ${levelDef.guideColor}40`,
                textShadow: 'none'
              }}
            >
              ↺ Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
