import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/homePage/HomePage";
import CameraPage from "./pages/cameraPage/CameraPage";
import OutputPage from "./pages/outputPage/OutputPage";

import { onSnapshot } from "firebase/firestore";
import { collection } from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [url, setUrl] = useState();

  const [capturedImg, setCapturedImg] = useState("");

  const [capturedImgWithFrame, setCapturedImgWithFrame] = useState(null);

  const [isHorizontalScreen, setIsHorizontalScreen] = useState(false);

  /*
   * Model position
   */
  const [dx, setDx] = useState(80);
  const [dy, setDy] = useState(50);

  /*
   * Model size
   */
  const [size, setSize] = useState(25);

  /*
   * ---------------------------------------------------------
   * SCREEN SIZE
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Do not put isHorizontalScreen in the dependency array.
   * Otherwise this effect updates the same state that
   * triggers the effect.
   */

  useEffect(() => {
    const checkScreenSize = () => {
      setIsHorizontalScreen(window.innerWidth >= 1100);
    };

    checkScreenSize();

    /*
     * Optional but recommended:
     * update if the browser is resized.
     */
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * FIREBASE QR URL LISTENER
   * ---------------------------------------------------------
   */

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
      },
    );

    return () => unsubscribe();
  }, []);

  /*
   * ---------------------------------------------------------
   * ROUTES
   * ---------------------------------------------------------
   */

  return (
    <BrowserRouter>
      <Routes>
        {/* HOME */}
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

        {/* CAMERA */}
        <Route
          path="/camera"
          element={
            <CameraPage
              capturedImg={capturedImg}
              isHorizontalScreen={isHorizontalScreen}
              setCapturedImg={setCapturedImg}
              setCapturedImgWithFrame={setCapturedImgWithFrame}
              /*
               * Model position
               */
              dx={dx}
              dy={dy}
              setDx={setDx}
              setDy={setDy}
              /*
               * Model size
               */
              size={size}
              setSize={setSize}
            />
          }
        />

        {/* OUTPUT */}
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
