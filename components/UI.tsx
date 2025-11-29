import React from 'react';
import { ParticleShape, HandData } from '../types';
import { Activity, Radio, Hand, Grip, MousePointer2, Cpu } from 'lucide-react';
import { COLORS } from '../constants';

interface UIProps {
  currentShape: ParticleShape;
  setShape: (s: ParticleShape) => void;
  handData: HandData;
  loading: boolean;
}

export const UI: React.FC<UIProps> = ({ currentShape, setShape, handData, loading }) => {
  return (
    <>
      {/* --- HUD / Reticle --- */}
      {!loading && (
        <div 
            className="pointer-events-none fixed z-40 transition-transform duration-75 ease-out"
            style={{
                left: '50%',
                top: '50%',
                transform: `translate(${handData.x * window.innerWidth/2}px, ${-handData.y * window.innerHeight/2}px)`
            }}
        >
            <div className={`relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${handData.isClenched ? 'scale-75' : 'scale-100'}`}>
                {/* Outer Ring */}
                <div className={`w-16 h-16 rounded-full border border-cyan-400 border-opacity-50 animate-spin-slow ${handData.isClenched ? 'border-red-500' : ''}`} style={{ animationDuration: '3s' }}></div>
                {/* Inner Crosshair */}
                <div className="absolute w-2 h-2 bg-cyan-200 rounded-full shadow-[0_0_10px_#00f3ff]"></div>
                {/* Decoration */}
                <div className="absolute top-0 w-full h-full border-t border-b border-transparent border-t-cyan-500 opacity-60"></div>
                
                {/* Status Text */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] text-cyan-400 font-sci-fi tracking-widest whitespace-nowrap">
                   {handData.isDetected ? (handData.isClenched ? "CLENCH DETECTED" : "TRACKING") : "NO SIGNAL"}
                </div>
            </div>
        </div>
      )}

      {/* --- Main Layout --- */}
      <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 z-50">
        
        {/* Header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-4xl font-sci-fi text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-black tracking-wider drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
              JARVIS
            </h1>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-cyan-700 text-xs font-mono tracking-[0.2em]">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>

        {/* Input Warning Overlay */}
        {!loading && !handData.isDetected && (
            <div className="absolute top-24 left-6 max-w-xs p-4 border border-red-900/50 bg-black/40 backdrop-blur-sm rounded text-red-400 font-mono text-xs">
                <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} className="animate-pulse" />
                    <span>INPUT REQUIRED</span>
                </div>
                <p>Hand tracking signal lost. Switching to manual fallback.</p>
                <div className="flex items-center gap-2 mt-2 text-cyan-500/80">
                    <MousePointer2 size={12} />
                    <span>Mouse control enabled</span>
                </div>
            </div>
        )}

        {/* Control Panel (Right Side) */}
        <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 p-1 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] min-w-[200px]">
             <div className="bg-cyan-900/20 p-3 mb-1 rounded flex items-center justify-between border-b border-cyan-500/20">
                <span className="text-cyan-400 font-sci-fi text-sm">FORMATION</span>
                <Cpu size={16} className="text-cyan-400" />
             </div>
             
             <div className="flex flex-col gap-1 p-2">
                {Object.values(ParticleShape).map((shape) => (
                    <button
                        key={shape}
                        onClick={() => setShape(shape)}
                        className={`
                            group relative overflow-hidden px-4 py-3 text-left transition-all duration-300 rounded
                            ${currentShape === shape 
                                ? 'bg-cyan-500/20 text-cyan-100 border-l-2 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.2)]' 
                                : 'text-cyan-700 hover:text-cyan-300 hover:bg-cyan-900/30 border-l-2 border-transparent'}
                        `}
                    >
                        <span className="relative z-10 text-xs font-bold tracking-widest">{shape}</span>
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                    </button>
                ))}
             </div>
          </div>

          {/* Instructions */}
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 p-4 rounded-lg">
             <div className="text-[10px] text-cyan-600 font-mono space-y-2">
                <div className="flex items-center gap-2">
                    <Hand size={14} />
                    <span>MOVE HAND TO ROTATE</span>
                </div>
                <div className="flex items-center gap-2">
                    <Grip size={14} />
                    <span>CLENCH FIST TO COLLAPSE</span>
                </div>
                <div className="flex items-center gap-2">
                    <Radio size={14} />
                    <span>OPEN HAND TO RESET</span>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
             <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-cyan-900 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-4 border-cyan-800 rounded-full"></div>
                <div className="absolute inset-4 border-b-4 border-cyan-200 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
             </div>
             <h2 className="text-2xl text-cyan-400 font-sci-fi tracking-[0.3em] animate-pulse">INITIALIZING</h2>
             <p className="text-cyan-800 font-mono text-sm mt-2">LOADING NEURAL INTERFACE...</p>
        </div>
      )}
    </>
  );
};
