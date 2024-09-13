import React, { useState, useEffect } from "react";
import "./model3d.scss";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Component to load and display the 3D model
function Model({ position, rotation }) {
  // Load the GLTF model from the public folder
  const { scene } = useGLTF("/3d-model.glb");
  return (
    <primitive
      object={scene}
      scale={5}
      position={position}
      rotation={rotation}
    />
  );
}

export default function Model3d() {
  // State to track the position of the model
  const [position, setPosition] = useState([0, -2, 0]); // Starting at [0, 0, 0]
  // State to track the rotation of the model
  const [rotation, setRotation] = useState([0, 4.5, 0]); // Starting rotation [0, 0, 0]

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
    <div className="Model3d">
      <Canvas>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* 3D Model with dynamic position and rotation */}
        <Model position={position} rotation={rotation} />

        {/* Controls to rotate and zoom the model */}
        <OrbitControls
          enableZoom={true}
          zoomSpeed={0.6}
          enableRotate={true}
          rotateSpeed={1}
          enablePan={true}
          panSpeed={1.5}
          screenSpacePanning={true}
          minPolarAngle={1}
          maxPolarAngle={2}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}

// GLTF loader hook
useGLTF.preload("/3d-model.glb");
