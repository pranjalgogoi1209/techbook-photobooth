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
  const screenshotRef = useRef(null);
  const modelRef = useRef(null);

  // Hidden canvas used ONLY for capturing the real video frame
  const captureCanvasRef = useRef(null);

  const navigate = useNavigate();

  const [isCaptured, setIsCaptured] = useState(false);

  const [isCounting, setIsCounting] = useState(false);

  const [counting, setCounting] = useState(5);

  const [isOpenEditor, setIsOpenEditor] = useState(false);

  const [isCameraReady, setIsCameraReady] = useState(false);

  /*
   * ---------------------------------------------------------
   * OUTPUT SIZE
   * ---------------------------------------------------------
   *
   * Final image:
   *
   * 1080 x 1620
   *
   * Ratio:
   *
   * 2 : 3
   *
   */

  const TARGET_WIDTH = 1080;
  const TARGET_HEIGHT = 1620;

  /*
   * ---------------------------------------------------------
   * CAMERA
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
    /*
     * Save model position after dragging.
     *
     * IMPORTANT:
     * We don't update dx/dy during render.
     */

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
   * GET 2:3 CROP
   * ---------------------------------------------------------
   *
   * We take the actual camera video dimensions and
   * center-crop them to 2:3.
   *
   * No stretching.
   *
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

    if (inputRatio > targetRatio) {
      /*
       * Camera is wider than 2:3.
       *
       * Crop left + right.
       */

      srcW = inputHeight * targetRatio;

      srcX = (inputWidth - srcW) / 2;
    } else {
      /*
       * Camera is taller than 2:3.
       *
       * Crop top + bottom.
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
   * We DO NOT use:
   *
   * webcam.getScreenshot()
   *
   * We DO NOT use:
   *
   * getScreenshot()
   *
   * We DO NOT capture the DOM.
   *
   * We DO NOT capture a screenshot of the webcam element.
   *
   * Instead:
   *
   * Camera
   *    ↓
   * HTML VIDEO
   *    ↓
   * Canvas
   *    ↓
   * PNG
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
      console.error("Video dimensions are not available.");

      return null;
    }

    console.log(
      "Capturing video frame:",
      video.videoWidth,
      "x",
      video.videoHeight,
    );

    /*
     * Create/reuse capture canvas.
     */

    let canvas = captureCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");

      captureCanvasRef.current = canvas;
    }

    /*
     * Final PNG size.
     */

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    if (!ctx) {
      console.error("Could not create canvas context.");

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
     * Clear canvas.
     */

    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    /*
     * Draw CURRENT VIDEO FRAME.
     *
     * This is the important part.
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
     * Export LOSSLESS PNG.
     */

    const pngData = canvas.toDataURL("image/png");

    console.log("Captured PNG:", TARGET_WIDTH, "x", TARGET_HEIGHT);

    return pngData;
  }, [getCropDimensions]);

  /*
   * ---------------------------------------------------------
   * CAPTURE IMAGE
   * ---------------------------------------------------------
   */

  const captureImg = () => {
    /*
     * Prevent multiple clicks.
     */

    if (isCounting || isCaptured) {
      return;
    }

    /*
     * Make sure camera is ready.
     */

    if (!isCameraReady) {
      console.warn("Camera is not ready yet.");

      return;
    }

    /*
     * Start from 5.
     */

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
   * 5 → 4 → 3 → 2 → 1 → CAPTURE
   *
   */

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    /*
     * 5 → 4
     * 4 → 3
     * 3 → 2
     * 2 → 1
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
     * Keep "1" visible for one second.
     *
     * Then capture the actual video frame.
     */

    if (counting === 1) {
      const timer = setTimeout(() => {
        /*
         * Stop countdown first.
         */

        setIsCounting(false);

        /*
         * ---------------------------------------------------
         * CAPTURE ACTUAL VIDEO FRAME
         * ---------------------------------------------------
         */

        const base64Data = captureVideoFrame();

        if (!base64Data) {
          console.error("Failed to capture video frame.");

          return;
        }

        /*
         * Save RAW camera PNG.
         */

        setCapturedImg(base64Data);

        /*
         * If your output page expects
         * capturedImgWithFrame, use the same
         * high-resolution PNG for now.
         *
         * This does NOT screenshot the DOM.
         */

        if (setCapturedImgWithFrame) {
          setCapturedImgWithFrame(base64Data);
        }

        /*
         * Show captured state.
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
      /*
       * Don't allow model editing while captured.
       */

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
                {/* MOVE LEFT */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("left")}
                >
                  <MdArrowLeft />
                </div>

                {/* MOVE RIGHT */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("right")}
                >
                  <MdArrowRight />
                </div>

                {/* MOVE UP */}

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("up")}
                >
                  <MdOutlineArrowDropUp />
                </div>

                {/* MOVE DOWN */}

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
                 * ------------------------------------------------
                 * CAPTURED IMAGE
                 * ------------------------------------------------
                 */

                <div className="capturedImgContainer flex-row-center">
                  {capturedImg ? (
                    <img src={capturedImg} alt="capturedImg" />
                  ) : (
                    <span className="loader2"></span>
                  )}
                </div>
              ) : (
                /*
                 * ------------------------------------------------
                 * LIVE CAMERA
                 * ------------------------------------------------
                 */

                <div
                  ref={screenshotRef}
                  className="webcamWithModel flex-row-center"
                >
                  {/* -------------------------------------------
                      REAL BACK CAMERA
                  -------------------------------------------- */}

                  <Webcam
                    ref={webcamRef}
                    id="webcam"
                    audio={false}
                    /*
                     * IMPORTANT:
                     * Back camera.
                     */

                    mirrored={false}
                    videoConstraints={{
                      facingMode: {
                        exact: "environment",
                      },

                      /*
                       * Request high resolution.
                       *
                       * Actual resolution depends on
                       * the device/browser.
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
                      gridArea: "1 / 1",

                      width: "100%",
                      height: "100%",

                      /*
                       * Keep camera aspect visually
                       * consistent with container.
                       */

                      objectFit: "cover",

                      /*
                       * Absolutely NO MIRROR.
                       */

                      transform: "scaleX(1)",

                      display: "block",
                    }}
                  />

                  {/* -------------------------------------------
                      CAMERA LOADING
                  -------------------------------------------- */}

                  {!isCameraReady && (
                    <div
                      style={{
                        gridArea: "1 / 1",

                        width: "100%",
                        height: "100%",

                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",

                        background: "rgba(0,0,0,0.75)",

                        color: "#fff",

                        zIndex: 5,

                        fontSize: "18px",
                      }}
                    >
                      Starting Camera...
                    </div>
                  )}

                  {/* -------------------------------------------
                      COUNTDOWN
                  -------------------------------------------- */}

                  {isCounting && counting > 0 && (
                    <div className="countdownOverlay">
                      <div key={counting} className="countdownNumber">
                        {counting}
                      </div>

                      <div className="countdownText">GET READY</div>
                    </div>
                  )}

                  {/* -------------------------------------------
                      MODEL
                  -------------------------------------------- */}

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
                      }}
                    >
                      <img
                        src="/model-virat.png"
                        alt="model"
                        draggable={false}
                      />
                    </div>
                  </Draggable>
                </div>
              )}

              {/* FRAME */}

              <div className="frameContainer flex-row-center">
                <img src={frame} alt="frame" draggable={false} />
              </div>
            </div>
          </div>
        </div>

        {/* BUTTONS */}

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

      {/* Hidden canvas reference is intentionally not rendered.
          It is created when captureVideoFrame() runs. */}
    </div>
  );
}
