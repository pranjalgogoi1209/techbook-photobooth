import React, { useState, useRef, useEffect, useCallback } from "react";
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

import captureBtn from "./../../assets/cameraPage/captureBtn.png";
import retakeBtn from "./../../assets/cameraPage/retakeBtn.png";
import submitBtn from "./../../assets/cameraPage/submitBtn.png";
import frame from "./../../assets/cameraPage/frame.png";
import bg from "./../../assets/bg.webp";

export default function CameraPage({
  capturedImg,
  setCapturedImg,
  setCapturedImgWithFrame,
  isHorizontalScreen,

  dx,
  dy,
  setDx,
  setDy,

  size,
  setSize,
}) {
  const webcamRef = useRef(null);
  const modelRef = useRef(null);
  const cameraContainerRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const navigate = useNavigate();

  const [isCaptured, setIsCaptured] = useState(Boolean(capturedImg));

  const [isCounting, setIsCounting] = useState(false);
  const [counting, setCounting] = useState(5);
  const [isOpenEditor, setIsOpenEditor] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  /*
   * =========================================================
   * FINAL IMAGE SIZE
   * =========================================================
   *
   * 2:3 portrait
   *
   * 1080 x 1620
   */

  const TARGET_WIDTH = 1080;
  const TARGET_HEIGHT = 1620;

  /*
   * =========================================================
   * CAMERA READY
   * =========================================================
   */

  const handleCameraReady = useCallback(() => {
    const video = webcamRef.current?.video;

    if (!video) {
      console.warn("Camera video element not found.");
      return;
    }

    console.log(
      "Actual camera resolution:",
      video.videoWidth,
      "x",
      video.videoHeight,
    );

    setIsCameraReady(true);
  }, []);

  /*
   * =========================================================
   * CAMERA ERROR
   * =========================================================
   */

  const handleCameraError = useCallback((error) => {
    console.error("Camera error:", error);
    setIsCameraReady(false);
  }, []);

  /*
   * =========================================================
   * DRAGGING
   * =========================================================
   */

  const handleStart = () => {
    // Nothing required.
  };

  const handleDrag = () => {
    // Nothing required.
  };

  const handleStop = () => {
    if (!modelRef.current) {
      return;
    }

    const transform = modelRef.current.style.transform;

    const match = transform.match(
      /translate(?:3d)?\(\s*([-0-9.]+)px,\s*([-0-9.]+)px/,
    );

    if (match) {
      const newDx = parseFloat(match[1]);
      const newDy = parseFloat(match[2]);

      setDx(newDx);
      setDy(newDy);
    }
  };

  /*
   * =========================================================
   * EDITOR
   * =========================================================
   */

  const handleEditor = () => {
    setIsOpenEditor(true);
  };

  /*
   * =========================================================
   * 2:3 CROP
   * =========================================================
   */

  const getCropDimensions = useCallback((inputWidth, inputHeight) => {
    if (!inputWidth || !inputHeight) {
      return {
        srcX: 0,
        srcY: 0,
        srcW: inputWidth,
        srcH: inputHeight,
      };
    }

    const inputRatio = inputWidth / inputHeight;

    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

    let srcX = 0;
    let srcY = 0;
    let srcW = inputWidth;
    let srcH = inputHeight;

    /*
     * Camera is wider than 2:3.
     * Crop left/right.
     */

    if (inputRatio > targetRatio) {
      srcW = inputHeight * targetRatio;

      srcX = (inputWidth - srcW) / 2;
    } else {
      /*
       * Camera is taller than 2:3.
       * Crop top/bottom.
       */

      srcH = inputWidth / targetRatio;

      srcY = (inputHeight - srcH) / 2;
    }

    return {
      srcX,
      srcY,
      srcW,
      srcH,
    };
  }, []);

  /*
   * =========================================================
   * LOAD IMAGE
   * =========================================================
   */

  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };

      image.src = src;
    });
  }, []);

  /*
   * =========================================================
   * CAPTURE COMPLETE IMAGE
   * =========================================================
   *
   * IMPORTANT:
   *
   * Source:
   *
   * Camera video frame
   *
   * NOT:
   *
   * webcam.getScreenshot()
   *
   * NOT:
   *
   * DOM screenshot
   *
   * Final:
   *
   * Camera + Model + Frame
   *          ↓
   *       Canvas
   *          ↓
   *      PNG 1080x1620
   *
   * This same PNG is stored in:
   *
   * 1. capturedImg
   * 2. capturedImgWithFrame
   *
   */

  const captureCompleteImage = useCallback(async () => {
    const video = webcamRef.current?.video;

    const container = cameraContainerRef.current;

    const modelElement = modelRef.current;

    if (!video) {
      console.error("Video element not available.");

      return null;
    }

    if (!container) {
      console.error("Camera container not available.");

      return null;
    }

    if (!modelElement) {
      console.error("Model element not available.");

      return null;
    }

    if (video.readyState < 2) {
      console.error("Video is not ready.");

      return null;
    }

    if (!video.videoWidth || !video.videoHeight) {
      console.error("Camera dimensions unavailable.");

      return null;
    }

    /*
     * -------------------------------------------------------
     * CREATE / REUSE CANVAS
     * -------------------------------------------------------
     */

    let canvas = captureCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");

      captureCanvasRef.current = canvas;
    }

    /*
     * Exact final resolution.
     */

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    if (!ctx) {
      console.error("Canvas context unavailable.");

      return null;
    }

    /*
     * -------------------------------------------------------
     * HIGH QUALITY RENDERING
     * -------------------------------------------------------
     */

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    /*
     * -------------------------------------------------------
     * CAMERA CROP
     * -------------------------------------------------------
     */

    const { srcX, srcY, srcW, srcH } = getCropDimensions(
      video.videoWidth,
      video.videoHeight,
    );

    /*
     * -------------------------------------------------------
     * DRAW CAMERA VIDEO FRAME
     * -------------------------------------------------------
     *
     * THIS IS THE ACTUAL VIDEO FRAME.
     */

    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    ctx.drawImage(
      video,

      srcX,
      srcY,
      srcW,
      srcH,

      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    );

    /*
     * -------------------------------------------------------
     * CONVERT SCREEN POSITION TO FINAL IMAGE POSITION
     * -------------------------------------------------------
     */

    const containerRect = container.getBoundingClientRect();

    const modelRect = modelElement.getBoundingClientRect();

    /*
     * The displayed camera area and final
     * canvas may have different dimensions.
     *
     * Convert CSS pixels → final image pixels.
     */

    const scaleX = TARGET_WIDTH / containerRect.width;

    const scaleY = TARGET_HEIGHT / containerRect.height;

    const modelX = (modelRect.left - containerRect.left) * scaleX;

    const modelY = (modelRect.top - containerRect.top) * scaleY;

    const modelWidth = modelRect.width * scaleX;

    const modelHeight = modelRect.height * scaleY;

    console.log("Model canvas position:", {
      x: modelX,
      y: modelY,
      width: modelWidth,
      height: modelHeight,
    });

    /*
     * -------------------------------------------------------
     * LOAD MODEL
     * -------------------------------------------------------
     */

    let modelImage;

    try {
      modelImage = await loadImage("/model-virat.png");
    } catch (error) {
      console.error("Could not load model image:", error);

      return null;
    }

    /*
     * -------------------------------------------------------
     * DRAW MODEL
     * -------------------------------------------------------
     *
     * Model is drawn ABOVE the camera.
     */

    ctx.drawImage(modelImage, modelX, modelY, modelWidth, modelHeight);

    /*
     * -------------------------------------------------------
     * LOAD FRAME
     * -------------------------------------------------------
     */

    let frameImage;

    try {
      frameImage = await loadImage(frame);
    } catch (error) {
      console.error("Could not load frame image:", error);

      return null;
    }

    /*
     * -------------------------------------------------------
     * DRAW FRAME
     * -------------------------------------------------------
     *
     * Frame is the top-most layer.
     */

    ctx.drawImage(frameImage, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    /*
     * -------------------------------------------------------
     * EXPORT COMPLETE IMAGE AS PNG
     * -------------------------------------------------------
     *
     * This PNG contains:
     *
     * CAMERA
     * +
     * MODEL
     * +
     * FRAME
     */

    const finalImage = canvas.toDataURL("image/png");

    console.log("Final PNG created:", `${TARGET_WIDTH}x${TARGET_HEIGHT}`);

    return finalImage;
  }, [getCropDimensions, loadImage]);

  /*
   * =========================================================
   * CAPTURE BUTTON
   * =========================================================
   */

  const captureImg = () => {
    if (isCounting || isCaptured) {
      return;
    }

    if (!isCameraReady) {
      console.warn("Camera is not ready.");

      return;
    }

    setCounting(5);
    setIsCounting(true);
  };

  /*
   * =========================================================
   * RETAKE
   * =========================================================
   */

  const retakeImg = () => {
    setIsCaptured(false);

    setCapturedImg("");

    if (setCapturedImgWithFrame) {
      setCapturedImgWithFrame("");
    }

    setCounting(5);
    setIsCounting(false);

    setIsCameraReady(false);
  };

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const submitImg = () => {
    if (isCaptured && capturedImg) {
      navigate("/output");
    }
  };

  /*
   * =========================================================
   * MOVE MODEL
   * =========================================================
   */

  const handleMoving = (value) => {
    switch (value) {
      case "up":
        setDy((prev) => prev - 0.5);
        break;

      case "down":
        setDy((prev) => prev + 0.5);
        break;

      case "left":
        setDx((prev) => prev - 0.5);
        break;

      case "right":
        setDx((prev) => prev + 0.5);
        break;

      default:
        break;
    }
  };

  /*
   * =========================================================
   * RESIZE MODEL
   * =========================================================
   */

  const handleResizing = (value) => {
    if (value === "inc") {
      setSize((prev) => prev + 0.5);
    }

    if (value === "dec") {
      setSize((prev) => Math.max(5, prev - 0.5));
    }
  };

  /*
   * =========================================================
   * COUNTDOWN
   * =========================================================
   *
   * 5 → 4 → 3 → 2 → 1 → CAPTURE
   *
   */

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    /*
     * 5 -> 4 -> 3 -> 2 -> 1
     */

    if (counting > 1) {
      const timer = setTimeout(() => {
        setCounting((previous) => previous - 1);
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }

    /*
     * -------------------------------------------------------
     * COUNTING === 1
     * -------------------------------------------------------
     */

    if (counting === 1) {
      const timer = setTimeout(async () => {
        /*
         * Stop countdown.
         */

        setIsCounting(false);

        /*
         * IMPORTANT:
         *
         * Capture while the live camera
         * and model are still mounted.
         */

        const finalImage = await captureCompleteImage();

        if (!finalImage) {
          console.error("Failed to create final image.");

          return;
        }

        /*
         * =================================================
         * SAVE COMPLETE IMAGE
         * =================================================
         *
         * finalImage contains:
         *
         * CAMERA + MODEL + FRAME
         *
         */

        setCapturedImg(finalImage);

        /*
         * IMPORTANT:
         *
         * OutputPage uploads capturedImgWithFrame.
         *
         * Therefore this MUST also receive
         * the complete image.
         */

        if (setCapturedImgWithFrame) {
          setCapturedImgWithFrame(finalImage);
        }

        /*
         * Switch UI to captured mode.
         */

        setIsCaptured(true);
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [
    isCounting,
    counting,
    captureCompleteImage,
    setCapturedImg,
    setCapturedImgWithFrame,
  ]);

  /*
   * =========================================================
   * KEYBOARD CONTROLS
   * =========================================================
   */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isCaptured) {
        return;
      }

      switch (event.key) {
        case "ArrowUp":
          handleMoving("up");
          break;

        case "ArrowDown":
          handleMoving("down");
          break;

        case "ArrowLeft":
          handleMoving("left");
          break;

        case "ArrowRight":
          handleMoving("right");
          break;

        case "+":
        case "=":
          handleResizing("inc");
          break;

        case "-":
        case "_":
          handleResizing("dec");
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCaptured]);

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="CameraPage flex-col-center">
      {/* BACKGROUND */}

      <div className="cameraPageBgContainer flex-row-center">
        <img src={bg} alt="cameraPageBg" />
      </div>

      {/* MAIN CONTAINER */}

      <div className="mainContainer flex-col-center">
        <div className="wrapper flex-col-center">
          {/* CAMERA AREA */}

          <div className="cameraContainerWrapper flex-col-center">
            {/* EDITOR */}

            {isOpenEditor && !isCaptured && (
              <div className="editorContainer flex-row-center">
                {/* LEFT */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("left")}
                >
                  <MdArrowLeft />
                </div>

                {/* RIGHT */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("right")}
                >
                  <MdArrowRight />
                </div>

                {/* UP */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("up")}
                >
                  <MdOutlineArrowDropUp />
                </div>

                {/* DOWN */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("down")}
                >
                  <MdOutlineArrowDropDown />
                </div>

                {/* INCREASE */}

                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("inc")}
                >
                  <GoPlus />
                </div>

                {/* DECREASE */}

                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("dec")}
                >
                  <AiOutlineMinus />
                </div>

                {/* DONE */}

                <div
                  className="flex-row-center closeEditorBtn"
                  onClick={() => setIsOpenEditor(false)}
                >
                  <MdOutlineDone />
                </div>
              </div>
            )}

            {/* =================================================
                CAMERA CONTAINER
            ================================================= */}

            <div
              ref={cameraContainerRef}
              className="cameraContainer flex-row-center"
              style={{
                position: "relative",
                overflow: "hidden",
              }}
            >
              {!isCaptured && (
                <>
                  {/* =================================================
                      BACK CAMERA
                  ================================================= */}

                  <Webcam
                    ref={webcamRef}
                    id="webcam"
                    audio={false}
                    mirrored={false}
                    videoConstraints={{
                      facingMode: {
                        exact: "environment",
                      },

                      /*
                       * Request high resolution.
                       */

                      width: {
                        ideal: 2160,
                      },

                      height: {
                        ideal: 3240,
                      },
                    }}
                    onUserMedia={handleCameraReady}
                    onUserMediaError={handleCameraError}
                    style={{
                      position: "absolute",

                      top: 0,
                      left: 0,

                      width: "100%",
                      height: "100%",

                      objectFit: "cover",

                      zIndex: 1,

                      display: "block",

                      /*
                       * No mirror.
                       */

                      transform: "scaleX(1)",
                    }}
                  />

                  {/* CAMERA LOADING */}

                  {!isCameraReady && (
                    <div
                      style={{
                        position: "absolute",

                        top: 0,
                        left: 0,

                        width: "100%",
                        height: "100%",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        background: "rgba(0,0,0,0.75)",

                        color: "#fff",

                        zIndex: 10,

                        fontSize: "18px",
                      }}
                    >
                      Starting Camera...
                    </div>
                  )}

                  {/* COUNTDOWN */}

                  {isCounting && counting > 0 && (
                    <div
                      className="countdownOverlay"
                      style={{
                        zIndex: 20,
                      }}
                    >
                      <div key={counting} className="countdownNumber">
                        {counting}
                      </div>

                      <div className="countdownText">GET READY</div>
                    </div>
                  )}

                  {/* =================================================
                      MODEL
                  ================================================= */}

                  <Draggable
                    nodeRef={modelRef}
                    defaultPosition={{
                      x: dx || 0,
                      y: dy || 0,
                    }}
                    onStart={handleStart}
                    onDrag={handleDrag}
                    onStop={handleStop}
                  >
                    <div
                      ref={modelRef}
                      className="modelContainer flex-row-center"
                      style={{
                        width: `${size}vh`,
                        zIndex: 2,
                      }}
                    >
                      <img
                        src="/model-virat.png"
                        alt="model"
                        draggable={false}
                      />
                    </div>
                  </Draggable>

                  {/* =================================================
                      FRAME
                  ================================================= */}

                  <div
                    className="frameContainer flex-row-center"
                    style={{
                      position: "absolute",

                      top: 0,
                      left: 0,

                      width: "100%",
                      height: "100%",

                      zIndex: 3,

                      pointerEvents: "none",
                    }}
                  >
                    <img src={frame} alt="frame" draggable={false} />
                  </div>
                </>
              )}

              {/* =================================================
                  CAPTURED IMAGE
              ================================================= */}

              {isCaptured && capturedImg && (
                <img
                  src={capturedImg}
                  alt="capturedImg"
                  style={{
                    position: "absolute",

                    top: 0,
                    left: 0,

                    width: "100%",
                    height: "100%",

                    objectFit: "cover",

                    zIndex: 1,

                    display: "block",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            BUTTONS
        ====================================================== */}

        {isCaptured ? (
          <div className="retakeSubmitBtnContainer flex-row-center">
            {/* RETAKE */}

            <div
              onClick={retakeImg}
              className="retakeBtnContainer flex-row-center"
            >
              <img src={retakeBtn} alt="retakeBtn" />
            </div>

            {/* SUBMIT */}

            <div
              onClick={submitImg}
              className="submitBtnContainer flex-row-center"
            >
              <img src={submitBtn} alt="submitBtn" />
            </div>
          </div>
        ) : (
          /* CAPTURE */

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
