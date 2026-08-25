import { useEffect, useRef, useState, useCallback } from "react";
import "./camera-page.scss";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { ToastContainer, toast } from "react-toastify";
import Btn from "../../components/btn/Btn";
import buttonBg from "../../assets/button.png";

const toastOptions = {
  position: "top-center",
  autoClose: 4000,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

// Final output: 2:3 portrait
const TARGET_WIDTH = 1080;
const TARGET_HEIGHT = 1620;

export default function CameraPage({
  capturedImg,
  setCapturedImg,
  selectedTemplate,
}) {
  const navigate = useNavigate();

  const camRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const [previewImg, setPreviewImg] = useState("");
  const [isCaptured, setIsCaptured] = useState(Boolean(capturedImg));

  const [countdown, setCountdown] = useState(3);
  const [isCounting, setIsCounting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // --------------------------------------------------
  // Calculate center crop for 2:3
  // --------------------------------------------------
  const getCropDimensions = useCallback((inputW, inputH) => {
    if (!inputW || !inputH) {
      return {
        srcX: 0,
        srcY: 0,
        srcW: inputW,
        srcH: inputH,
      };
    }

    const inputRatio = inputW / inputH;
    const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;

    let srcX = 0;
    let srcY = 0;
    let srcW = inputW;
    let srcH = inputH;

    if (inputRatio > targetRatio) {
      // Camera is wider than 2:3.
      // Crop left and right.
      srcW = inputH * targetRatio;
      srcX = (inputW - srcW) / 2;
    } else {
      // Camera is taller than 2:3.
      // Crop top and bottom.
      srcH = inputW / targetRatio;
      srcY = (inputH - srcH) / 2;
    }

    return {
      srcX,
      srcY,
      srcW,
      srcH,
    };
  }, []);

  // --------------------------------------------------
  // Camera ready
  // --------------------------------------------------
  const handleCameraReady = useCallback(() => {
    const video = camRef.current?.video;

    if (!video) {
      console.warn("Camera video element not found.");
      return;
    }

    console.log("Camera ready");
    console.log("Video resolution:", video.videoWidth, "x", video.videoHeight);

    setIsCameraReady(true);
  }, []);

  // --------------------------------------------------
  // Camera error
  // --------------------------------------------------
  const handleCameraError = useCallback((error) => {
    console.error("Camera error:", error);

    setIsCameraReady(false);

    toast.error(
      "Unable to access camera. Please allow camera permission.",
      toastOptions,
    );
  }, []);

  // --------------------------------------------------
  // Capture ACTUAL VIDEO FRAME
  //
  // IMPORTANT:
  // We do NOT use webcam.getScreenshot()
  //
  // We directly take the current frame from:
  //
  // <video>
  //
  // and draw it into a canvas.
  // --------------------------------------------------
  const captureVideoFrame = useCallback(() => {
    const video = camRef.current?.video;

    if (!video) {
      console.error("Video element not available.");
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

    // Reuse canvas
    let canvas = captureCanvasRef.current;

    if (!canvas) {
      canvas = document.createElement("canvas");
      captureCanvasRef.current = canvas;
    }

    // Final output resolution
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    const ctx = canvas.getContext("2d", {
      alpha: false,
    });

    if (!ctx) {
      console.error("Unable to create canvas context.");
      return null;
    }

    // High quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Get proportional 2:3 crop
    const { srcX, srcY, srcW, srcH } = getCropDimensions(
      video.videoWidth,
      video.videoHeight,
    );

    // Clear previous frame
    ctx.clearRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    // Draw CURRENT VIDEO FRAME directly
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

    // Export as PNG
    const pngData = canvas.toDataURL("image/png");

    console.log("PNG captured:", TARGET_WIDTH, "x", TARGET_HEIGHT);

    return pngData;
  }, [getCropDimensions]);

  // --------------------------------------------------
  // Countdown
  // --------------------------------------------------
  useEffect(() => {
    let countdownInterval;

    if (!isCounting) {
      return;
    }

    if (countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }

    if (countdown === 0) {
      const imageData = captureVideoFrame();

      if (imageData) {
        setCapturedImg(imageData);
        setPreviewImg(imageData);
        setIsCaptured(true);
      } else {
        toast.error("Failed to capture image. Please try again.", toastOptions);
      }

      setIsCounting(false);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isCounting, countdown, captureVideoFrame, setCapturedImg]);

  // --------------------------------------------------
  // Capture button
  // --------------------------------------------------
  const handleCapture = () => {
    if (!isCameraReady) {
      toast.error("Camera is not ready yet.", toastOptions);
      return;
    }

    setCountdown(3);
    setIsCounting(true);
  };

  // --------------------------------------------------
  // Retake
  // --------------------------------------------------
  const handleRetake = () => {
    setIsCaptured(false);
    setCapturedImg("");
    setPreviewImg("");
    setCountdown(3);
    setIsCounting(false);
  };

  // --------------------------------------------------
  // Next
  // --------------------------------------------------
  const handleSubmit = () => {
    if (!isCaptured || !capturedImg) {
      toast.error("Please capture image first!", toastOptions);
      return;
    }

    navigate("/output");
  };

  // --------------------------------------------------
  // Video constraints
  //
  // We request high resolution.
  //
  // The actual resolution depends on the camera/device/browser.
  // --------------------------------------------------
  const videoConstraints = {
    facingMode: {
      ideal: "environment",
    },

    width: {
      ideal: 2160,
    },

    height: {
      ideal: 3240,
    },
  };

  return (
    <div className="flex-col-center CameraPage">
      <h1 className="title new">
        {isCaptured ? "Do you like it ?" : "Capture Your Photo"}
      </h1>

      <div className="flex-row-center mainCameraWrapper">
        <div
          className="webcamParent"
          style={{
            width: "100%",
            maxWidth: "540px",

            // Exact 2:3 preview
            aspectRatio: "2 / 3",

            position: "relative",

            display: "grid",
            placeItems: "center",

            borderRadius: "16px",
            overflow: "hidden",

            backgroundColor: "#111",
          }}
        >
          {/* -------------------------------------------
              REAL CAMERA VIDEO
          -------------------------------------------- */}
          {!isCaptured && (
            <Webcam
              ref={camRef}
              id="webcam"
              audio={false}
              mirrored={false}
              screenshotFormat="image/png"
              videoConstraints={videoConstraints}
              onUserMedia={handleCameraReady}
              onUserMediaError={handleCameraError}
              style={{
                gridArea: "1 / 1",

                width: "100%",
                height: "100%",

                objectFit: "cover",

                display: "block",

                // The video itself is shown.
                // No screenshot is being used.
              }}
            />
          )}

          {/* -------------------------------------------
              CAMERA LOADING
          -------------------------------------------- */}
          {!isCaptured && !isCameraReady && (
            <div
              style={{
                gridArea: "1 / 1",

                width: "100%",
                height: "100%",

                display: "flex",
                flexDirection: "column",

                alignItems: "center",
                justifyContent: "center",

                background: "#111",
                color: "#fff",

                zIndex: 5,

                textAlign: "center",
                padding: "20px",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                }}
              >
                Starting Camera...
              </span>

              <span
                style={{
                  fontSize: "13px",
                  marginTop: "8px",
                  opacity: 0.7,
                }}
              >
                Please allow camera permission
              </span>
            </div>
          )}

          {/* -------------------------------------------
              CAPTURED IMAGE
          -------------------------------------------- */}
          {isCaptured && previewImg && (
            <img
              className="capturedImage"
              src={previewImg}
              alt="Captured"
              style={{
                gridArea: "1 / 1",

                width: "100%",
                height: "100%",

                objectFit: "cover",

                display: "block",
              }}
            />
          )}

          {/* -------------------------------------------
              COUNTDOWN
          -------------------------------------------- */}
          {!isCaptured && isCounting && (
            <span
              className="countdown"
              style={{
                gridArea: "1 / 1",

                zIndex: 10,

                fontSize: "80px",
                fontWeight: "bold",

                color: "#fff",

                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
              }}
            >
              {countdown}
            </span>
          )}
        </div>
      </div>

      {/* -------------------------------------------
          BUTTONS
      -------------------------------------------- */}
      <div className="flex-row-center bottomButton">
        {isCaptured && (
          <button
            className="img-part retakeBtn"
            onClick={handleRetake}
            type="button"
          >
            <Btn title="RETAKE" bgImage={buttonBg} />
          </button>
        )}

        <button
          className="img-part captureBtn"
          onClick={isCaptured ? handleSubmit : handleCapture}
          disabled={isCounting || (!isCaptured && !isCameraReady)}
          type="button"
        >
          <Btn title={isCaptured ? "NEXT" : "CAPTURE"} bgImage={buttonBg} />
        </button>
      </div>

      <ToastContainer />
    </div>
  );
}
