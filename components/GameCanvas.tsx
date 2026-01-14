
import React, { useEffect, useRef, useState } from 'react';
import { Entity, GameState, Particle } from '../types';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  gameState: GameState;
  onUpdateScore: (score: number) => void;
  onSlash?: (color: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, gameState, onUpdateScore, onSlash }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entities = useRef<Entity[]>([]);
  const particles = useRef<Particle[]>([]);
  const trail = useRef<{ x: number, y: number, time: number }[]>([]);
  const lastMousePos = useRef<{ x: number, y: number } | null>(null);
  const nextId = useRef(0);
  const frameCount = useRef(0);
  const requestRef = useRef<number>();

  // Hyperliquid Colors
  const COLORS = {
    GREEN: '#2af598',
    PURPLE: '#9d4edd',
    REKT: '#ff4d4d',
    HYPE: '#ffffff',
    BG_GRID: 'rgba(42, 245, 152, 0.03)'
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const spawnEntity = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const typeRand = Math.random();
    
    let type: Entity['type'] = 'buy';
    if (typeRand > 0.96) type = 'hype';
    else if (typeRand > 0.85) type = 'rekt';
    else if (typeRand > 0.45) type = 'sell';

    entities.current.push({
      id: nextId.current++,
      x: width / 2 + (Math.random() - 0.5) * (width * 0.7),
      y: height + 60,
      vx: (Math.random() - 0.5) * 7,
      vy: -16 - Math.random() * 9,
      size: type === 'hype' ? 45 : type === 'rekt' ? 40 : 35,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
      type,
      isSliced: false
    });
  };

  const createParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1.0,
        color
      });
    }
  };

  const checkSlashes = (x1: number, y1: number, x2: number, y2: number) => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    entities.current.forEach(e => {
      if (e.isSliced) return;

      const dist = Math.abs((y2 - y1) * e.x - (x2 - x1) * e.y + x2 * y1 - y2 * x1) / 
                   Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
      
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const distToMid = Math.sqrt(Math.pow(e.x - midX, 2) + Math.pow(e.y - midY, 2));

      if (dist < e.size && distToMid < e.size * 1.8) {
        e.isSliced = true;
        const color = e.type === 'buy' ? COLORS.GREEN : e.type === 'sell' ? COLORS.PURPLE : e.type === 'hype' ? COLORS.HYPE : COLORS.REKT;
        
        if (onSlash) onSlash(color);

        if (e.type === 'rekt') {
          createParticles(e.x, e.y, COLORS.REKT);
          onGameOver(gameState.score);
        } else {
          const points = e.type === 'hype' ? 7500 : 1250;
          createParticles(e.x, e.y, color);
          onUpdateScore(gameState.score + points);
        }
      }
    });
  };

  const update = () => {
    if (gameState.gameOver || !gameState.gameStarted) return;
    frameCount.current++;
    
    const spawnRate = Math.max(8, 45 - Math.floor(gameState.score / 25000));
    if (frameCount.current % spawnRate === 0) {
      spawnEntity();
    }

    entities.current = entities.current.filter(e => {
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.28;
      e.rotation += e.rotationSpeed;
      return e.y < window.innerHeight + 120;
    });

    particles.current = particles.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.025;
      return p.life > 0;
    });

    const now = Date.now();
    trail.current = trail.current.filter(t => now - t.time < 180);
  };

  const drawHypeLogo = (ctx: CanvasRenderingContext2D, size: number) => {
    // Custom path approximating the liquid blob HYPE logo provided
    ctx.beginPath();
    const w = size * 1.2;
    const h = size * 0.8;
    
    ctx.moveTo(-w * 0.7, -h * 0.2);
    ctx.bezierCurveTo(-w * 1.0, -h * 1.0, -w * 0.2, -h * 1.0, 0, -h * 0.3);
    ctx.bezierCurveTo(w * 0.2, -h * 1.0, w * 1.0, -h * 1.0, w * 0.7, -h * 0.2);
    ctx.bezierCurveTo(w * 0.5, 0, w * 1.0, h * 0.8, w * 0.6, h * 1.0);
    ctx.bezierCurveTo(w * 0.2, h * 1.2, 0, h * 0.3, -w * 0.2, h * 1.0);
    ctx.bezierCurveTo(-w * 0.6, h * 1.2, -w * 1.0, h * 0.8, -w * 0.7, -h * 0.2);
    ctx.fill();
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);

    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = COLORS.BG_GRID;
    for (let i = 0; i < 25; i++) {
      const y = (frameCount.current * 0.4 + i * 40) % height;
      ctx.fillText('0.0001ms TICK FILL HL_L1_NODE_821 EXECUTE', 15, y);
      ctx.fillText('3421.90 USD | PURP VOLUME PUMPING', width - 240, height - y);
    }

    if (trail.current.length > 1) {
      ctx.beginPath();
      const gradient = ctx.createLinearGradient(
        trail.current[0].x, trail.current[0].y, 
        trail.current[trail.current.length-1].x, trail.current[trail.current.length-1].y
      );
      gradient.addColorStop(0, COLORS.GREEN);
      gradient.addColorStop(1, 'rgba(42, 245, 152, 0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.moveTo(trail.current[0].x, trail.current[0].y);
      for (let i = 1; i < trail.current.length; i++) {
        ctx.lineTo(trail.current[i].x, trail.current[i].y);
      }
      ctx.stroke();
    }

    entities.current.forEach(e => {
      if (e.isSliced) return;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.rotation);
      
      ctx.shadowBlur = 18;
      if (e.type === 'buy') {
        ctx.fillStyle = COLORS.GREEN;
        ctx.shadowColor = COLORS.GREEN;
        // Draw rounded rectangle for more liquid feel
        ctx.beginPath();
        ctx.roundRect(-e.size/2, -e.size/2, e.size, e.size, 8);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Space Grotesk';
        ctx.fillText('B', -6, 7);
      } else if (e.type === 'sell') {
        ctx.fillStyle = COLORS.PURPLE;
        ctx.shadowColor = COLORS.PURPLE;
        ctx.beginPath();
        ctx.roundRect(-e.size/2, -e.size/2, e.size, e.size, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Space Grotesk';
        ctx.fillText('S', -6, 7);
      } else if (e.type === 'hype') {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = COLORS.GREEN;
        ctx.shadowBlur = 25;
        drawHypeLogo(ctx, e.size);
      } else if (e.type === 'rekt') {
        ctx.fillStyle = COLORS.REKT;
        ctx.shadowColor = COLORS.REKT;
        ctx.beginPath();
        ctx.arc(0, 0, e.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Space Grotesk';
        ctx.fillText('REKT', -13, 4);
      }
      ctx.restore();
    });

    particles.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState]);

  const handleInput = (x: number, y: number) => {
    const now = Date.now();
    trail.current.push({ x, y, time: now });
    if (lastMousePos.current) {
      checkSlashes(lastMousePos.current.x, lastMousePos.current.y, x, y);
    }
    lastMousePos.current = { x, y };
  };

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full block cursor-none"
      onMouseMove={(e) => handleInput(e.clientX, e.clientY)}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleInput(touch.clientX, touch.clientY);
      }}
      onMouseDown={(e) => { lastMousePos.current = { x: e.clientX, y: e.clientY }; }}
      onMouseUp={() => { lastMousePos.current = null; }}
    />
  );
};

export default GameCanvas;
