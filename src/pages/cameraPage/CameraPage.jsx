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
  const cameraStageRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const navigate = useNavigate();

  const [isCaptured, setIsCaptured] = useState(Boolean(capturedImg));

  const [isCounting, setIsCounting] = useState(false);
  const [counting, setCounting] = useState(5);
  const [isOpenEditor, setIsOpenEditor] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  /*
   * =========================================================
   * FINAL IMAGE
   * =========================================================
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
      console.warn("Video element not found.");
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
   * MODEL MOVEMENT
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
   * MODEL RESIZE
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
   * DRAG
   * =========================================================
   */

  const handleStart = () => {};

  const handleDrag = () => {};

  const handleStop = () => {
    /*
     * Keep the React state as the source of truth.
     *
     * react-draggable's position is already being controlled
     * by the stored dx/dy values through defaultPosition.
     *
     * We don't calculate position from transform here because
     * transform parsing can be unreliable.
     */
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
   * CAMERA 2:3 CROP
   * =========================================================
   */

  const getCropDimensions = useCallback((videoWidth, videoHeight) => {
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

    const videoRatio = videoWidth / videoHeight;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    /*
     * Camera is wider than 2:3.
     *
     * Crop left and right.
     */

    if (videoRatio > targetRatio) {
      sourceHeight = videoHeight;

      sourceWidth = videoHeight * targetRatio;

      sourceX = (videoWidth - sourceWidth) / 2;
    } else {
      /*
       * Camera is taller than 2:3.
       *
       * Crop top and bottom.
       */

      sourceWidth = videoWidth;

      sourceHeight = videoWidth / targetRatio;

      sourceY = (videoHeight - sourceHeight) / 2;
    }

    return {
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
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
        reject(new Error(`Unable to load image: ${src}`));
      };

      image.src = src;
    });
  }, []);

  /*
   * =========================================================
   * CAPTURE COMPLETE IMAGE
   * =========================================================
   *
   * VIDEO FRAME
   *      +
   * MODEL
   *      +
   * FRAME
   *      ↓
   * 1080 x 1620 PNG
   */

  const captureCompleteImage = useCallback(async () => {
    const video = webcamRef.current?.video;

    const stage = cameraStageRef.current;

    const model = modelRef.current;

    if (!video) {
      console.error("Video not available.");
      return null;
    }

    if (!stage) {
      console.error("Camera stage not available.");
      return null;
    }

    if (!model) {
      console.error("Model element not available.");
      return null;
    }

    if (video.readyState < 2) {
      console.error("Video is not ready.");
      return null;
    }

    if (!video.videoWidth || !video.videoHeight) {
      console.error("Invalid camera dimensions.");
      return null;
    }

    /*
     * ---------------------------------------------------------
     * CANVAS
     * ---------------------------------------------------------
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

    /*
     * High quality rendering.
     */

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    /*
     * ---------------------------------------------------------
     * CAMERA CROP
     * ---------------------------------------------------------
     */

    const { sourceX, sourceY, sourceWidth, sourceHeight } = getCropDimensions(
      video.videoWidth,
      video.videoHeight,
    );

    /*
     * ---------------------------------------------------------
     * CAMERA FRAME
     * ---------------------------------------------------------
     *
     * Draw directly from the HTML video.
     */

    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    );

    /*
     * ---------------------------------------------------------
     * MODEL POSITION
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     *
     * Use ONE scale factor because the source and target
     * are both 2:3.
     *
     * This prevents stretching.
     */

    const stageRect = stage.getBoundingClientRect();

    const modelRect = model.getBoundingClientRect();

    /*
     * Use the width scale only.
     *
     * Because stage is 2:3 and target is 2:3,
     * X and Y use the same scale.
     */

    const scale = TARGET_WIDTH / stageRect.width;

    /*
     * Model's displayed position relative to
     * the exact camera stage.
     */

    const modelX = (modelRect.left - stageRect.left) * scale;

    const modelY = (modelRect.top - stageRect.top) * scale;

    /*
     * Preserve model's natural aspect ratio.
     *
     * Don't independently stretch width/height.
     */

    const modelWidth = modelRect.width * scale;

    const modelHeight = modelRect.height * scale;

    console.log("Model final position:", {
      x: modelX,
      y: modelY,
      width: modelWidth,
      height: modelHeight,
    });

    /*
     * ---------------------------------------------------------
     * MODEL IMAGE
     * ---------------------------------------------------------
     */

    let modelImage;

    try {
      modelImage = await loadImage("/model-virat.png");
    } catch (error) {
      console.error(error);
      return null;
    }

    /*
     * Draw model.
     */

    ctx.drawImage(modelImage, modelX, modelY, modelWidth, modelHeight);

    /*
     * ---------------------------------------------------------
     * FRAME
     * ---------------------------------------------------------
     */

    let frameImage;

    try {
      frameImage = await loadImage(frame);
    } catch (error) {
      console.error(error);
      return null;
    }

    /*
     * Frame is always exactly the same size
     * as the final canvas.
     */

    ctx.drawImage(frameImage, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    /*
     * ---------------------------------------------------------
     * PNG
     * ---------------------------------------------------------
     */

    const finalImage = canvas.toDataURL("image/png");

    console.log("FINAL IMAGE:", TARGET_WIDTH, "x", TARGET_HEIGHT);

    return finalImage;
  }, [getCropDimensions, loadImage]);

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
    setCapturedImg("");

    if (setCapturedImgWithFrame) {
      setCapturedImgWithFrame("");
    }

    setIsCaptured(false);
    setIsCounting(false);
    setCounting(5);
    setIsCameraReady(false);
  };

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const submitImg = () => {
    if (!capturedImg) {
      console.warn("No captured image.");
      return;
    }

    navigate("/output");
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

      return () => clearTimeout(timer);
    }

    if (counting === 1) {
      const timer = setTimeout(async () => {
        setIsCounting(false);

        /*
         * IMPORTANT:
         *
         * Capture BEFORE setting isCaptured=true.
         *
         * This guarantees the video and model are still
         * mounted when the canvas is created.
         */

        const finalImage = await captureCompleteImage();

        if (!finalImage) {
          console.error("Failed to create final image.");
          return;
        }

        /*
         * -----------------------------------------------------
         * SAVE COMPLETE IMAGE
         * -----------------------------------------------------
         *
         * This is now:
         *
         * CAMERA + MODEL + FRAME
         */

        setCapturedImg(finalImage);

        /*
         * IMPORTANT:
         *
         * OutputPage uploads capturedImgWithFrame.
         *
         * Therefore this state gets the SAME complete PNG.
         */

        if (setCapturedImgWithFrame) {
          setCapturedImgWithFrame(finalImage);
        }

        /*
         * Only now switch to captured mode.
         */

        setIsCaptured(true);
      }, 1000);

      return () => clearTimeout(timer);
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
   * KEYBOARD
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

          {/* =================================================
              CAMERA STAGE
          ================================================= */}

          <div
            ref={cameraStageRef}
            className="cameraContainer flex-row-center"
            style={{
              position: "relative",

              /*
               * FORCE THE CAMERA STAGE TO EXACTLY 2:3.
               *
               * This is the key fix for the captured preview.
               */

              aspectRatio: "2 / 3",

              width: "100%",

              maxWidth: "540px",

              height: "auto",

              overflow: "hidden",

              flexShrink: 0,
            }}
          >
            {/* =================================================
                LIVE CAMERA
            ================================================= */}

            {!isCaptured && (
              <>
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

                    /*
                     * Live preview remains exactly
                     * as before.
                     */

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

                      inset: 0,

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

                {isCounting && (
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

                      /*
                       * Do NOT set height.
                       *
                       * The image's natural aspect ratio
                       * controls the height.
                       */

                      height: "auto",

                      zIndex: 2,

                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/model-virat.png"
                      alt="model"
                      draggable={false}
                      style={{
                        width: "100%",
                        height: "auto",

                        display: "block",

                        objectFit: "contain",
                      }}
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

                    inset: 0,

                    width: "100%",
                    height: "100%",

                    zIndex: 3,

                    pointerEvents: "none",
                  }}
                >
                  <img
                    src={frame}
                    alt="frame"
                    style={{
                      width: "100%",
                      height: "100%",

                      objectFit: "fill",

                      display: "block",
                    }}
                    draggable={false}
                  />
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
                  /*
                   * IMPORTANT:
                   * Don't force this image into an arbitrary
                   * width/height combination.
                   */

                  position: "absolute",

                  inset: 0,

                  width: "100%",

                  height: "100%",

                  /*
                   * The source itself is exactly 1080x1620.
                   *
                   * contain guarantees the image is never
                   * distorted.
                   */

                  objectFit: "contain",

                  aspectRatio: "2 / 3",

                  display: "block",

                  zIndex: 1,
                }}
              />
            )}
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
