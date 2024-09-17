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
  const [capturedImgWithFrame, setCapturedImgWithFrame] = useState(null);
  const [isHorizontalScreen, setIsHorizontalScreen] = useState(false);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [size, setSize] = useState(16);

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
      collection(db, "techbook_qr_urls"),
      // collection(db, "Techbook_Photo_Booth_testing"),
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
              setCapturedImgWithFrame={setCapturedImgWithFrame}
            />
          }
        />
        <Route
          path="/camera"
          element={
            <CameraPage
              capturedImg={capturedImg}
              isHorizontalScreen={isHorizontalScreen}
              setCapturedImg={setCapturedImg}
              setCapturedImgWithFrame={setCapturedImgWithFrame}
              dx={dx}
              dy={dy}
              setDx={setDx}
              setDy={setDy}
              size={size}
              setSize={setSize}
            />
          }
        />
        <Route
          path="/output"
          element={
            <OutputPage
              url={url}
              setUrl={setUrl}
              capturedImgWithFrame={capturedImgWithFrame}
              isHorizontalScreen={isHorizontalScreen}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
