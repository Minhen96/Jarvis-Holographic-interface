import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { ParticleSystem } from './components/ParticleSystem';
import { UI } from './components/UI';
import { HandTrackerService } from './services/handTracking';
import { ParticleShape, HandData } from './types';
import { CAMERA_CONFIG, COLORS } from './constants';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.SPHERE);
  const [handDataState, setHandDataState] = useState<HandData>({ x: 0, y: 0, isDetected: false, isClenched: false, handSpread: 0.5 });
  
  // Use a ref for the physics loop to avoid React re-renders for every coordinate change
  const handDataRef = useRef<HandData>({ x: 0, y: 0, isDetected: false, isClenched: false, handSpread: 0.5 });
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Initialize Camera and Hand Tracking
    let tracker: HandTrackerService | null = null;

    const init = async () => {
      if (videoRef.current) {
        try {
          tracker = new HandTrackerService(videoRef.current, (data) => {
            // Update Ref for Physics
            handDataRef.current = data;
            // Update State for UI (throttled naturally by React batching mostly, 
            // but for a smooth HUD we allow updates. In a production app, we might throttle this state update)
            setHandDataState(data);
            
            if (loading) setLoading(false);
          });
          await tracker.initialize();
        } catch (error) {
          console.error("Failed to initialize MediaPipe:", error);
          setLoading(false); // Stop loading even on error to show UI
        }
      }
    };

    init();

    return () => {
      if (tracker) tracker.stop();
    };
  }, []);

  const handleMouseDown = () => {
     if (!handDataRef.current.isDetected) {
         handDataRef.current.isClenched = true;
         setHandDataState(prev => ({ ...prev, isClenched: true }));
     }
  };

  const handleMouseUp = () => {
      if (!handDataRef.current.isDetected) {
         handDataRef.current.isClenched = false;
         setHandDataState(prev => ({ ...prev, isClenched: false }));
     }
  }

  return (
    <div 
        className="w-full h-screen bg-black relative select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
    >
      {/* Hidden Video Element for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline />

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={CAMERA_CONFIG.position} fov={CAMERA_CONFIG.fov} />
          
          <color attach="background" args={[COLORS.background]} />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color={COLORS.primary} />
          
          <ParticleSystem shape={shape} handData={handDataRef} />
          
          {/* Fallback Orbit Controls enabled only when no hand is detected for manual mouse rotation */}
          {!handDataState.isDetected && (
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                rotateSpeed={0.5}
                autoRotate={false}
              />
          )}
        </Canvas>
      </div>

      {/* UI Overlay */}
      <UI 
        currentShape={shape} 
        setShape={setShape} 
        handData={handDataState} 
        loading={loading} 
      />
    </div>
  );
};

export default App;