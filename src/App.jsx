import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage/HomePage";
import CameraPage from "./pages/cameraPage/CameraPage";
import OutputPage from "./pages/outputPage/OutputPage";

function App() {
  console.log(import.meta.env.VITE_FIREBASE_API_KEY);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/camera" element={<CameraPage />} />
        <Route path="/output" element={<OutputPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
