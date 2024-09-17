import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import "./cameraPage.scss";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import {
  MdArrowLeft,
  MdArrowRight,
  MdOutlineArrowDropUp,
  MdOutlineArrowDropDown,
  MdOutlineDone,
} from "react-icons/md";
import { GoPlus } from "react-icons/go";
import { AiOutlineMinus } from "react-icons/ai";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

// import Model3d from "../../components/model3d/Model3d";
import getScreenshot from "../../utils/getScreenshot";

import captureBtn from "./../../assets/cameraPage/captureBtn.png";
import retakeBtn from "./../../assets/cameraPage/retakeBtn.png";
import submitBtn from "./../../assets/cameraPage/submitBtn.png";
import frame from "./../../assets/cameraPage/frame.png";
import cameraPageBg from "./../../assets/cameraPage/cameraPageBg.png";
import logo from "./../../assets/logo.png";
import cameraPageLaptopBg from "./../../assets/cameraPage/cameraPageLaptopBg.png";
import { element } from "three/webgpu";

export default function CameraPage({
  capturedImg,
  setCapturedImg,
  setCapturedImgWithFrame,
  isHorizontalScreen,
}) {
  const screenshotRef = useRef();
  const screenshotWithFrameRef = useRef();
  const navigate = useNavigate();
  const [isCaptured, setIsCaptured] = useState(false);
  const [postion, setPosition] = useState({
    top: 8,
    left: 0,
  });
  const [isCounting, setIsCounting] = useState(false);
  const [counting, setCounting] = useState(5);
  const [size, setSize] = useState(16);
  const [isOpenEditor, setIsOpenEditor] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // const [webcamWithModel, setWebcamWithModel] = useState("");
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);

  // will work on this code
  let x;
  let y;
  useEffect(() => {
    const modelElement = screenshotRef.current.querySelector(".modelContainer");
    console.log("working");

    if (modelElement) {
      let currentTransform = modelElement.style.transform;
      let translateValues = currentTransform.match(
        /translate\(([^,]+),\s*([^)]+)\)/
      );
      if (translateValues) {
        x = parseFloat(translateValues[1]);
        y = parseFloat(translateValues[2]);

        setDx(x);
        setDy(y);
      }
    }
  }, [x, y]);

  console.log(dx, dy);

  console.log(postion);
  /*   useEffect(() => {
    if (screenshotRef?.current) {
      setWebcamWithModel(screenshotRef.current);
    }
  }, []);

  console.log(webcamWithModel); */

  // Start tracking drag status
  const handleStart = () => {
    setIsDragging(false);
  };

  // If the element is being dragged, we set dragging to true
  const handleDrag = () => {
    setIsDragging(true);
  };

  // Handle the stop event
  const handleStop = () => {
    setTimeout(() => setIsDragging(false), 0); // Reset dragging status after a short delay
  };

  // handle editor
  const handleEditor = () => {
    setIsOpenEditor(true);
    console.log("handle editor opening");
  };

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
    let countdownInterval;

    if (isCounting && counting > 0) {
      countdownInterval = setInterval(() => {
        setCounting((prevCountdown) => prevCountdown - 1);
      }, 1000);
    } else if (isCounting && counting === 0) {
      setIsCounting(false); // Stop counting

      // Capture the screenshot with the frame first
      getScreenshot(
        {
          element: screenshotWithFrameRef.current,
          type: "withFrame",
          isHorizontalScreen,
        },
        (base64Data) => {
          console.log("Screenshot with frame:", base64Data);
          setCapturedImgWithFrame(base64Data);
        }
      );

      setIsCaptured(true); // Update isCaptured

      // Capture the screenshot without the frame afterward
      getScreenshot(
        { element: screenshotRef.current, type: "withoutFrame" }, // Pass screenshotRef here
        (base64Data) => {
          console.log("Screenshot without frame:", base64Data);
          setCapturedImg(base64Data);
        }
      );
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

  return (
    <div ref={screenshotWithFrameRef} className="CameraPage flex-col-center">
      {/* bg */}
      <div className="cameraPageBgContainer flex-row-center">
        <img
          src={isHorizontalScreen ? cameraPageLaptopBg : cameraPageBg}
          alt="cameraPageBg"
        />
      </div>

      {/* main container */}
      <div className="mainContainer flex-col-center">
        <div className="wrapper flex-col-center">
          {/* logo */}
          <div onClick={handleEditor} className="logoContainer flex-row-center">
            <img src={logo} alt="logo" />
          </div>

          <div className="cameraContainerWrapper flex-col-center">
            {/* editor */}
            {isOpenEditor && (
              <div className="editorContainer flex-row-center">
                {/* Move Left */}
                {/*  <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("left")}
                >
                  <MdArrowLeft />
                </div> */}

                {/* Move Right */}
                {/*  <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("right")}
                >
                  <MdArrowRight />
                </div> */}

                {/* Move Up */}
                {/*   <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("up")}
                >
                  <MdOutlineArrowDropUp />
                </div> */}

                {/* Move Down */}
                {/*   <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("down")}
                >
                  <MdOutlineArrowDropDown />
                </div> */}

                {/* Increase Size */}
                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("inc")}
                >
                  <GoPlus />
                </div>

                {/* Decrease Size */}
                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("dec")}
                >
                  <AiOutlineMinus />
                </div>

                {/* Close Editor */}
                <div
                  onClick={() => setIsOpenEditor(false)}
                  className="flex-row-center closeEditorBtn"
                >
                  <MdOutlineDone />
                </div>
              </div>
            )}

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

                  {/* model */}
                  <Draggable defaultPosition={{ x: dx, y: dy }}>
                    <div
                      className="modelContainer flex-row-center"
                      style={{
                        width: `${size}vh`,
                      }}
                    >
                      <img src={"/model.png"} alt="model" />
                    </div>
                  </Draggable>
                </div>
              )}

              {/* frame */}
              <div className="frameContainer flex-row-center">
                <img src={frame} alt="frame" />
              </div>
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
