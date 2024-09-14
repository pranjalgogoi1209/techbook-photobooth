import React, { useState, useEffect } from "react";
import "./model3d.scss";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

// Component to load and display the 3D model
function Model({ position, rotation }) {
  // Load the GLTF model from the public folder
  const { scene, materials } = useGLTF("/3d-model.glb");

  // Force the model to use double-sided materials for both front and back visibility
  if (materials) {
    Object.values(materials).forEach((material) => {
      material.side = THREE.DoubleSide; // This ensures that both sides of the model are rendered
    });
  }

  return (
    <primitive
      object={scene}
      scale={3}
      position={position}
      rotation={rotation}
    />
  );
}

export default function Model3d() {
  const [position, setPosition] = useState([-0.7, -3, 0]);
  const [rotation, setRotation] = useState([0, 0.2, 0]);

  // Function to handle arrow key presses and update the position
  const handleKeyDown = (event) => {
    setPosition((prevPosition) => {
      let newPosition = [...prevPosition];
      switch (event.key) {
        case "ArrowUp":
          newPosition[1] += 0.5; // Move up
          break;
        case "ArrowDown":
          newPosition[1] -= 0.5; // Move down
          break;
        case "ArrowLeft":
          newPosition[0] -= 0.5; // Move left
          break;
        case "ArrowRight":
          newPosition[0] += 0.5; // Move right
          break;
        default:
          return prevPosition; // No change if other keys
      }
      return newPosition;
    });
  };

  // Add event listener for keyboard inputs
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="Model3d flex-col-center">
      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping, // Add tone mapping for better color accuracy
          outputEncoding: THREE.sRGBEncoding, // Ensure correct color space
        }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={1} />{" "}
        {/* Reduced ambient light to let environment light play a bigger role */}
        {/* Directional Light from the front */}
        <directionalLight position={[0, 5, 10]} intensity={4.5} castShadow />
        {/* Directional Light from the back */}
        <directionalLight
          position={[0, 10, -10]}
          intensity={4.5} // Lower intensity for balance
        />
        {/* Environment for PBR materials */}
        <Environment preset="sunset" />
        {/* 3D Model with dynamic position and rotation */}
        <Model position={position} rotation={rotation} />
        {/* Controls to rotate and zoom the model */}
        <OrbitControls
          enableZoom={true}
          zoomSpeed={0.5}
          enableRotate={true}
          rotateSpeed={0.5}
          enablePan={true}
          panSpeed={1}
          screenSpacePanning={true}
          minPolarAngle={1}
          maxPolarAngle={2}
          minDistance={4}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}

// GLTF loader hook
useGLTF.preload("/3d-model.glb");
