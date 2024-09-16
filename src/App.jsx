import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/homePage/HomePage";
import CameraPage from "./pages/cameraPage/CameraPage";
import OutputPage from "./pages/outputPage/OutputPage";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [url, setUrl] = useState();
  const [capturedImg, setCapturedImg] = useState("");
  const [isHorizontalScreen, setIsHorizontalScreen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1100) {
      setIsHorizontalScreen(true);
    } else {
      setIsHorizontalScreen(false);
    }
  }, [isHorizontalScreen]);

  console.log(isHorizontalScreen);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "Techbook_Photo_Booth_testing"),
      (snapshot) => {
        try {
          let alldata = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          }));
          alldata = alldata.sort((a, b) => b.createdAt - a.createdAt);
          console.log(alldata);
        } catch (error) {
          console.log(error);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              setUrl={setUrl}
              setCapturedImg={setCapturedImg}
              isHorizontalScreen={isHorizontalScreen}
            />
          }
        />
        <Route
          path="/camera"
          element={
            <CameraPage
              capturedImg={capturedImg}
              setCapturedImg={setCapturedImg}
              isHorizontalScreen={isHorizontalScreen}
            />
          }
        />
        <Route
          path="/output"
          element={
            <OutputPage
              url={url}
              setUrl={setUrl}
              capturedImg={capturedImg}
              isHorizontalScreen={isHorizontalScreen}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
