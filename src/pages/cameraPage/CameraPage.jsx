import React, { useState, useRef } from "react";
import "./cameraPage.scss";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

import Model3d from "../../components/model3d/Model3d";
import getScreenshot from "../../utils/getScreenshot";

import captureBtn from "./../../assets/cameraPage/captureBtn.png";
import retakeBtn from "./../../assets/cameraPage/retakeBtn.png";
import submitBtn from "./../../assets/cameraPage/submitBtn.png";
import frame from "./../../assets/cameraPage/frame.png";
import cameraPageBg from "./../../assets/cameraPage/cameraPageBg.png";
import logo from "./../../assets/logo.png";

import { uploadImage } from "../../utils/uploadFirebase";

export default function CameraPage({ setUrl }) {
  const screenshotRef = useRef();
  const navigate = useNavigate();
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImg, setCapturedImg] = useState();

  const captureImg = () => {
    setIsCaptured(true);

    getScreenshot(screenshotRef.current, (base64Data) => {
      console.log(base64Data);
      setCapturedImg(base64Data);
    });
  };

  const retakeImg = () => {
    setIsCaptured(false);
    setCapturedImg("");
  };

  const submitImg = async () => {
    if (capturedImg) {
      let downloadUrl = await uploadImage(capturedImg);
      setUrl(downloadUrl);
    }
  };

  return (
    <div className="CameraPage flex-col-center">
      {/* bg */}
      <div className="cameraPageBgContainer flex-row-center">
        <img src={cameraPageBg} alt="cameraPageBg" />
      </div>

      {/* main container */}
      <div className="mainContainer flex-col-center">
        <div className="wrapper flex-col-center">
          {/* logo */}
          <div className="logoContainer flex-row-center">
            <img src={logo} alt="logo" />
          </div>

          {/* camera container */}
          <div className="cameraContainer flex-row-center">
            {capturedImg ? (
              <div className="capturedImgContainer flex-row-center">
                <img src={capturedImg} alt="capturedImg" />
              </div>
            ) : (
              <div
                ref={screenshotRef}
                className="webcamWithModel flex-row-center"
              >
                {/* webcam */}
                <Webcam id="webcam" forceScreenshotSourceSize={true} />

                {/* 3d model */}
                {/* <Model3d /> */}
                <div className="modelContainer flex-row-center">
                  <img src={"/model.png"} alt="model" />
                </div>
              </div>
            )}

            {/* frame */}
            <div className="frameContainer flex-row-center">
              <img src={frame} alt="frame" />
            </div>
          </div>
        </div>

        {/* btns */}
        {isCaptured ? (
          <div className="retakeSubmitBtnContainer flex-row-center">
            <div
              onClick={retakeImg}
              className="retakeBtnContainer flex-row-center"
            >
              <img src={retakeBtn} alt="retakeBtn" />
            </div>
            <div
              onClick={submitImg}
              className="submitBtnContainer flex-row-center"
            >
              <img src={submitBtn} alt="submitBtn" />
            </div>
          </div>
        ) : (
          <div
            onClick={captureImg}
            className="captureBtnContainer flex-row-center"
          >
            <img src={captureBtn} alt="captureBtn" />
          </div>
        )}
      </div>
    </div>
  );
}
