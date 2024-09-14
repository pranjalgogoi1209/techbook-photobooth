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
  useEffect(()=>{
    console.log(url);
  },[url])

  useEffect(()=>{
    const unsubscribe = onSnapshot(collection(db,'Techbook_Photo_Booth_testing'),snapshot=>{
      try {
      const alldata = snapshot.docs.map(doc=>({
          ...doc.data(),
          id:doc.id
      }));
      
      console.log(alldata);   
      } catch (error) {
          console.log(error)
      }
  })

  return ()=> unsubscribe();
  },[])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/camera" element={<CameraPage setUrl={setUrl}/>} />
        <Route path="/output" element={<OutputPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
