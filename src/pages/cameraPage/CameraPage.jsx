import React from "react";

import captureBtn from "./../../assets/cameraPage/captureBtn.png";
import retakeBtn from "./../../assets/cameraPage/retakeBtn.png";
import submitBtn from "./../../assets/cameraPage/submitBtn.png";
import cameraPageBg from "./../../assets/cameraPage/cameraPageBg.png";
import logo from "./../../assets/logo.png";
import { Link } from "react-router-dom";


export default function CameraPage() {
  return (
    <div className="CameraPage flex-col-center">
      {/* bg */}
      <div className="cameraPageBgContainer flex-row-center">
        <img src={cameraPageBg} alt="cameraPageBg" />
      </div>

      {/* main container */}
      <div className="mainContainer flex-col-center">
        {/* logo */}
        <div className="logoContainer flex-row-center">
          <img src={logo} alt="logo" />
        </div>

        {/* btn */}
        <Link to="/camera" className="startBtnContainer flex-row-center">
          {/* <img src={startBtn} alt="startBtn" /> */}
        </Link>
      </div>
    </div>
  );
}
