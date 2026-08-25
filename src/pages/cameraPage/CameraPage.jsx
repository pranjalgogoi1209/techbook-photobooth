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

import captureBtn from "./../../assets/cameraPage/captureBtn.png";
import retakeBtn from "./../../assets/cameraPage/retakeBtn.png";
import submitBtn from "./../../assets/cameraPage/submitBtn.png";
import frame from "./../../assets/cameraPage/frame.png";
import bg from "./../../assets/bg.webp";

/*
 * ============================================================
 * CAPTURE HTML VIDEO + MODEL + FRAME
 * ============================================================
 *
 * Final output:
 *
 * 1080 x 1620
 * 2:3 portrait
 * PNG
 *
 * Camera is mirrored.
 * Model is NOT mirrored.
 * Frame is NOT mirrored.
 */

const capturePhoto = ({ webcamRef, modelRef, containerRef, frameImage }) => {
  return new Promise((resolve, reject) => {
    try {
      const webcam = webcamRef.current;

      if (!webcam) {
        reject(new Error("Webcam component not found"));
        return;
      }

      /*
       * react-webcam exposes the real HTML video
       * through webcam.video
       */

      const video = webcam.video;

      if (!video) {
        reject(new Error("HTML video element not found"));
        return;
      }

      /*
       * Make sure camera has a usable frame.
       */

      if (
        video.readyState < 2 ||
        video.videoWidth <= 0 ||
        video.videoHeight <= 0
      ) {
        reject(new Error("Camera video is not ready"));
        return;
      }

      const container = containerRef.current;

      if (!container) {
        reject(new Error("Camera container not found"));
        return;
      }

      /*
       * ======================================================
       * FINAL IMAGE SIZE
       * ======================================================
       *
       * 1080 x 1620 = exactly 2:3
       */

      const OUTPUT_WIDTH = 1080;
      const OUTPUT_HEIGHT = 1620;

      const canvas = document.createElement("canvas");

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      const ctx = canvas.getContext("2d", {
        alpha: false,
      });

      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      /*
       * ======================================================
       * CAMERA SOURCE
       * ======================================================
       */

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      /*
       * ======================================================
       * CAMERA CROP
       * ======================================================
       *
       * Final image is 2:3.
       *
       * We crop the camera exactly like object-fit: cover.
       */

      const outputRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;

      const videoRatio = videoWidth / videoHeight;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = videoWidth;
      let sourceHeight = videoHeight;

      if (videoRatio > outputRatio) {
        /*
         * Camera is wider than 2:3.
         *
         * Crop left/right.
         */

        sourceWidth = videoHeight * outputRatio;

        sourceX = (videoWidth - sourceWidth) / 2;
      } else {
        /*
         * Camera is taller than 2:3.
         *
         * Crop top/bottom.
         */

        sourceHeight = videoWidth / outputRatio;

        sourceY = (videoHeight - sourceHeight) / 2;
      }

      /*
       * ======================================================
       * DRAW CAMERA
       * ======================================================
       *
       * ONLY THE CAMERA IS MIRRORED.
       *
       * The canvas itself is NOT mirrored.
       */

      ctx.save();

      ctx.translate(OUTPUT_WIDTH, 0);

      ctx.scale(-1, 1);

      ctx.drawImage(
        video,

        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,

        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
      );

      ctx.restore();

      /*
       * ======================================================
       * MODEL
       * ======================================================
       *
       * Draw model normally.
       *
       * DO NOT flip it.
       */

      if (modelRef.current) {
        const model = modelRef.current;

        const containerRect = container.getBoundingClientRect();

        const modelRect = model.getBoundingClientRect();

        /*
         * Model position relative to camera.
         */

        const modelLeft = modelRect.left - containerRect.left;

        const modelTop = modelRect.top - containerRect.top;

        /*
         * Convert browser coordinates
         * to 1080x1620 coordinates.
         */

        const scaleX = OUTPUT_WIDTH / containerRect.width;

        const scaleY = OUTPUT_HEIGHT / containerRect.height;

        const modelX = modelLeft * scaleX;

        const modelY = modelTop * scaleY;

        const modelWidth = modelRect.width * scaleX;

        const modelHeight = modelRect.height * scaleY;

        const modelImage = model.querySelector("img");

        if (modelImage && modelImage.complete && modelImage.naturalWidth > 0) {
          ctx.drawImage(modelImage, modelX, modelY, modelWidth, modelHeight);
        }
      }

      /*
       * ======================================================
       * FRAME
       * ======================================================
       */

      if (frameImage) {
        const frame = new Image();

        frame.onload = () => {
          ctx.drawImage(frame, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

          /*
           * PNG is lossless.
           */

          const image = canvas.toDataURL("image/png");

          resolve(image);
        };

        frame.onerror = () => {
          console.error("Frame image could not be loaded");

          /*
           * Still return camera + model
           * if frame fails.
           */

          const image = canvas.toDataURL("image/png");

          resolve(image);
        };

        /*
         * Imported Vite asset can be:
         *
         * "/assets/frame....png"
         *
         * or an object with .src
         */

        frame.src =
          typeof frameImage === "string" ? frameImage : frameImage.src;
      } else {
        const image = canvas.toDataURL("image/png");

        resolve(image);
      }
    } catch (error) {
      reject(error);
    }
  });
};

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
  /*
   * ==========================================================
   * REFS
   * ==========================================================
   */

  const webcamRef = useRef(null);

  const screenshotRef = useRef(null);

  const modelRef = useRef(null);

  /*
   * ==========================================================
   * NAVIGATION
   * ==========================================================
   */

  const navigate = useNavigate();

  /*
   * ==========================================================
   * STATE
   * ==========================================================
   */

  const [isCaptured, setIsCaptured] = useState(false);

  const [isCounting, setIsCounting] = useState(false);

  const [counting, setCounting] = useState(5);

  const [isOpenEditor, setIsOpenEditor] = useState(false);

  /*
   * ==========================================================
   * MODEL DRAG
   * ==========================================================
   */

  const handleStart = () => {
    // No state update required.
  };

  const handleDrag = () => {
    // No state update required.
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
      setDx(parseFloat(match[1]));

      setDy(parseFloat(match[2]));
    }
  };

  /*
   * ==========================================================
   * EDITOR
   * ==========================================================
   */

  const handleEditor = () => {
    setIsOpenEditor(true);
  };

  /*
   * ==========================================================
   * CAPTURE BUTTON
   * ==========================================================
   */

  const captureImg = () => {
    if (isCounting || isCaptured) {
      return;
    }

    /*
     * Start countdown.
     */

    setCounting(5);
    setIsCounting(true);
  };

  /*
   * ==========================================================
   * RETAKE
   * ==========================================================
   */

  const retakeImg = () => {
    setIsCaptured(false);

    setCapturedImg("");

    setCounting(5);

    setIsCounting(false);
  };

  /*
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  const submitImg = () => {
    if (isCaptured) {
      navigate("/output");
    }
  };

  /*
   * ==========================================================
   * MOVE MODEL
   * ==========================================================
   */

  const handleMoving = (direction) => {
    switch (direction) {
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
   * ==========================================================
   * RESIZE MODEL
   * ==========================================================
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
   * ==========================================================
   * COUNTDOWN
   * ==========================================================
   *
   * 5
   * 4
   * 3
   * 2
   * 1
   * CAPTURE
   *
   * ZERO IS NEVER DISPLAYED.
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
        setCounting((prev) => prev - 1);
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }

    /*
     * ========================================================
     * COUNTDOWN === 1
     * ========================================================
     *
     * Keep 1 visible for one second,
     * then capture.
     */

    if (counting === 1) {
      const timer = setTimeout(async () => {
        try {
          /*
           * Stop countdown.
           */

          setIsCounting(false);

          /*
           * ==================================================
           * CAPTURE FROM HTML VIDEO
           * ==================================================
           */

          const image = await capturePhoto({
            webcamRef,
            modelRef,
            containerRef: screenshotRef,
            frameImage: frame,
          });

          console.log("Captured PNG successfully");

          /*
           * Save normal captured image.
           */

          setCapturedImg(image);

          /*
           * Save same image with
           * frame.
           *
           * Since our canvas already
           * draws the frame, both are
           * identical.
           */

          setCapturedImgWithFrame(image);

          /*
           * Show captured image.
           */

          setIsCaptured(true);
        } catch (error) {
          console.error("Photo capture failed:", error);

          /*
           * Allow user to try again.
           */

          setIsCounting(false);
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isCounting, counting, setCapturedImg, setCapturedImgWithFrame]);

  /*
   * ==========================================================
   * KEYBOARD CONTROLS
   * ==========================================================
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
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="CameraPage flex-col-center">
      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="cameraPageBgContainer flex-row-center">
        <img src={bg} alt="cameraPageBg" />
      </div>

      {/* =====================================================
          MAIN CONTAINER
          ===================================================== */}

      <div className="mainContainer flex-col-center">
        <div className="wrapper flex-col-center">
          {/* =================================================
              CAMERA AREA
              ================================================= */}

          <div className="cameraContainerWrapper flex-col-center">
            {/* =================================================
                EDITOR
                ================================================= */}

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

                {/* PLUS */}

                <div
                  className="resizeBtn flex-row-center"
                  onClick={() => handleResizing("inc")}
                >
                  <GoPlus />
                </div>

                {/* MINUS */}

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

            <div className="cameraContainer flex-row-center">
              {isCaptured ? (
                /* =================================================
                   CAPTURED IMAGE
                   ================================================= */

                <div className="capturedImgContainer flex-row-center">
                  {capturedImg ? (
                    <img src={capturedImg} alt="capturedImg" />
                  ) : (
                    <span className="loader2"></span>
                  )}
                </div>
              ) : (
                /* =================================================
                   LIVE CAMERA
                   ================================================= */

                <div
                  ref={screenshotRef}
                  className="webcamWithModel flex-row-center"
                >
                  {/* =================================================
                      HTML VIDEO
                      ================================================= */}

                  <Webcam
                    ref={webcamRef}
                    id="webcam"
                    audio={false}
                    forceScreenshotSourceSize={true}
                    mirrored={true}
                    videoConstraints={{
                      facingMode: "user",
                    }}
                  />

                  {/* =================================================
                      COUNTDOWN
                      ================================================= */}

                  {isCounting && counting > 0 && (
                    <div className="countdownOverlay">
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

              {/* =================================================
                  FRAME
                  ================================================= */}

              <div className="frameContainer flex-row-center">
                <img src={frame} alt="frame" draggable={false} />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            BUTTONS
            ===================================================== */}

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
