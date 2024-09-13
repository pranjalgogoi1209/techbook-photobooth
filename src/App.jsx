import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Component to load and display the 3D model
function Model() {
  // Load the GLTF model from the public folder
  const { scene } = useGLTF("./../public/3d-model.glb");
  return <primitive object={scene} scale={1} />;
}

function App() {
  return (
    <Canvas style={{ height: "100vh" }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* 3D Model */}
      <Model />

      {/* Controls to rotate and zoom the model */}
      <OrbitControls />
    </Canvas>
  );
}

// GLTF loader hook
useGLTF.preload("./../public/3d-model.glb");

export default App;
