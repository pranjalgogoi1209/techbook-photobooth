import React, { useEffect, useState } from "react";
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
          element={<HomePage setUrl={setUrl} setCapturedImg={setCapturedImg} />}
        />
        <Route
          path="/camera"
          element={
            <CameraPage
              capturedImg={capturedImg}
              setCapturedImg={setCapturedImg}
            />
          }
        />
        <Route
          path="/output"
          element={
            <OutputPage url={url} setUrl={setUrl} capturedImg={capturedImg} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
