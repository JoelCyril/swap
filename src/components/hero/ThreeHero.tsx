import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import { useRef, Suspense } from "react";
import type { Mesh, Group } from "three";

function SwapRing() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.4;
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.15;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[1.6, 0.4, 32, 128]} />
        <MeshDistortMaterial
          color="#F5921E"
          roughness={0.2}
          metalness={0.4}
          distort={0.25}
          speed={1.5}
        />
      </mesh>
    </group>
  );
}

function FloatingBlob({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = clock.getElapsedTime() * 0.5;
      ref.current.rotation.y = clock.getElapsedTime() * 0.7;
    }
  });
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.2}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.6}
          flatShading
        />
      </mesh>
    </Float>
  );
}

export function ThreeHero() {
  return (
    <div className="absolute inset-0 h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} color="#fff" />
          <pointLight position={[-5, -3, 2]} intensity={1} color="#FFB366" />

          <SwapRing />
          <FloatingBlob position={[-2.8, 1.4, 0.5]} color="#F5921E" scale={0.9} />
          <FloatingBlob position={[2.6, -1.2, 0.8]} color="#FFB366" scale={1.1} />
          <FloatingBlob position={[2.2, 1.7, -0.5]} color="#FFD4A3" scale={0.7} />
          <FloatingBlob position={[-2.4, -1.5, -0.4]} color="#E8751A" scale={0.8} />

          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}
