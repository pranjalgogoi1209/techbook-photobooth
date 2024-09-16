import React, { useState, useRef, useEffect } from "react";
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

export default function CameraPage({ capturedImg, setCapturedImg }) {
  const screenshotRef = useRef();
  const navigate = useNavigate();
  const [isCaptured, setIsCaptured] = useState(false);
  const [postion, setPosition] = useState({
    top: 1,
    left: -1.5,
  });
  const [isCounting, setIsCounting] = useState(false);
  const [counting, setCounting] = useState(5);
  const [size, setSize] = useState(20);

  console.log(postion);

  const captureImg = () => {
    setIsCounting(true);
    setCounting(5);
  };

  const retakeImg = () => {
    setIsCaptured(false);
    setCapturedImg("");
    setCounting(5);
  };

  const submitImg = async () => {
    if (isCaptured) {
      navigate("/output");
    }
  };

  const handleMoving = (value) => {
    switch (value) {
      case "up":
        setPosition((prev) => ({
          ...prev,
          top: prev.top - 0.5,
        }));
        break;

      case "down":
        setPosition((prev) => ({
          ...prev,
          top: prev.top + 0.5,
        }));
        break;

      case "left":
        setPosition((prev) => ({
          ...prev,
          left: prev.left - 0.5,
        }));
        break;

      case "right":
        setPosition((prev) => ({
          ...prev,
          left: prev.left + 0.5,
        }));
        break;

      default:
        break;
    }
  };

  // resizing
  const handleResizing = (value) => {
    if (value == "inc") {
      console.log("increasing");
      setSize((prev) => prev + 0.5);
    } else if (value == "dec") {
      console.log("decre");
      setSize((prev) => prev - 0.5);
    }
  };

  // countdown and screenshot logic
  useEffect(() => {
    // console.log("counting", isCounting, counting);

    let countdownInterval;

    if (isCounting && counting > 0) {
      countdownInterval = setInterval(() => {
        setCounting((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (isCounting && counting === 0) {
      // Capture the screenshot when countdown hits 0
      setIsCaptured(true);

      getScreenshot(screenshotRef.current, (base64Data) => {
        console.log(base64Data);
        setCapturedImg(base64Data);
      });
      setIsCounting(false); // Stop counting
    }

    return () => clearInterval(countdownInterval); // Cleanup interval on unmount or re-run
  }, [isCounting, counting]);

  // keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        handleMoving("up");
        console.log("up arrow");
      } else if (e.key === "ArrowDown") {
        console.log("down arrow");
        handleMoving("down");
      } else if (e.key === "ArrowLeft") {
        console.log("left arrow");
        handleMoving("left");
      } else if (e.key === "ArrowRight") {
        console.log("right arrow");
        handleMoving("right");
      } else if (e.key == "+") {
        console.log("plus button");
        handleResizing("inc");
      } else if (e.key == "-") {
        handleResizing("dec");
        console.log("minus button");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // touch events
  useEffect(() => {
    // Function to handle touch movement
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        // Single touch for moving
        const touch = e.touches[0];
        const movementX = touch.clientX - touch.startX;
        const movementY = touch.clientY - touch.startY;

        if (movementY < -10) {
          handleMoving("up");
        } else if (movementY > 10) {
          handleMoving("down");
        }

        if (movementX < -10) {
          handleMoving("left");
        } else if (movementX > 10) {
          handleMoving("right");
        }
      }

      // Two fingers touch for resizing
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        if (e.prevDistance) {
          if (distance > e.prevDistance + 10) {
            handleResizing("inc");
          } else if (distance < e.prevDistance - 10) {
            handleResizing("dec");
          }
        }
        e.prevDistance = distance;
      }
    };

    // Reset after touch ends
    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    // Add touch listeners
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

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
            {isCaptured ? (
              <div className="capturedImgContainer flex-row-center">
                {capturedImg ? (
                  <img src={capturedImg} alt="capturedImg" />
                ) : (
                  <span className="loader2"></span>
                )}
              </div>
            ) : (
              <div
                ref={screenshotRef}
                className="webcamWithModel flex-row-center"
              >
                {/* webcam */}
                <Webcam
                  id="webcam"
                  forceScreenshotSourceSize={true}
                  mirrored={true}
                />

                {!isCaptured && isCounting && (
                  <h1 className="countdown">{counting}</h1>
                )}

                {/* 3d model */}
                {/* <Model3d /> */}
                <div
                  className="modelContainer flex-row-center"
                  style={{
                    left: `${postion.left}vh`,
                    top: `${postion.top}vh`,
                    width: `${size}vh`,
                  }}
                >
                  <img src={"/model.png"} alt="model" />
                </div>
              </div>
            )}

            {/* frame */}
            {/*     <div className="frameContainer flex-row-center">
              <img src={frame} alt="frame" />
            </div> */}
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
