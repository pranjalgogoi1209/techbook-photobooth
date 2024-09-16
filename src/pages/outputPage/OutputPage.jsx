import React, { useEffect } from "react";
import "./outputPage.scss";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { uploadImage } from "../../utils/uploadFirebase";

import outputPageBg from "./../../assets/cameraPage/cameraPageBg.png";
import logo from "./../../assets/logo.png";
import homeBtn from "./../../assets/homePage/homeBtn.png";
import qrFrame from "./../../assets/outputPage/qrFrame.png";
import cameraPageLaptopBg from "./../../assets/cameraPage/cameraPageLaptopBg.png";

function OutputPage({ url, setUrl, capturedImg, isHorizontalScreen }) {
  // Customize the colors
  const qrColor = "#000000"; // Foreground color (QR code)
  const qrBgColor = "#ffffff"; // Background color

  useEffect(() => {
    async function uploadAndSetUrl() {
      if (capturedImg) {
        const downloadUrl = await uploadImage(capturedImg);
        setUrl(downloadUrl);
      }
    }
    uploadAndSetUrl();
  }, [capturedImg]);

  return (
    <div className="OutputPage flex-col-center">
      {/* bg */}
      <div className="outputBgContainer">
        <img
          src={isHorizontalScreen ? cameraPageLaptopBg : outputPageBg}
          alt="bg"
        />
      </div>

      {/* qr code container */}
      <div className="qrCodeContainer flex-col-center">
        <div className="wrapper flex-col-center">
          {/* logo */}
          <div className="logoContainer flex-row-center">
            <img src={logo} alt="logo" />
          </div>

          {/* qr section */}
          <div className="qrContainer flex-row-center">
            <div className="qrcodeImg flex-row-center">
              {url ? (
                <QRCode
                  size={256}
                  value={url}
                  fgColor={qrColor}
                  bgColor={qrBgColor}
                  id="qrCode"
                />
              ) : (
                <span className="loader"></span>
              )}
            </div>

            {/* qr frame */}
            <div className="qrFrameContainer flex-row-center">
              <img src={qrFrame} alt="qrFrame" />
            </div>
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
