import html2canvas from "html2canvas";

const getScreenshot = ({ element, type }, callback) => {
  if (!element) return;

  // If the type is "withFrame", apply transformations
  if (type === "withFrame") {
    const modelElement = element.querySelector(".modelContainer");

    if (modelElement) {
      let currentTransform = modelElement.style.transform;
      let translateValues = currentTransform.match(
        /translate\(([^,]+),\s*([^)]+)\)/
      );

      if (translateValues) {
        let x = parseFloat(translateValues[1]);
        let y = parseFloat(translateValues[2]);
        x = -x;
        modelElement.style.transform = `translate(${x}px, ${y}px)`;
      }
    }
  }

  // Capture the screenshot using html2canvas
  html2canvas(element, {
    useCORS: true,
    scale: 3,
  }).then((canvas) => {
    if (type === "withFrame") {
      // Create a new canvas for cropping
      const croppedCanvas = document.createElement("canvas");
      const ctx = croppedCanvas.getContext("2d");

      // Set the new canvas dimensions (same width, but 50px less in height)
      croppedCanvas.width = canvas.width;
      croppedCanvas.height = canvas.height - 50; // Crop 50px from the bottom

      // Ensure the cropping area is properly rendered
      ctx.clearRect(0, 0, croppedCanvas.width, croppedCanvas.height);

      // Draw the original canvas onto the cropped canvas (except the bottom 50px)
      ctx.drawImage(
        canvas,
        0,
        0, // Start at (0, 0) on the source canvas
        canvas.width,
        canvas.height - 50, // Take full width, height minus 50px
        0,
        0, // Place at (0, 0) on the destination canvas
        croppedCanvas.width,
        croppedCanvas.height // Use full dimensions of cropped canvas
      );

      // Convert the cropped canvas to base64 and pass it to the callback
      const base64Image = croppedCanvas.toDataURL("image/png");
      callback(base64Image);
    } else {
      // For other types, just return the full canvas screenshot
      const base64Image = canvas.toDataURL("image/png");
      callback(base64Image);
    }
  });
};

export default getScreenshot;
