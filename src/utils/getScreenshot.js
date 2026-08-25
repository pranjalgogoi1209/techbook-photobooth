const getScreenshot = (options, callback) => {
  const { webcam, model, container, frame, type = "withoutFrame" } = options;

  if (!webcam) {
    console.error("Webcam reference not found");
    return;
  }

  const video = webcam.video;

  if (!video) {
    console.error("Webcam video element not found");
    return;
  }

  if (
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    console.error("Webcam video is not ready");
    return;
  }

  if (!container) {
    console.error("Camera container not found");
    return;
  }

  /*
   * ---------------------------------------------------------
   * CAMERA CONTAINER SIZE
   * ---------------------------------------------------------
   */

  const containerRect = container.getBoundingClientRect();

  const width = Math.round(containerRect.width);
  const height = Math.round(containerRect.height);

  /*
   * Use a high resolution canvas.
   *
   * 2x gives a much better PNG on high-resolution screens.
   */

  const scale = 2;

  const canvas = document.createElement("canvas");

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");

  ctx.scale(scale, scale);

  /*
   * ---------------------------------------------------------
   * BACKGROUND
   * ---------------------------------------------------------
   */

  ctx.fillStyle = "#212121";
  ctx.fillRect(0, 0, width, height);

  /*
   * ---------------------------------------------------------
   * DRAW CAMERA
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Only the webcam is mirrored.
   *
   * The canvas itself is NEVER flipped.
   */

  const videoAspect = video.videoWidth / video.videoHeight;

  const containerAspect = width / height;

  let drawWidth;
  let drawHeight;
  let drawX;
  let drawY;

  /*
   * Reproduce object-fit: cover.
   */

  if (videoAspect > containerAspect) {
    /*
     * Video is wider than container.
     */

    drawHeight = height;
    drawWidth = height * videoAspect;

    drawX = (width - drawWidth) / 2;
    drawY = 0;
  } else {
    /*
     * Video is taller than container.
     */

    drawWidth = width;
    drawHeight = width / videoAspect;

    drawX = 0;
    drawY = (height - drawHeight) / 2;
  }

  /*
   * ---------------------------------------------------------
   * MIRROR ONLY THE CAMERA
   * ---------------------------------------------------------
   */

  ctx.save();

  ctx.translate(width, 0);
  ctx.scale(-1, 1);

  ctx.drawImage(video, width - drawX - drawWidth, drawY, drawWidth, drawHeight);

  ctx.restore();

  /*
   * ---------------------------------------------------------
   * DRAW MODEL
   * ---------------------------------------------------------
   *
   * The model is drawn normally.
   *
   * NO scaleX(-1)
   *
   * This is what fixes the model moving from right -> left.
   */

  if (model) {
    const modelRect = model.getBoundingClientRect();

    const modelX = modelRect.left - containerRect.left;

    const modelY = modelRect.top - containerRect.top;

    const modelWidth = modelRect.width;
    const modelHeight = modelRect.height;

    const modelImage = model.querySelector("img");

    if (modelImage && modelImage.complete) {
      ctx.drawImage(modelImage, modelX, modelY, modelWidth, modelHeight);
    }
  }

  /*
   * ---------------------------------------------------------
   * FRAME
   * ---------------------------------------------------------
   */

  if (type === "withFrame" && frame) {
    const frameImage = new Image();

    frameImage.onload = () => {
      ctx.drawImage(frameImage, 0, 0, width, height);

      const result = canvas.toDataURL("image/png", 1.0);

      callback(result);
    };

    frameImage.onerror = () => {
      console.error("Unable to load frame");

      const result = canvas.toDataURL("image/png", 1.0);

      callback(result);
    };

    frameImage.src = typeof frame === "string" ? frame : frame.src;
  } else {
    /*
     * -------------------------------------------------------
     * WITHOUT FRAME
     * -------------------------------------------------------
     */

    const result = canvas.toDataURL("image/png", 1.0);

    callback(result);
  }
};

export default getScreenshot;
