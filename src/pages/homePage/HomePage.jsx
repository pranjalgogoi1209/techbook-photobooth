import React, { useEffect } from "react";
import "./homePage.scss";
import { Link } from "react-router-dom";

import homeBg from "./../../assets/homePage/homeBg.png";
import logo from "./../../assets/logo.png";
import startBtn from "./../../assets/homePage/startBtn.png";
import homeLaptopBg from "./../../assets/homePage/homeLaptopBg.png";

export default function HomePage({
  setUrl,
  setCapturedImg,
  setCapturedImgWithFrame,
  isHorizontalScreen,
}) {
  useEffect(() => {
    setUrl("");
    setCapturedImg("");
    setCapturedImgWithFrame("");
  }, []);

  return (
    <div className="HomePage flex-col-center">
      {/* bg */}
      <div className="homeBgContainer flex-row-center">
        <img src={isHorizontalScreen ? homeLaptopBg : homeBg} alt="homeBg" />
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
