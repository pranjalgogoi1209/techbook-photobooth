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
  const captureCanvasRef = useRef(null);

  const navigate = useNavigate();

  const [isCaptured, setIsCaptured] = useState(Boolean(capturedImg));

  const [isCounting, setIsCounting] = useState(false);

  const [counting, setCounting] = useState(5);

  const [isOpenEditor, setIsOpenEditor] = useState(false);

  const [isCameraReady, setIsCameraReady] = useState(false);

  /*
   * ---------------------------------------------------------
   * FINAL IMAGE SIZE
   * ---------------------------------------------------------
   *
   * 2:3 portrait
   *
   * 1080 x 1620
   */

  const TARGET_WIDTH = 1080;
  const TARGET_HEIGHT = 1620;

  /*
   * ---------------------------------------------------------
   * CAMERA READY
   * ---------------------------------------------------------
   */

  const handleCameraReady = useCallback(() => {
    const video = webcamRef.current?.video;

    if (!video) {
      console.warn("Camera video element not found.");
      return;
    }

    console.log("Camera ready:", video.videoWidth, "x", video.videoHeight);

    setIsCameraReady(true);
  }, []);

  /*
   * ---------------------------------------------------------
   * CAMERA ERROR
   * ---------------------------------------------------------
   */

  const handleCameraError = useCallback((error) => {
    console.error("Camera error:", error);

    setIsCameraReady(false);
  }, []);

  /*
   * ---------------------------------------------------------
   * DRAGGING
   * ---------------------------------------------------------
   */

  const handleStart = () => {
    // Nothing needed here.
  };

  const handleDrag = () => {
    // Nothing needed here.
  };

  const handleStop = () => {
    if (!modelRef.current) return;

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
   * ---------------------------------------------------------
   * EDITOR
   * ---------------------------------------------------------
   */

  const handleEditor = () => {
    setIsOpenEditor(true);
  };

  /*
   * ---------------------------------------------------------
   * 2:3 CROP
   * ---------------------------------------------------------
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
     * Camera wider than 2:3.
     * Crop left/right.
     */

    if (inputRatio > targetRatio) {
      srcW = inputHeight * targetRatio;

      srcX = (inputWidth - srcW) / 2;
    } else {
      /*
       * Camera taller than 2:3.
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
   * ---------------------------------------------------------
   * CAPTURE ACTUAL VIDEO FRAME
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * This does NOT use:
   *
   * webcam.getScreenshot()
   *
   * This does NOT use:
   *
   * getScreenshot()
   *
   * This captures directly from:
   *
   * HTML VIDEO -> CANVAS -> PNG
   *
   */

  const captureVideoFrame = useCallback(() => {
    const video = webcamRef.current?.video;

    if (!video) {
      console.error("Video element is not available.");

      return null;
    }

    if (video.readyState < 2) {
      console.error("Video is not ready.");

      return null;
    }

    if (!video.videoWidth || !video.videoHeight) {
      console.error("Video dimensions are unavailable.");

      return null;
    }

    console.log(
      "Capturing actual video frame:",
      video.videoWidth,
      "x",
      video.videoHeight,
    );

    /*
     * Create/reuse canvas.
     */

    let canvas = captureCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");

      captureCanvasRef.current = canvas;
    }

    /*
     * Final image resolution.
     */

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    if (!ctx) {
      console.error("Unable to create canvas context.");

      return null;
    }

    /*
     * High quality scaling.
     */

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    /*
     * Calculate 2:3 crop.
     */

    const { srcX, srcY, srcW, srcH } = getCropDimensions(
      video.videoWidth,
      video.videoHeight,
    );

    /*
     * Clear previous image.
     */

    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    /*
     * Draw the CURRENT video frame.
     *
     * No screenshot API.
     */

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
     * Export as PNG.
     */

    const pngData = canvas.toDataURL("image/png");

    console.log("Captured PNG:", TARGET_WIDTH, "x", TARGET_HEIGHT);

    return pngData;
  }, [getCropDimensions]);

  /*
   * ---------------------------------------------------------
   * CAPTURE BUTTON
   * ---------------------------------------------------------
   */

  const captureImg = () => {
    if (isCounting || isCaptured) {
      return;
    }

    if (!isCameraReady) {
      console.warn("Camera is not ready yet.");

      return;
    }

    setCounting(5);
    setIsCounting(true);
  };

  /*
   * ---------------------------------------------------------
   * RETAKE
   * ---------------------------------------------------------
   */

  const retakeImg = () => {
    setIsCaptured(false);

    setCapturedImg("");

    if (setCapturedImgWithFrame) {
      setCapturedImgWithFrame("");
    }

    setCounting(5);

    setIsCounting(false);

    /*
     * Allow camera to become ready again.
     */

    setIsCameraReady(false);
  };

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  const submitImg = () => {
    if (isCaptured && capturedImg) {
      navigate("/output");
    }
  };

  /*
   * ---------------------------------------------------------
   * MOVE MODEL
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * RESIZE MODEL
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * COUNTDOWN
   * ---------------------------------------------------------
   *
   * 5 -> 4 -> 3 -> 2 -> 1 -> CAPTURE
   */

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    /*
     * 5 -> 4
     * 4 -> 3
     * 3 -> 2
     * 2 -> 1
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
     *
     * Keep 1 visible for one second,
     * then capture.
     */

    if (counting === 1) {
      const timer = setTimeout(() => {
        /*
         * Stop countdown.
         */

        setIsCounting(false);

        /*
         * Capture the REAL camera frame.
         */

        const base64Data = captureVideoFrame();

        if (!base64Data) {
          console.error("Failed to capture video frame.");

          return;
        }

        /*
         * Save captured image.
         */

        setCapturedImg(base64Data);

        /*
         * Keep compatibility with your
         * existing output flow.
         */

        if (setCapturedImgWithFrame) {
          setCapturedImgWithFrame(base64Data);
        }

        /*
         * IMPORTANT:
         *
         * This changes the UI to captured mode.
         *
         * The model is still rendered in the
         * captured mode below.
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
    captureVideoFrame,
    setCapturedImg,
    setCapturedImgWithFrame,
  ]);

  /*
   * ---------------------------------------------------------
   * KEYBOARD CONTROLS
   * ---------------------------------------------------------
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
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
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

            {/* CAMERA CONTAINER */}

            <div className="cameraContainer flex-row-center">
              {isCaptured ? (
                /*
                 * =================================================
                 * CAPTURED MODE
                 * =================================================
                 *
                 * Captured photo is the background.
                 *
                 * Model stays visible.
                 *
                 * Frame stays visible.
                 */

                <div
                  className="webcamWithModel flex-row-center"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* ---------------------------------------------
                      CAPTURED CAMERA PHOTO
                  ---------------------------------------------- */}

                  {capturedImg && (
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

                  {/* ---------------------------------------------
                      MODEL OVERLAY
                  ---------------------------------------------- */}

                  <div
                    className="modelContainer flex-row-center"
                    style={{
                      position: "absolute",

                      width: `${size}vh`,

                      transform: `translate(
                        ${dx || 0}px,
                        ${dy || 0}px
                      )`,

                      zIndex: 2,

                      pointerEvents: "none",
                    }}
                  >
                    <img src="/model-virat.png" alt="model" draggable={false} />
                  </div>

                  {/* ---------------------------------------------
                      FRAME OVERLAY
                  ---------------------------------------------- */}

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
                </div>
              ) : (
                /*
                 * =================================================
                 * LIVE CAMERA MODE
                 * =================================================
                 */

                <div
                  className="webcamWithModel flex-row-center"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* ---------------------------------------------
                      BACK CAMERA
                  ---------------------------------------------- */}

                  <Webcam
                    ref={webcamRef}
                    id="webcam"
                    audio={false}
                    /*
                     * BACK CAMERA
                     */

                    mirrored={false}
                    videoConstraints={{
                      facingMode: {
                        exact: "environment",
                      },

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
                       * Explicitly NOT mirrored.
                       */

                      transform: "scaleX(1)",
                    }}
                  />

                  {/* ---------------------------------------------
                      CAMERA LOADING
                  ---------------------------------------------- */}

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

                  {/* ---------------------------------------------
                      COUNTDOWN
                  ---------------------------------------------- */}

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

                  {/* ---------------------------------------------
                      MODEL
                  ---------------------------------------------- */}

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

                  {/* ---------------------------------------------
                      FRAME
                  ---------------------------------------------- */}

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
                </div>
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
