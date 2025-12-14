import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Box, Torus } from '@react-three/drei';
import * as THREE from 'three';

// Animated floating sphere
const FloatingSphere: React.FC<{ position: [number, number, number]; color: string; speed?: number; size?: number }> = ({ 
  position, 
  color, 
  speed = 1,
  size = 1 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.2;
      meshRef.current.rotation.y = Math.cos(state.clock.elapsedTime * speed * 0.2) * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[size, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
};

// Animated box
const FloatingBox: React.FC<{ position: [number, number, number]; color: string; speed?: number; size?: number }> = ({ 
  position, 
  color, 
  speed = 1,
  size = 0.8 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
    }
  });

  return (
    <Float speed={speed * 0.7} rotationIntensity={1} floatIntensity={1.5}>
      <Box ref={meshRef} args={[size, size, size]} position={position}>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </Box>
    </Float>
  );
};

// Animated torus
const FloatingTorus: React.FC<{ position: [number, number, number]; color: string; speed?: number }> = ({ 
  position, 
  color, 
  speed = 1 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.4;
      meshRef.current.rotation.z = state.clock.elapsedTime * speed * 0.2;
    }
  });

  return (
    <Float speed={speed * 0.8} rotationIntensity={0.8} floatIntensity={2}>
      <Torus ref={meshRef} args={[0.6, 0.2, 16, 32]} position={position}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.7} />
      </Torus>
    </Float>
  );
};

// Particle system
const Particles: React.FC<{ count?: number }> = ({ count = 100 }) => {
  const points = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#FF6B6B" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
};

// Main 3D Scene
const Scene3D: React.FC = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#FF6B6B" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#6BCB77" />
      <directionalLight position={[0, 5, 5]} intensity={0.8} />

      {/* 3D Objects */}
      <FloatingSphere position={[-3, 1, -2]} color="#FF6B6B" speed={1.2} size={0.8} />
      <FloatingSphere position={[3, -1, -3]} color="#6BCB77" speed={0.8} size={0.6} />
      <FloatingSphere position={[0, 2, -4]} color="#FFD93D" speed={1} size={0.5} />
      
      <FloatingBox position={[-2, -1.5, -2]} color="#2D3A5F" speed={0.9} size={0.6} />
      <FloatingBox position={[2.5, 1.5, -3]} color="#FF6B6B" speed={1.1} size={0.5} />
      
      <FloatingTorus position={[0, -0.5, -2]} color="#6BCB77" speed={0.7} />
      <FloatingTorus position={[-2.5, 2, -4]} color="#FFD93D" speed={1.3} />

      {/* Particles */}
      <Particles count={150} />
    </>
  );
};

// Hero 3D Background Component
export const Hero3DBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-60">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene3D />
      </Canvas>
    </div>
  );
};

// Scroll-triggered 3D scene
export const ScrollScene3D: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-30">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#FF6B6B" />
        
        <group rotation-y={scrollProgress * Math.PI * 2}>
          <FloatingSphere position={[2, 0, 0]} color="#FF6B6B" speed={0.5} size={0.4} />
          <FloatingBox position={[-2, 0, 0]} color="#6BCB77" speed={0.5} size={0.3} />
        </group>
      </Canvas>
    </div>
  );
};

export default Hero3DBackground;
