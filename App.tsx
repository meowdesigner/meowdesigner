
import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import { GameState } from './types.ts';
import { getMarketSentiment } from './services/geminiService.ts';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    combo: 0,
    gameOver: false,
    highScore: parseInt(localStorage.getItem('hyslash_high_score') || '0'),
    gameStarted: false,
    sentiment: "Awaiting Order Initialization...",
    countdown: null
  });

  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [flash, setFlash] = useState<{ color: string, active: boolean }>({ color: '', active: false });
  const flashTimeoutRef = useRef<number | null>(null);

  const startCountdown = () => {
    setGameState(prev => ({ 
      ...prev, 
      gameStarted: false, 
      gameOver: false, 
      score: 0,
      countdown: 3 
    }));
  };

  const goHome = () => {
    setGameState(prev => ({
      ...prev,
      gameStarted: false,
      gameOver: false,
      score: 0,
      countdown: null
    }));
  };

  useEffect(() => {
    if (gameState.countdown === null) return;

    if (gameState.countdown > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, countdown: (prev.countdown || 0) - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished (at 0)
      setGameState(prev => ({ ...prev, countdown: null, gameStarted: true }));
    }
  }, [gameState.countdown]);

  const handleGameOver = async (finalScore: number) => {
    setGameState(prev => {
      const newHigh = Math.max(prev.highScore, finalScore);
      localStorage.setItem('hyslash_high_score', newHigh.toString());
      return {
        ...prev,
        gameOver: true,
        score: finalScore,
        highScore: newHigh,
        sentiment: "Liquidation event triggered."
      };
    });

    setLoadingSentiment(true);
    const aiComment = await getMarketSentiment(finalScore, gameState.highScore);
    setGameState(prev => ({ ...prev, sentiment: aiComment }));
    setLoadingSentiment(false);
  };

  const updateScore = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
  }, []);

  const handleSlash = useCallback((color: string) => {
    setFlash({ color, active: true });
    
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current);
    }
    
    flashTimeoutRef.current = window.setTimeout(() => {
      setFlash(prev => ({ ...prev, active: false }));
    }, 150);
  }, []);

  const shareToX = () => {
    const text = `I just executed ${gameState.score.toLocaleString()} in volume on HYSLASH! 🟢⚡️\n\nMarket Sentiment: "${gameState.sentiment}"\n\nPure L1 execution. #Hyperliquid #HYPE $HYPE`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative w-screen h-screen bg-[#040406] select-none overflow-hidden text-white">
      {/* Smooth Background Mesh */}
      <div className="mesh-bg" />

      {/* Main Game Surface */}
      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onUpdateScore={updateScore}
        onSlash={handleSlash}
      />

      {/* Slash Flash Effect at Bottom */}
      <div 
        className={`absolute bottom-0 left-0 w-full h-40 pointer-events-none transition-opacity duration-150 ease-out`}
        style={{ 
          opacity: flash.active ? 0.6 : 0,
          background: `linear-gradient(to top, ${flash.color}, transparent)`
        }}
      />

      {/* UI Overlay */}
      <div className="absolute top-8 left-8">
        <div className="text-hyper-green text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Live Executed Volume</div>
        <div className="text-5xl font-black mono glow-green italic tracking-tighter text-hyper-green">
          ${gameState.score.toLocaleString()}
        </div>
      </div>

      <div className="absolute top-8 right-8 text-right">
        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">HLP Record</div>
        <div className="text-2xl font-bold mono text-slate-400">
          ${gameState.highScore.toLocaleString()}
        </div>
      </div>

      {/* Start Screen */}
      {!gameState.gameStarted && !gameState.gameOver && gameState.countdown === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-4">
          <div className="max-w-md w-full p-10 rounded-3xl border border-white/10 bg-[#060a08]/90 shadow-[0_0_120px_rgba(42,245,152,0.08)] text-center">
            <h1 className="text-7xl font-black mb-1 italic tracking-tighter leading-none uppercase">
              <span className="text-hyper-green">HY</span><span className="text-white">SLASH</span>
            </h1>
            <p className="text-slate-500 mb-12 text-[10px] font-bold uppercase tracking-[0.6em]">Sub-Millisecond Execution Engine</p>
            
            <div className="space-y-6 mb-12 text-left">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-hyper-green/10 border border-hyper-green/30 flex items-center justify-center text-hyper-green">
                  <i className="fas fa-bolt text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-sm">Execute Orders</div>
                  <div className="text-xs text-slate-500">Slash Green/Purple blobs to fill orders</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center text-white">
                  <i className="fas fa-droplet text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-sm">HYPE Logos</div>
                  <div className="text-xs text-slate-500">Capture the liquid HYPE for massive bonuses</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <i className="fas fa-skull-crossbones text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-sm">Avoid Rekt</div>
                  <div className="text-xs text-slate-500">Don't slash red liquidation icons</div>
                </div>
              </div>
            </div>

            <button 
              onClick={startCountdown}
              className="w-full py-5 btn-hyper rounded-2xl font-black text-xl uppercase tracking-widest active:scale-95 shadow-[0_10px_40px_-10px_rgba(42,245,152,0.5)]"
            >
              Initialize Position
            </button>
          </div>
        </div>
      )}

      {/* Countdown Overlay - Only show 3, 2, 1 */}
      {gameState.countdown !== null && gameState.countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div key={gameState.countdown} className="text-[12rem] font-black mono text-hyper-green glow-green italic animate-ping duration-1000">
            {gameState.countdown}
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-xl z-50 p-4">
          {/* Close/Home Button */}
          <button 
            onClick={goHome}
            className="absolute top-8 right-8 w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition-all active:scale-90 z-[60]"
            aria-label="Back to terminal"
          >
            <i className="fas fa-times text-xl text-white/60"></i>
          </button>

          <div className="max-w-lg w-full p-10 rounded-3xl border border-red-900/50 bg-[#080101] shadow-[0_0_150px_rgba(239,68,68,0.1)] text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-7xl font-black text-red-600 mb-2 italic tracking-tighter">REKT</h2>
            <p className="text-red-500/40 uppercase tracking-[0.3em] font-bold text-xs mb-8">Liquidation Engine Triggered</p>
            
            <div className="bg-white/5 rounded-2xl p-8 mb-10 border border-white/5 text-left">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Session Vol</div>
                  <div className="text-4xl font-black mono text-white">${gameState.score.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">HLP Record</div>
                  <div className="text-4xl font-black mono text-hyper-green">${gameState.highScore.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-6">
                <div className="text-[10px] text-hyper-green uppercase tracking-widest mb-3 font-bold">Terminal Feedback</div>
                <p className="text-slate-300 italic text-lg font-medium leading-relaxed">
                  {loadingSentiment ? (
                    <span className="flex items-center gap-3">
                      <i className="fas fa-circle-notch animate-spin text-hyper-green"></i>
                      Syncing with Mainnet...
                    </span>
                  ) : `"${gameState.sentiment}"`}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={startCountdown}
                className="flex-[1.5] py-5 bg-white text-black hover:bg-slate-200 transition-all rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95"
              >
                Re-Initialize
              </button>
              <button 
                onClick={shareToX}
                className="flex-1 py-5 bg-black text-white hover:bg-zinc-900 border border-white/10 transition-all rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <i className="fa-brands fa-x-twitter text-lg"></i>
                Share Stats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Bottom Bar */}
      <div className="absolute bottom-6 left-8 flex items-center gap-3 opacity-40">
        <div className="w-2 h-2 rounded-full bg-hyper-green animate-pulse"></div>
        <div className="text-[10px] mono text-slate-400 tracking-[0.2em] uppercase font-bold">
          Hyperliquid L1 // Node: Active // Latency: 0.0001ms
        </div>
      </div>
    </div>
  );
};

export default App;
