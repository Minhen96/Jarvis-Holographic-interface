import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleShape, HandData } from '../types';
import { COLORS, PARTICLE_COUNTS, THREE_COLOR_PRIMARY, THREE_COLOR_HOT } from '../constants';

interface ParticleSystemProps {
  shape: ParticleShape;
  handData: React.MutableRefObject<HandData>;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, handData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const auraRef = useRef<THREE.Points>(null);
  
  // Physics parameters
  const targetPositionsRef = useRef<Float32Array | null>(null);
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  
  const count = PARTICLE_COUNTS.CORE;
  const auraCount = PARTICLE_COUNTS.AURA;

  // --- Geometry Generation Helper ---
  const generateTargetPositions = (type: ParticleShape, pCount: number, radius = 10) => {
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const i3 = i * 3;
      let x = 0, y = 0, z = 0;

      switch (type) {
        case ParticleShape.SPHERE: {
          const phi = Math.acos(-1 + (2 * i) / pCount);
          const theta = Math.sqrt(pCount * Math.PI) * phi;
          x = radius * Math.cos(theta) * Math.sin(phi);
          y = radius * Math.sin(theta) * Math.sin(phi);
          z = radius * Math.cos(phi);
          break;
        }
        case ParticleShape.CUBE: {
          x = (Math.random() - 0.5) * radius * 1.5;
          y = (Math.random() - 0.5) * radius * 1.5;
          z = (Math.random() - 0.5) * radius * 1.5;
          break;
        }
        case ParticleShape.TORUS: {
          const u = Math.random() * Math.PI * 2;
          const v = Math.random() * Math.PI * 2;
          const tubeRadius = radius * 0.3;
          x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
          y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
          z = tubeRadius * Math.sin(v);
          break;
        }
        case ParticleShape.GALAXY: {
            const armCount = 3;
            const spin = i / pCount * armCount * Math.PI * 2;
            const r = (i / pCount) * radius;
            const randomOffset = (Math.random() - 0.5) * (radius * 0.2);
            x = r * Math.cos(spin) + randomOffset;
            y = (Math.random() - 0.5) * (r * 0.2); // Flat galaxy
            z = r * Math.sin(spin) + randomOffset;
            break;
        }
        case ParticleShape.BIG_BANG:
        default: {
          const r = Math.random() * radius * 2;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
          break;
        }
      }
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }
    return positions;
  };

  // --- Initialization ---
  useMemo(() => {
    // initialize arrays
    currentPositionsRef.current = generateTargetPositions(ParticleShape.BIG_BANG, count);
    velocitiesRef.current = new Float32Array(count * 3).fill(0);
    // Initial target
    targetPositionsRef.current = generateTargetPositions(shape, count);
  }, []); // Run once

  // --- Shape Update Effect ---
  useEffect(() => {
    targetPositionsRef.current = generateTargetPositions(shape, count);
  }, [shape, count]);

  // --- Aura Geometry (Static-ish, just follows rotation) ---
  const auraGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = generateTargetPositions(ParticleShape.SPHERE, auraCount, 12);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [auraCount]);

  // --- Core Geometry Setup ---
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(currentPositionsRef.current!, 3));
    const colors = new Float32Array(count * 3);
    // Initialize cyan
    for(let i=0; i<count; i++) {
        colors[i*3] = THREE_COLOR_PRIMARY.r;
        colors[i*3+1] = THREE_COLOR_PRIMARY.g;
        colors[i*3+2] = THREE_COLOR_PRIMARY.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  // --- Animation Loop ---
  useFrame((state) => {
    if (!pointsRef.current || !currentPositionsRef.current || !targetPositionsRef.current || !velocitiesRef.current) return;

    const { x: handX, y: handY, isClenched, isDetected, handSpread } = handData.current;
    
    // Rotation Logic (Hand acts as joystick)
    const targetRotX = isDetected ? -handY * 1.5 : (state.mouse.y * 1.0);
    const targetRotY = isDetected ? handX * 1.5 : (state.mouse.x * 1.0);
    
    // Smoothly interpolate rotation
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetRotX, 0.1);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetRotY, 0.1);

    // Scaling Logic (Expand Hand = Zoom In, Clench = Zoom Out)
    // handSpread is 0 (Fist) to 1 (Open)
    // Map 0 -> 0.4 (small)
    // Map 1 -> 1.5 (large)
    const targetScale = isDetected ? 0.4 + (handSpread * 1.1) : 1.0;
    const lerpSpeed = 0.05;
    
    pointsRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), lerpSpeed);

    // Also rotate/scale Aura
    if (auraRef.current) {
        auraRef.current.rotation.x = pointsRef.current.rotation.x * 0.8;
        auraRef.current.rotation.y = pointsRef.current.rotation.y * 0.8;
        auraRef.current.scale.copy(pointsRef.current.scale);
    }

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const targets = targetPositionsRef.current;
    const vels = velocitiesRef.current;
    
    // "Mouse Clench" fallback
    const effectiveClench = isDetected ? isClenched : false; 

    // Physics constants
    const attraction = effectiveClench ? 0.2 : 0.03; // Pull to target
    const damping = effectiveClench ? 0.85 : 0.92; // Friction
    const noiseAmt = effectiveClench ? 0.5 : 0.02; // Random wiggle
    const blackHoleStrength = 0.8;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let tx = targets[i3];
      let ty = targets[i3 + 1];
      let tz = targets[i3 + 2];

      if (effectiveClench) {
        // Black hole mode: Target is center (0,0,0) with heavy swirl
        tx = 0;
        ty = 0;
        tz = 0;
        
        // Add swirl force to velocity
        const px = positions[i3];
        const pz = positions[i3+2];
        vels[i3] += -pz * blackHoleStrength * 0.1; // Tangential force
        vels[i3+2] += px * blackHoleStrength * 0.1;
      }

      // Acceleration towards target
      const ax = (tx - positions[i3]) * attraction;
      const ay = (ty - positions[i3 + 1]) * attraction;
      const az = (tz - positions[i3 + 2]) * attraction;

      // Random noise (Brownian motion)
      const nx = (Math.random() - 0.5) * noiseAmt;
      const ny = (Math.random() - 0.5) * noiseAmt;
      const nz = (Math.random() - 0.5) * noiseAmt;

      // Update Velocity
      vels[i3] += ax + nx;
      vels[i3 + 1] += ay + ny;
      vels[i3 + 2] += az + nz;

      // Damping
      vels[i3] *= damping;
      vels[i3 + 1] *= damping;
      vels[i3 + 2] *= damping;

      // Update Position
      positions[i3] += vels[i3];
      positions[i3 + 1] += vels[i3 + 1];
      positions[i3 + 2] += vels[i3 + 2];

      // Dynamic Coloring based on Velocity Magnitude
      const speed = Math.sqrt(vels[i3]**2 + vels[i3+1]**2 + vels[i3+2]**2);
      // Threshold for "Hot"
      const t = Math.min(speed * 3.0, 1); // 0 = Cyan, 1 = White
      
      colors[i3] = THREE.MathUtils.lerp(THREE_COLOR_PRIMARY.r, THREE_COLOR_HOT.r, t);
      colors[i3+1] = THREE.MathUtils.lerp(THREE_COLOR_PRIMARY.g, THREE_COLOR_HOT.g, t);
      colors[i3+2] = THREE.MathUtils.lerp(THREE_COLOR_PRIMARY.b, THREE_COLOR_HOT.b, t);
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <>
      {/* Core Particles */}
      <points ref={pointsRef} geometry={geometry}>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Aura Particles (Glow effect) */}
      <points ref={auraRef} geometry={auraGeometry}>
         <pointsMaterial
          size={0.3}
          color={COLORS.primary}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </>
  );
};