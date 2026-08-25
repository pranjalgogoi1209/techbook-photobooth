import React, { useState, useRef, useEffect, useCallback } from "react";

import Draggable from "react-draggable";
import "./cameraPage.scss";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

import { MdCameraswitch } from "react-icons/md";

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

  /*
   * =========================================================
   * CAMERA MODE
   * =========================================================
   *
   * IMPORTANT:
   *
   * sessionStorage keeps the selected camera while navigating
   * between React pages.
   *
   * Refreshing the browser starts again with BACK camera.
   */

  const [cameraFacingMode, setCameraFacingMode] = useState(() => {
    const savedCamera = sessionStorage.getItem("photobooth-camera-facing");

    return savedCamera === "user" ? "user" : "environment";
  });

  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);

  /*
   * =========================================================
   * OTHER STATE
   * =========================================================
   */

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
   * 2:3
   *
   * 1080 x 1620
   */

  const TARGET_WIDTH = 1080;
  const TARGET_HEIGHT = 1620;

  /*
   * =========================================================
   * SAVE CAMERA MODE
   * =========================================================
   */

  useEffect(() => {
    sessionStorage.setItem("photobooth-camera-facing", cameraFacingMode);
  }, [cameraFacingMode]);

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

    console.log("Camera:", cameraFacingMode);

    console.log(
      "Actual camera resolution:",
      video.videoWidth,
      "x",
      video.videoHeight,
    );

    setIsCameraReady(true);
    setIsSwitchingCamera(false);
  }, [cameraFacingMode]);

  /*
   * =========================================================
   * CAMERA ERROR
   * =========================================================
   */

  const handleCameraError = useCallback((error) => {
    console.error("Camera error:", error);

    setIsCameraReady(false);
    setIsSwitchingCamera(false);
  }, []);

  /*
   * =========================================================
   * SWITCH CAMERA
   * =========================================================
   */

  const switchCamera = () => {
    if (isCounting || isSwitchingCamera || isCaptured) {
      return;
    }

    setIsSwitchingCamera(true);
    setIsCameraReady(false);

    setCameraFacingMode((previous) =>
      previous === "environment" ? "user" : "environment",
    );
  };

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
     * Wider than 2:3
     */

    if (inputRatio > targetRatio) {
      srcW = inputHeight * targetRatio;

      srcX = (inputWidth - srcW) / 2;
    } else {
      /*
       * Taller than 2:3
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
     * =====================================================
     * CANVAS
     * =====================================================
     */

    let canvas = captureCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");

      captureCanvasRef.current = canvas;
    }

    canvas.width = TARGET_WIDTH;

    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    if (!ctx) {
      console.error("Canvas context unavailable.");

      return null;
    }

    ctx.imageSmoothingEnabled = true;

    ctx.imageSmoothingQuality = "high";

    /*
     * =====================================================
     * CAMERA CROP
     * =====================================================
     */

    const { srcX, srcY, srcW, srcH } = getCropDimensions(
      video.videoWidth,
      video.videoHeight,
    );

    /*
     * =====================================================
     * DRAW CAMERA
     * =====================================================
     */

    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    /*
     * FRONT CAMERA
     *
     * Preview is mirrored.
     * Canvas must also be mirrored.
     */

    if (cameraFacingMode === "user") {
      ctx.save();

      ctx.translate(TARGET_WIDTH, 0);

      ctx.scale(-1, 1);

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

      ctx.restore();
    } else {
      /*
       * BACK CAMERA
       *
       * Never mirror.
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
    }

    /*
     * =====================================================
     * LOAD MODEL
     * =====================================================
     */

    let modelImage;

    try {
      modelImage = await loadImage("/model-virat.png");
    } catch (error) {
      console.error("Could not load model image:", error);

      return null;
    }

    /*
     * =====================================================
     * MODEL POSITION
     * =====================================================
     */

    const containerRect = container.getBoundingClientRect();

    const modelRect = modelElement.getBoundingClientRect();

    const scale = TARGET_WIDTH / containerRect.width;

    const modelX = (modelRect.left - containerRect.left) * scale;

    const modelY = (modelRect.top - containerRect.top) * scale;

    /*
     * =====================================================
     * MODEL SIZE
     * =====================================================
     *
     * Preserve original aspect ratio.
     */

    const modelWidth = modelRect.width * scale;

    const modelAspectRatio = modelImage.naturalHeight / modelImage.naturalWidth;

    const modelHeight = modelWidth * modelAspectRatio;

    /*
     * =====================================================
     * DRAW MODEL
     * =====================================================
     */

    ctx.drawImage(modelImage, modelX, modelY, modelWidth, modelHeight);

    /*
     * =====================================================
     * LOAD FRAME
     * =====================================================
     */

    let frameImage;

    try {
      frameImage = await loadImage(frame);
    } catch (error) {
      console.error("Could not load frame image:", error);

      return null;
    }

    /*
     * =====================================================
     * DRAW FRAME
     * =====================================================
     */

    ctx.drawImage(frameImage, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    /*
     * =====================================================
     * EXPORT
     * =====================================================
     */

    const finalImage = canvas.toDataURL("image/png");

    console.log("Final image:", `${TARGET_WIDTH}x${TARGET_HEIGHT}`);

    console.log("Captured camera mode:", cameraFacingMode);

    return finalImage;
  }, [
    getCropDimensions,
    loadImage,

    /*
     * IMPORTANT:
     *
     * This MUST be here.
     *
     * Otherwise captureCompleteImage
     * can keep the old camera mode.
     */
    cameraFacingMode,
  ]);

  /*
   * =========================================================
   * CAPTURE
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
   */

  useEffect(() => {
    if (!isCounting) {
      return;
    }

    if (counting > 1) {
      const timer = setTimeout(() => {
        setCounting((previous) => previous - 1);
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }

    if (counting === 1) {
      const timer = setTimeout(async () => {
        setIsCounting(false);

        const finalImage = await captureCompleteImage();

        if (!finalImage) {
          console.error("Failed to create final image.");

          return;
        }

        setCapturedImg(finalImage);

        if (setCapturedImgWithFrame) {
          setCapturedImgWithFrame(finalImage);
        }

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

      {/* MAIN */}

      <div className="mainContainer flex-col-center">
        <div className="wrapper flex-col-center">
          <div className="cameraContainerWrapper flex-col-center">
            {/* EDITOR */}

            {isOpenEditor && !isCaptured && (
              <div className="editorContainer flex-row-center">
                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("left")}
                >
                  <MdArrowLeft />
                </div>

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("right")}
                >
                  <MdArrowRight />
                </div>

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("up")}
                >
                  <MdOutlineArrowDropUp />
                </div>

                <div
                  className="moveBtn flex-row-center"
                  onClick={() => handleMoving("down")}
                >
                  <MdOutlineArrowDropDown />
                </div>

                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("inc")}
                >
                  <GoPlus />
                </div>

                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("dec")}
                >
                  <AiOutlineMinus />
                </div>

                <div
                  className="flex-row-center closeEditorBtn"
                  onClick={() => setIsOpenEditor(false)}
                >
                  <MdOutlineDone />
                </div>
              </div>
            )}

            {/* CAMERA */}

            <div
              ref={cameraContainerRef}
              className="cameraContainer flex-row-center"
              style={{
                position: "relative",
                overflow: "hidden",
                aspectRatio: "2 / 3",
              }}
            >
              {!isCaptured && (
                <>
                  {/* WEBCAM */}

                  <Webcam
                    key={cameraFacingMode}
                    ref={webcamRef}
                    id="webcam"
                    audio={false}
                    /*
                     * FRONT = mirrored
                     * BACK = normal
                     */

                    mirrored={cameraFacingMode === "user"}
                    videoConstraints={{
                      facingMode: {
                        ideal: cameraFacingMode,
                      },

                      width: {
                        ideal: 2160,
                      },

                      height: {
                        ideal: 3240,
                      },
                    }}
                    onUserMedia={() => {
                      handleCameraReady();
                      setIsSwitchingCamera(false);
                    }}
                    onUserMediaError={(error) => {
                      handleCameraError(error);

                      setIsSwitchingCamera(false);
                    }}
                    style={{
                      position: "absolute",

                      top: 0,
                      left: 0,

                      width: "100%",
                      height: "100%",

                      objectFit: "cover",

                      zIndex: 1,

                      display: "block",

                      transform: "none",
                    }}
                  />

                  {/* LOADING */}

                  {(!isCameraReady || isSwitchingCamera) && (
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

                        zIndex: 25,

                        fontSize: "18px",
                      }}
                    >
                      {isSwitchingCamera
                        ? "Switching Camera..."
                        : "Starting Camera..."}
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

                  {/* MODEL */}

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

                  {/* FRAME */}

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

              {/* CAMERA SWITCH */}

              {!isCaptured && (
                <button
                  type="button"
                  onClick={switchCamera}
                  disabled={isCounting || isSwitchingCamera}
                  className="cameraSwitchBtn"
                  aria-label="Switch camera"
                >
                  <MdCameraswitch />
                </button>
              )}

              {/* CAPTURED IMAGE */}

              {isCaptured && capturedImg && (
                <img
                  src={capturedImg}
                  alt="capturedImg"
                  style={{
                    position: "absolute",

                    inset: 0,

                    width: "100%",

                    height: "100%",

                    objectFit: "cover",

                    objectPosition: "center",

                    zIndex: 1,

                    display: "block",
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* BUTTONS */}

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
