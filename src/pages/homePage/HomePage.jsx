import React from "react";
import "./homePage.scss";
import { Link } from "react-router-dom";

import homeBg from "./../../assets/homePage/homeBg.png";
import logo from "./../../assets/logo.png";
import startBtn from "./../../assets/homePage/startBtn.png";

export default function HomePage() {
  return (
    <div className="HomePage flex-col-center">
      {/* bg */}
      <div className="homeBgContainer flex-row-center">
        <img src={homeBg} alt="homeBg" />
      </div>

      {/* main container */}
      <div className="mainContainer flex-col-center">
        {/* logo */}
        <div className="logoContainer flex-row-center">
          <img src={logo} alt="logo" />
        </div>

        {/* btn */}
        <Link to="/camera" className="startBtnContainer flex-row-center">
          <img src={startBtn} alt="startBtn" />
        </Link>
      </div>
    </div>
  );
}
