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

import getScreenshot from "../../utils/getScreenshot";

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

  const navigate = useNavigate();

  const [isCaptured, setIsCaptured] = useState(false);

  const [isCounting, setIsCounting] = useState(false);

  const [counting, setCounting] = useState(5);

  const [isOpenEditor, setIsOpenEditor] = useState(false);

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
     * This only runs after dragging has finished.
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
   * CAPTURE BUTTON
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

    setCounting(5);

    setIsCounting(false);
  };

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  const submitImg = () => {
    if (isCaptured) {
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
   * IMPORTANT:
   *
   * We NEVER call another setState() from inside
   * setCounting().
   *
   * This removes:
   *
   * "Cannot update a component (App) while rendering
   * a different component (CameraPage)"
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
     * Then capture.
     */

    if (counting === 1) {
      const timer = setTimeout(() => {
        /*
         * Stop countdown first.
         */

        setIsCounting(false);

        /*
         * ---------------------------------------------------
         * CAPTURE WITHOUT FRAME
         * ---------------------------------------------------
         */

        getScreenshot(
          {
            webcam: webcamRef.current,
            model: modelRef.current,
            container: screenshotRef.current,
            type: "withoutFrame",
          },
          (base64Data) => {
            /*
             * These state updates happen inside the
             * asynchronous screenshot callback.
             *
             * They are NOT inside setCounting().
             */

            setCapturedImg(base64Data);

            setIsCaptured(true);
          },
        );

        /*
         * ---------------------------------------------------
         * CAPTURE WITH FRAME
         * ---------------------------------------------------
         */

        getScreenshot(
          {
            webcam: webcamRef.current,
            model: modelRef.current,
            container: screenshotRef.current,
            frame: frame,
            type: "withFrame",
          },
          (base64Data) => {
            setCapturedImgWithFrame(base64Data);
          },
        );
      }, 1000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isCounting, counting, setCapturedImg, setCapturedImgWithFrame]);

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
                  {/* WEBCAM */}

                  <Webcam
                    ref={camRef}
                    id="webcam"
                    audio={false}
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
                      gridArea: "1 / 1",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  {/* COUNTDOWN */}

                  {isCounting && counting > 0 && (
                    <div className="countdownOverlay">
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
    </div>
  );
}
