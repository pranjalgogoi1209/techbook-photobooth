import React from "react";
import "./outputPage.scss";
import { Link } from "react-router-dom";

import outputPageBg from "./../../assets/cameraPage/cameraPageBg.png";
import logo from "./../../assets/logo.png";
import homeBtn from "./../../assets/homePage/homeBtn.png";

function OutputPage() {
  return (
    <div className="OutputPage flex-col-center">
      {/* bg */}
      <div className="outputBgContainer">
        <img src={outputPageBg} alt="bg" />
      </div>

      {/* qr code container */}
      <div className="qrCodeContainer flex-col-center">
        <div className="wrapper flex-col-center">
        {/* logo */}
        <div className="logoContainer flex-row-center">
          <img src={logo} alt="logo" />
        </div>
        {/* qr section */}
        <div className="qrSection flex-col-center">
          <div className="qrcodeImg flex-row-center">

          </div>
          <h2>SCAN,SHARE & SAVE</h2>
        </div>
        </div>
        {/* home btn */}
        <Link to="/" className="homeBtnContainer flex-row-center">
          <img src={homeBtn} alt="" />
        </Link>
      </div>
    </div>
  );
}

export default OutputPage;
