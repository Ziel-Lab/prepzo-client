"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Points, Point } from '@react-three/drei';
import * as THREE from 'three';

// A glowing energy capsule with shimmering particles inside.
function GlowingCapsule() {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const particles = useMemo(() => {
    const temp = [];
    const radius = 0.3;
    const height = 0.3;
    for (let i = 0; i < 300; i++) {
      const t = Math.random() * Math.PI;
      const r = Math.random() * radius;
      const x = r * Math.cos(t);
      const y = Math.random() * height + 0.05;
      const z = r * Math.sin(t);
      temp.push({ x, y, z });
    }
    return temp;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle bobbing motion
      groupRef.current.position.y = -0.5 + Math.sin(t * 1.2) * 0.1;
    }
     if (lightRef.current) {
      // Pulsating light
      lightRef.current.intensity = 1.5 + Math.sin(t * 2) * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* This light will cast a glow on the ground */}
      <pointLight ref={lightRef} color="#00BFFF" distance={8} position={[0, -0.2, 0]} />

      {/* Top half - transparent with particles */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.3, 32, 1, true]} />
        <meshStandardMaterial transparent opacity={0.1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
        <meshStandardMaterial transparent opacity={0.1} roughness={0.2} />
      </mesh>
      
      {/* Shimmering particles inside the top half */}
       <Points limit={300}>
          <pointsMaterial color="#FFFFFF" size={0.015} transparent opacity={0.8} />
          {particles.map((particle, i) => (
             <Point key={i} position={[particle.x, particle.y, particle.z]} />
          ))}
       </Points>

      {/* Bottom half - glowing solid */}
      <mesh position={[0, 0, 0]}>
         <cylinderGeometry args={[0.3, 0.3, 0.3, 32]} />
         <meshStandardMaterial color="#00BFFF" emissive="#00BFFF" emissiveIntensity={3} toneMapped={false}/>
      </mesh>
       <mesh position={[0, 0, 0]}>
         <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, Math.PI/2, Math.PI/2]} />
         <meshStandardMaterial color="#00BFFF" emissive="#00BFFF" emissiveIntensity={3} toneMapped={false} />
      </mesh>

    </group>
  );
}

const TalkToAgentContent = () => {
  return (
    <div className="relative w-full h-[80vh] bg-gradient-to-br from-green-50 to-blue-50 rounded-xl shadow-inner">
      <Canvas
        camera={{ position: [0, 1, 5], fov: 50 }}
        shadows
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[5, 10, 7.5]}
          intensity={1.5}
          castShadow
        />
        <GlowingCapsule />
        <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            minPolarAngle={Math.PI / 2.2}
            maxPolarAngle={Math.PI / 1.8}
        />
         <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <shadowMaterial opacity={0.2} />
        </mesh>
      </Canvas>
       <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Synthesizing Energy...
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
         A new power source is materializing. Stand by for full activation.
        </p>
      </div>
    </div>
  );
};

export default TalkToAgentContent;
